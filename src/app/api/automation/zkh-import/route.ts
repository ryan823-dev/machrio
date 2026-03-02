import { NextResponse } from 'next/server'
import { createTask, updateTask, addLog } from '@/lib/automation/task-store'

// Python API 服务地址 (VPS 上的 FastAPI)
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8100'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, maxProducts = 10, skipAI = false } = body

    if (!url) {
      return NextResponse.json({ error: '请提供震坤行URL' }, { status: 400 })
    }

    if (!url.includes('zkh.com')) {
      return NextResponse.json({ error: '请输入有效的震坤行链接' }, { status: 400 })
    }

    // 调用远程 Python API 创建任务
    const apiResponse = await fetch(`${PYTHON_API_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, maxProducts, skipAI }),
    })

    if (!apiResponse.ok) {
      const errData = await apiResponse.json().catch(() => ({ detail: '远程服务不可用' }))
      return NextResponse.json(
        { error: errData.detail || '启动任务失败' },
        { status: apiResponse.status }
      )
    }

    const remoteTask = await apiResponse.json()

    // 同步创建本地任务记录 (用于前端轮询)
    const localTask = createTask({ url, maxProducts, skipAI })
    // 存储远程taskId的映射
    updateTask(localTask.taskId, {
      status: remoteTask.status,
      progress: remoteTask.progress,
      message: remoteTask.message,
    })
    addLog(localTask.taskId, `远程任务已创建: ${remoteTask.taskId}`)

    // 启动后台轮询远程状态
    pollRemoteStatus(localTask.taskId, remoteTask.taskId)

    return NextResponse.json(localTask)
  } catch (error) {
    console.error('Error starting automation:', error)

    // 如果远程服务不可用，返回明确错误
    if (error instanceof TypeError && String(error).includes('fetch')) {
      return NextResponse.json(
        { error: 'Python API 服务不可用，请检查服务是否已启动' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '启动自动化任务失败' },
      { status: 500 }
    )
  }
}

/**
 * 后台轮询远程 Python API 的任务状态，同步更新本地任务
 */
function pollRemoteStatus(localTaskId: string, remoteTaskId: string) {
  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${PYTHON_API_URL}/api/tasks/${remoteTaskId}`)
      if (!res.ok) {
        addLog(localTaskId, `轮询失败: HTTP ${res.status}`)
        return
      }

      const data = await res.json()

      updateTask(localTaskId, {
        status: data.status,
        progress: data.progress,
        message: data.message,
        productsFound: data.productsFound,
        productsProcessed: data.productsProcessed,
        outputFile: data.outputFile,
        error: data.error,
      })

      // 同步日志 (取最新的)
      if (data.logs && Array.isArray(data.logs)) {
        for (const log of data.logs.slice(-5)) {
          addLog(localTaskId, `[远程] ${log}`)
        }
      }

      // 任务结束，停止轮询
      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(interval)
        addLog(localTaskId, `任务结束: ${data.status}`)
      }
    } catch {
      // 轮询网络错误，继续重试
    }
  }, 3000)

  // 安全限制: 最多轮询30分钟
  setTimeout(() => {
    clearInterval(interval)
  }, 30 * 60 * 1000)
}
