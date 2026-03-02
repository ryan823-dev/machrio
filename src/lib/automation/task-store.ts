/**
 * In-memory task store for automation tasks
 * In production, this should be replaced with a database or Redis store
 */

export interface AutomationTask {
  taskId: string
  status: 'pending' | 'scraping' | 'processing' | 'generating' | 'completed' | 'failed'
  progress: number
  message: string
  url: string
  maxProducts: number
  skipAI: boolean
  productsFound?: number
  productsProcessed?: number
  outputFile?: string
  error?: string
  logs: string[]
  createdAt: Date
  updatedAt: Date
}

// In-memory store (will reset on server restart)
const taskStore = new Map<string, AutomationTask>()

// Cleanup old tasks periodically (tasks older than 1 hour)
const TASK_TTL_MS = 60 * 60 * 1000 // 1 hour

export function createTask(params: {
  url: string
  maxProducts: number
  skipAI: boolean
}): AutomationTask {
  const taskId = `zkh-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  
  const task: AutomationTask = {
    taskId,
    status: 'pending',
    progress: 0,
    message: '准备启动...',
    url: params.url,
    maxProducts: params.maxProducts,
    skipAI: params.skipAI,
    logs: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  taskStore.set(taskId, task)
  
  // Cleanup old tasks
  cleanupOldTasks()
  
  return task
}

export function getTask(taskId: string): AutomationTask | null {
  return taskStore.get(taskId) || null
}

export function updateTask(taskId: string, updates: Partial<AutomationTask>): AutomationTask | null {
  const task = taskStore.get(taskId)
  if (!task) return null
  
  const updatedTask = {
    ...task,
    ...updates,
    updatedAt: new Date(),
  }
  
  taskStore.set(taskId, updatedTask)
  return updatedTask
}

export function addLog(taskId: string, log: string): void {
  const task = taskStore.get(taskId)
  if (task) {
    task.logs.push(`[${new Date().toLocaleTimeString()}] ${log}`)
    task.updatedAt = new Date()
    // Keep only last 100 logs
    if (task.logs.length > 100) {
      task.logs = task.logs.slice(-100)
    }
  }
}

export function deleteTask(taskId: string): boolean {
  return taskStore.delete(taskId)
}

export function getAllTasks(): AutomationTask[] {
  return Array.from(taskStore.values())
}

function cleanupOldTasks(): void {
  const now = Date.now()
  for (const [taskId, task] of taskStore.entries()) {
    if (now - task.createdAt.getTime() > TASK_TTL_MS) {
      taskStore.delete(taskId)
    }
  }
}
