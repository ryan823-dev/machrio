"""
Machrio ZKH 自动化导入 - FastAPI 服务
部署在 VPS 上, 供 Vercel 前端调用

启动方式:
  uvicorn main:app --host 0.0.0.0 --port 8100

功能:
  POST /api/tasks          - 创建导入任务
  GET  /api/tasks/{id}     - 查询任务状态
  GET  /api/tasks/{id}/download - 下载生成的Excel
  POST /api/tasks/{id}/cancel  - 取消任务
"""

import os
import sys
import uuid
import asyncio
import threading
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

# 将工具包目录加入路径
TOOL_BASE = os.environ.get(
    "TOOL_PATH",
    os.path.join(os.path.dirname(__file__), "tool")
)
CORE_DIR = os.path.join(TOOL_BASE, "核心代码")
SCRAPER_DIR = os.path.join(TOOL_BASE, "爬虫代码")
CONFIG_DIR = os.path.join(TOOL_BASE, "配置文件")

sys.path.insert(0, CORE_DIR)
sys.path.insert(0, SCRAPER_DIR)

app = FastAPI(title="Machrio ZKH Import API", version="1.0.0")

# CORS - 允许 Vercel 前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://machrio.com",
        "https://www.machrio.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# 任务存储
# ============================================================

tasks = {}

class TaskStatus:
    def __init__(self, task_id: str, url: str, max_products: int, skip_ai: bool):
        self.task_id = task_id
        self.url = url
        self.max_products = max_products
        self.skip_ai = skip_ai
        self.status = "pending"  # pending/scraping/processing/generating/completed/failed
        self.progress = 0
        self.message = "准备启动..."
        self.products_found = 0
        self.products_processed = 0
        self.output_file = None
        self.error = None
        self.logs = []
        self.cancelled = False
        self.created_at = datetime.now().isoformat()

    def add_log(self, msg: str):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.logs.append(f"[{timestamp}] {msg}")
        if len(self.logs) > 200:
            self.logs = self.logs[-200:]

    def to_dict(self):
        return {
            "taskId": self.task_id,
            "status": self.status,
            "progress": self.progress,
            "message": self.message,
            "productsFound": self.products_found,
            "productsProcessed": self.products_processed,
            "outputFile": self.output_file,
            "error": self.error,
            "logs": self.logs[-30:],
            "createdAt": self.created_at,
        }


# ============================================================
# API 模型
# ============================================================

class CreateTaskRequest(BaseModel):
    url: str
    maxProducts: int = 10
    skipAI: bool = False


# ============================================================
# 管线执行
# ============================================================

def run_pipeline_thread(task: TaskStatus):
    """在后台线程中运行导入管线"""
    try:
        task.status = "scraping"
        task.progress = 5
        task.message = "正在加载配置..."
        task.add_log("开始导入管线")

        # 加载配置
        from test_complete_flow import load_configs, map_to_machrio_category, extract_machrio_attributes

        # 修补 load_configs 使用正确路径
        import test_complete_flow
        original_base = getattr(test_complete_flow, '_patched', False)
        if not original_base:
            # 动态修改 load_configs 中的 base 路径
            def patched_load_configs():
                import json
                cats_path = os.path.join(CONFIG_DIR, "categories_config.json")
                titles_path = os.path.join(CONFIG_DIR, "title_templates.json")
                prompts_path = os.path.join(CONFIG_DIR, "ai_prompts.json")

                with open(cats_path, "r", encoding="utf-8") as f:
                    categories = json.load(f)
                with open(titles_path, "r", encoding="utf-8") as f:
                    titles = json.load(f)
                with open(prompts_path, "r", encoding="utf-8") as f:
                    prompts = json.load(f)
                return categories, titles, prompts

            test_complete_flow.load_configs = patched_load_configs
            test_complete_flow._patched = True

        task.add_log("配置文件加载完成")
        task.progress = 10

        # 判断URL类型
        url = task.url
        is_category = "zkh.com/c/" in url or "zkh.com/search" in url
        is_product = "zkh.com/item/" in url

        if task.cancelled:
            task.status = "failed"
            task.message = "任务已取消"
            return

        # Step 1: 爬取
        task.status = "scraping"
        task.message = "正在爬取震坤行数据..."
        task.add_log(f"目标URL: {url}")

        scraped_files = []
        output_dir = os.path.join(os.path.dirname(__file__), "output", task.task_id)
        os.makedirs(output_dir, exist_ok=True)
        downloads_dir = os.path.join(output_dir, "downloads")
        os.makedirs(downloads_dir, exist_ok=True)

        try:
            from run_pipeline import run_scrape
            scraped_files = run_scrape(url, output_dir, max_products=task.max_products)

            if scraped_files:
                task.products_found = len(scraped_files)
                task.progress = 40
                task.message = f"爬取完成, 获得 {len(scraped_files)} 个产品"
                task.add_log(f"爬取完成: {len(scraped_files)} 个产品文件")
            else:
                task.add_log("爬虫未返回数据, 尝试直接处理URL...")
        except ImportError as e:
            task.add_log(f"爬虫模块不可用: {e}")
            task.add_log("将尝试其他处理方式...")
        except Exception as e:
            task.add_log(f"爬取过程出错: {e}")

        if task.cancelled:
            task.status = "failed"
            task.message = "任务已取消"
            return

        # Step 2: 处理 (分类映射 + AI生成)
        task.status = "processing"
        task.message = "正在处理数据..."
        task.progress = 50
        task.add_log("开始数据处理 (分类映射 + 属性提取)")

        try:
            from run_pipeline import run_process

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_excel = os.path.join(output_dir, f"Machrio_Import_{timestamp}.xlsx")

            if scraped_files:
                input_source = scraped_files
            elif os.path.isdir(downloads_dir) and os.listdir(downloads_dir):
                input_source = downloads_dir
            else:
                task.status = "failed"
                task.error = "没有可处理的数据"
                task.message = "任务失败: 无数据"
                return

            if not task.skip_ai:
                task.status = "generating"
                task.message = "正在进行AI内容生成..."
                task.progress = 60
                task.add_log("启动AI内容生成 (Qwen)")

            result_path = run_process(
                input_source,
                skip_ai=task.skip_ai,
                output_path=output_excel,
            )

            if result_path and os.path.exists(result_path):
                task.output_file = result_path
                task.status = "completed"
                task.progress = 100
                task.message = "导入任务完成!"
                task.add_log(f"输出文件: {result_path}")
            else:
                task.status = "failed"
                task.error = "处理未生成输出文件"
                task.message = "任务失败"

        except Exception as e:
            task.status = "failed"
            task.error = str(e)
            task.message = "处理过程出错"
            task.add_log(f"处理错误: {e}")

    except Exception as e:
        task.status = "failed"
        task.error = str(e)
        task.message = "管线执行异常"
        task.add_log(f"异常: {e}")


# ============================================================
# API 路由
# ============================================================

@app.get("/api/health")
async def health():
    """健康检查"""
    # 检查工具包是否存在
    tool_ok = os.path.isdir(CORE_DIR)
    config_ok = os.path.isfile(os.path.join(CONFIG_DIR, "categories_config.json"))
    return {
        "status": "ok",
        "tool_path": TOOL_BASE,
        "tool_available": tool_ok,
        "config_available": config_ok,
        "active_tasks": len([t for t in tasks.values() if t.status not in ("completed", "failed")]),
    }


@app.post("/api/tasks")
async def create_task(req: CreateTaskRequest):
    """创建导入任务"""
    if "zkh.com" not in req.url:
        raise HTTPException(400, "请输入有效的震坤行链接 (zkh.com)")

    task_id = f"zkh-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    task = TaskStatus(task_id, req.url, req.maxProducts, req.skipAI)
    tasks[task_id] = task

    task.add_log(f"任务创建成功")
    task.add_log(f"URL: {req.url}")
    task.add_log(f"最大产品数: {req.maxProducts}, AI生成: {'跳过' if req.skipAI else '启用'}")

    # 启动后台线程
    thread = threading.Thread(target=run_pipeline_thread, args=(task,), daemon=True)
    thread.start()

    return task.to_dict()


@app.get("/api/tasks/{task_id}")
async def get_task(task_id: str):
    """查询任务状态"""
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(404, "任务不存在")
    return task.to_dict()


@app.post("/api/tasks/{task_id}/cancel")
async def cancel_task(task_id: str):
    """取消任务"""
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(404, "任务不存在")
    task.cancelled = True
    task.add_log("收到取消请求")
    return {"message": "取消请求已发送"}


@app.get("/api/tasks/{task_id}/download")
async def download_result(task_id: str):
    """下载生成的Excel文件"""
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(404, "任务不存在")
    if not task.output_file or not os.path.exists(task.output_file):
        raise HTTPException(404, "输出文件不存在")

    filename = os.path.basename(task.output_file)
    return FileResponse(
        task.output_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=filename,
    )


# 清理旧任务 (每小时)
@app.on_event("startup")
async def cleanup_loop():
    async def _cleanup():
        while True:
            await asyncio.sleep(3600)
            cutoff = datetime.now().timestamp() - 3600 * 2  # 2小时
            to_delete = []
            for tid, t in tasks.items():
                created = datetime.fromisoformat(t.created_at).timestamp()
                if created < cutoff:
                    to_delete.append(tid)
            for tid in to_delete:
                del tasks[tid]
    asyncio.create_task(_cleanup())
