import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { createTask, updateTask, addLog } from '@/lib/automation/task-store'

// The path to the Python tool
const PYTHON_TOOL_PATH = path.join(
  process.env.HOME || '/Users/oceanlink',
  'Documents',
  'Machrio产品导入_完整代码包_v3',
  '核心代码'
)

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

    // Create task
    const task = createTask({ url, maxProducts, skipAI })
    addLog(task.taskId, `任务创建成功, URL: ${url}`)
    addLog(task.taskId, `最大产品数: ${maxProducts}, AI生成: ${skipAI ? '跳过' : '启用'}`)

    // Start the Python pipeline in background
    runPythonPipeline(task.taskId, url, maxProducts, skipAI)

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error starting automation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '启动自动化任务失败' },
      { status: 500 }
    )
  }
}

async function runPythonPipeline(
  taskId: string,
  url: string,
  maxProducts: number,
  skipAI: boolean
) {
  try {
    updateTask(taskId, {
      status: 'scraping',
      progress: 5,
      message: '正在启动爬虫...',
    })
    addLog(taskId, '启动Python爬虫管线...')

    // Build command arguments
    const args = [
      'run_pipeline.py',
      '--url', url,
      '--max-products', String(maxProducts),
    ]
    
    if (skipAI) {
      args.push('--skip-ai')
    }

    // Spawn Python process
    const pythonProcess = spawn('python3', args, {
      cwd: PYTHON_TOOL_PATH,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      },
    })

    let outputFile = ''
    let productsFound = 0
    let productsProcessed = 0

    pythonProcess.stdout.on('data', (data: Buffer) => {
      const output = data.toString('utf-8')
      const lines = output.split('\n').filter(line => line.trim())

      for (const line of lines) {
        addLog(taskId, line)

        // Parse progress from output
        if (line.includes('STEP 1/4')) {
          updateTask(taskId, {
            status: 'scraping',
            progress: 10,
            message: '正在爬取震坤行数据...',
          })
        } else if (line.includes('提取到') && line.includes('个产品')) {
          const match = line.match(/提取到\s*(\d+)\s*个产品/)
          if (match) {
            productsFound = parseInt(match[1], 10)
            updateTask(taskId, {
              productsFound,
              progress: 20,
              message: `发现 ${productsFound} 个产品，开始爬取...`,
            })
          }
        } else if (line.includes('爬取完成')) {
          updateTask(taskId, {
            status: 'processing',
            progress: 40,
            message: '爬取完成，正在处理数据...',
          })
        } else if (line.includes('STEP 2/4') || line.includes('Category Mapping')) {
          updateTask(taskId, {
            status: 'processing',
            progress: 50,
            message: '正在映射分类和提取属性...',
          })
        } else if (line.includes('[AI]') && line.includes('Generating')) {
          updateTask(taskId, {
            status: 'generating',
            progress: 60,
            message: '正在生成AI内容...',
          })
        } else if (line.includes('处理产品')) {
          productsProcessed++
          const progressPct = 50 + Math.min(40, (productsProcessed / Math.max(productsFound, 1)) * 40)
          updateTask(taskId, {
            productsProcessed,
            progress: Math.round(progressPct),
            message: `处理中: ${productsProcessed}/${productsFound} 产品`,
          })
        } else if (line.includes('Machrio import file saved:')) {
          const match = line.match(/saved:\s*(.+)/)
          if (match) {
            outputFile = match[1].trim()
          }
        } else if (line.includes('PIPELINE COMPLETE')) {
          updateTask(taskId, {
            status: 'completed',
            progress: 100,
            message: '导入任务完成!',
            outputFile,
            productsProcessed,
          })
        }
      }
    })

    pythonProcess.stderr.on('data', (data: Buffer) => {
      const output = data.toString('utf-8')
      addLog(taskId, `[STDERR] ${output}`)
    })

    pythonProcess.on('error', (error) => {
      addLog(taskId, `[ERROR] 进程启动失败: ${error.message}`)
      updateTask(taskId, {
        status: 'failed',
        error: `进程启动失败: ${error.message}`,
        message: '任务失败',
      })
    })

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        const task = updateTask(taskId, {})
        if (task && task.status !== 'completed') {
          updateTask(taskId, {
            status: 'failed',
            error: `进程退出码: ${code}`,
            message: '任务异常终止',
          })
        }
      }
      addLog(taskId, `进程退出, 退出码: ${code}`)
    })

  } catch (error) {
    addLog(taskId, `[ERROR] ${error instanceof Error ? error.message : '未知错误'}`)
    updateTask(taskId, {
      status: 'failed',
      error: error instanceof Error ? error.message : '执行失败',
      message: '任务失败',
    })
  }
}
