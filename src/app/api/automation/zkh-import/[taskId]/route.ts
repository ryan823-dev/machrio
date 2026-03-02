import { NextResponse } from 'next/server'
import { getTask } from '@/lib/automation/task-store'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    
    if (!taskId) {
      return NextResponse.json({ error: '缺少任务ID' }, { status: 400 })
    }

    const task = getTask(taskId)
    
    if (!task) {
      return NextResponse.json({ error: '任务不存在或已过期' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error getting task:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取任务状态失败' },
      { status: 500 }
    )
  }
}
