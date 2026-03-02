'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'

interface ImportResult {
  success: number
  failed: number
  errors: { row: number; sku: string; error: string }[]
  message: string
}

interface AutomationTask {
  taskId: string
  status: 'pending' | 'scraping' | 'processing' | 'generating' | 'completed' | 'failed'
  progress: number
  message: string
  productsFound?: number
  productsProcessed?: number
  outputFile?: string
  error?: string
  logs?: string[]
}

export const BulkImportView: React.FC = () => {
  // Manual import state
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Automation state
  const [zkhUrl, setZkhUrl] = useState('')
  const [maxProducts, setMaxProducts] = useState<number>(10)
  const [skipAI, setSkipAI] = useState(false)
  const [automationLoading, setAutomationLoading] = useState(false)
  const [currentTask, setCurrentTask] = useState<AutomationTask | null>(null)
  const [automationError, setAutomationError] = useState<string | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/products/bulk-import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '导入失败')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入过程中发生错误')
    } finally {
      setLoading(false)
    }
  }, [file])

  const handleDownloadTemplate = useCallback(() => {
    window.location.href = '/api/products/bulk-import/template'
  }, [])

  // Start automation task
  const handleStartAutomation = useCallback(async () => {
    if (!zkhUrl.trim()) {
      setAutomationError('请输入震坤行分类链接')
      return
    }

    if (!zkhUrl.includes('zkh.com')) {
      setAutomationError('请输入有效的震坤行链接 (zkh.com)')
      return
    }

    setAutomationLoading(true)
    setAutomationError(null)
    setCurrentTask(null)

    try {
      const response = await fetch('/api/automation/zkh-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: zkhUrl.trim(),
          maxProducts,
          skipAI,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setAutomationError(data.error || '启动失败')
        setAutomationLoading(false)
        return
      }

      setCurrentTask(data)

      // Start polling for status updates
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/automation/zkh-import/${data.taskId}`)
          const statusData = await statusRes.json()
          setCurrentTask(statusData)

          if (statusData.status === 'completed' || statusData.status === 'failed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            setAutomationLoading(false)
          }
        } catch {
          // Polling error, continue
        }
      }, 2000)

    } catch (err) {
      setAutomationError(err instanceof Error ? err.message : '启动自动化任务失败')
      setAutomationLoading(false)
    }
  }, [zkhUrl, maxProducts, skipAI])

  // Cancel automation task
  const handleCancelAutomation = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setAutomationLoading(false)
    setCurrentTask(null)
  }, [])

  // Get status color and text
  const getStatusInfo = (status: AutomationTask['status']) => {
    const statusMap = {
      pending: { color: '#6b7280', text: '准备中', bg: '#f3f4f6' },
      scraping: { color: '#3b82f6', text: '爬取中', bg: '#eff6ff' },
      processing: { color: '#8b5cf6', text: '处理中', bg: '#f5f3ff' },
      generating: { color: '#f59e0b', text: 'AI生成中', bg: '#fffbeb' },
      completed: { color: '#10b981', text: '已完成', bg: '#ecfdf5' },
      failed: { color: '#ef4444', text: '失败', bg: '#fef2f2' },
    }
    return statusMap[status] || statusMap.pending
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
        产品批量导入
      </h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>
        通过 Excel 表格批量上传产品数据，或使用自动化工具从震坤行导入
      </p>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        {/* Left Column - Manual Import */}
        <div style={{ flex: '1 1 60%', minWidth: 0 }}>
          {/* Template Download */}
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              第一步：下载模板
            </h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
              请先下载 Excel 模板，按照模板格式填写产品数据。模板中包含字段说明。
            </p>
            <button
              onClick={handleDownloadTemplate}
              style={{
                background: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              下载导入模板
            </button>
          </div>

          {/* File Upload */}
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              第二步：上传文件
            </h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
              选择填写好的 Excel 文件 (.xlsx)，点击导入按钮开始批量上传。
            </p>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '14px',
                }}
              />
              <button
                onClick={handleImport}
                disabled={!file || loading}
                style={{
                  background: file && !loading ? '#10b981' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: file && !loading ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? '导入中...' : '开始导入'}
              </button>
            </div>
            
            {file && (
              <p style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
                已选择: {file.name}
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              color: '#dc2626',
            }}>
              <strong>错误：</strong> {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{
              background: result.failed > 0 ? '#fffbeb' : '#f0fdf4',
              border: `1px solid ${result.failed > 0 ? '#fde68a' : '#bbf7d0'}`,
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px',
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                marginBottom: '12px',
                color: result.failed > 0 ? '#d97706' : '#16a34a',
              }}>
                {result.message}
              </h3>
              
              <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                <div>
                  <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '24px' }}>
                    {result.success}
                  </span>
                  <span style={{ color: '#666', marginLeft: '4px' }}>成功</span>
                </div>
                <div>
                  <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '24px' }}>
                    {result.failed}
                  </span>
                  <span style={{ color: '#666', marginLeft: '4px' }}>失败</span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                    错误详情：
                  </h4>
                  <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    maxHeight: '200px',
                    overflow: 'auto',
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>行号</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>SKU</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>错误</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.errors.map((err, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>{err.row}</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>{err.sku}</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', color: '#dc2626' }}>{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div style={{
            padding: '20px',
            background: '#f1f5f9',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#475569',
          }}>
            <h4 style={{ fontWeight: 600, marginBottom: '12px' }}>注意事项：</h4>
            <ul style={{ paddingLeft: '20px', lineHeight: 1.8, margin: 0 }}>
              <li>确保分类名称与系统中已有的 L1/L2/L3 三级分类名称完全一致</li>
              <li>如果 SKU 已存在，将更新现有产品数据</li>
              <li>如果 SKU 不存在，将创建新产品</li>
              <li>规格参数支持最多 9 组 (Spec 1-9 Name/Value)</li>
              <li>Source URL 字段用于记录产品来源链接</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Automation Panel */}
        <div style={{ flex: '0 0 380px', position: 'sticky', top: '20px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '10px',
                padding: '10px',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: '16px', margin: 0 }}>
                  ZKH 自动导入
                </h3>
                <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>
                  从震坤行自动爬取产品
                </p>
              </div>
            </div>

            {/* URL Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', opacity: 0.9 }}>
                震坤行分类链接
              </label>
              <input
                type="text"
                value={zkhUrl}
                onChange={(e) => setZkhUrl(e.target.value)}
                placeholder="https://www.zkh.com/c/..."
                disabled={automationLoading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  background: 'rgba(255,255,255,0.95)',
                  color: '#333',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Options */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.9 }}>
                  最大产品数
                </label>
                <select
                  value={maxProducts}
                  onChange={(e) => setMaxProducts(Number(e.target.value))}
                  disabled={automationLoading}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '13px',
                    background: 'rgba(255,255,255,0.95)',
                    color: '#333',
                  }}
                >
                  <option value={5}>5 个</option>
                  <option value={10}>10 个</option>
                  <option value={20}>20 个</option>
                  <option value={50}>50 个</option>
                  <option value={100}>100 个</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', opacity: 0.9 }}>
                  AI生成
                </label>
                <select
                  value={skipAI ? 'skip' : 'enable'}
                  onChange={(e) => setSkipAI(e.target.value === 'skip')}
                  disabled={automationLoading}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '13px',
                    background: 'rgba(255,255,255,0.95)',
                    color: '#333',
                  }}
                >
                  <option value="enable">启用</option>
                  <option value="skip">跳过</option>
                </select>
              </div>
            </div>

            {/* Error Display */}
            {automationError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '16px',
                fontSize: '13px',
              }}>
                {automationError}
              </div>
            )}

            {/* Start/Cancel Button */}
            {!currentTask || currentTask.status === 'completed' || currentTask.status === 'failed' ? (
              <button
                onClick={handleStartAutomation}
                disabled={automationLoading || !zkhUrl.trim()}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: automationLoading || !zkhUrl.trim() 
                    ? 'rgba(255,255,255,0.3)' 
                    : 'rgba(255,255,255,0.95)',
                  color: automationLoading || !zkhUrl.trim() ? 'rgba(255,255,255,0.7)' : '#667eea',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: automationLoading || !zkhUrl.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {automationLoading ? '启动中...' : '开始自动导入'}
              </button>
            ) : (
              <button
                onClick={handleCancelAutomation}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid rgba(255,255,255,0.5)',
                  background: 'transparent',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                取消任务
              </button>
            )}

            {/* Task Progress */}
            {currentTask && (
              <div style={{
                marginTop: '20px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '16px',
              }}>
                {/* Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: getStatusInfo(currentTask.status).bg,
                    color: getStatusInfo(currentTask.status).color,
                  }}>
                    {getStatusInfo(currentTask.status).text}
                  </span>
                  {currentTask.productsFound !== undefined && (
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>
                      {currentTask.productsProcessed || 0}/{currentTask.productsFound} 产品
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div style={{
                  height: '6px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginBottom: '12px',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${currentTask.progress}%`,
                    background: 'white',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                  }} />
                </div>

                {/* Message */}
                <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>
                  {currentTask.message}
                </p>

                {/* Output File */}
                {currentTask.outputFile && currentTask.status === 'completed' && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}>
                    <strong>输出文件:</strong><br />
                    <span style={{ wordBreak: 'break-all' }}>{currentTask.outputFile}</span>
                  </div>
                )}

                {/* Error */}
                {currentTask.error && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}>
                    <strong>错误:</strong> {currentTask.error}
                  </div>
                )}

                {/* Logs */}
                {currentTask.logs && currentTask.logs.length > 0 && (
                  <div style={{
                    marginTop: '12px',
                    maxHeight: '150px',
                    overflow: 'auto',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '6px',
                    padding: '10px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    lineHeight: 1.4,
                  }}>
                    {currentTask.logs.slice(-20).map((log, idx) => (
                      <div key={idx} style={{ opacity: 0.9 }}>{log}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Features List */}
            {!currentTask && (
              <div style={{ marginTop: '20px', fontSize: '12px', opacity: 0.85, lineHeight: 1.8 }}>
                <p style={{ marginBottom: '8px', fontWeight: 500 }}>功能特点：</p>
                <ul style={{ paddingLeft: '18px', margin: 0 }}>
                  <li>自动爬取震坤行产品数据</li>
                  <li>智能映射 Machrio 三级分类</li>
                  <li>AI 生成英文产品描述</li>
                  <li>自动生成导入 Excel</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkImportView
