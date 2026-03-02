'use client'

import React, { useState, useCallback } from 'react'

interface ImportResult {
  success: number
  failed: number
  errors: { row: number; sku: string; error: string }[]
  message: string
}

export const BulkImportView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
        产品批量导入
      </h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>
        通过 Excel 表格批量上传产品数据
      </p>

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
        marginTop: '32px',
        padding: '20px',
        background: '#f1f5f9',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#475569',
      }}>
        <h4 style={{ fontWeight: 600, marginBottom: '12px' }}>注意事项：</h4>
        <ul style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
          <li>确保分类名称与系统中已有的 L1/L2/L3 三级分类名称完全一致</li>
          <li>如果 SKU 已存在，将更新现有产品数据</li>
          <li>如果 SKU 不存在，将创建新产品</li>
          <li>规格参数支持最多 9 组 (Spec 1-9 Name/Value)</li>
          <li>Source URL 字段用于记录产品来源链接</li>
          <li>建议先用少量数据测试，确认无误后再批量导入</li>
        </ul>
      </div>

      {/* Automation Tool Section */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '12px',
            flexShrink: 0,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>
              自动化产品导入工具
            </h4>
            <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '12px', lineHeight: 1.6 }}>
              使用 Python 自动化工具可以从震坤行(ZKH)批量爬取产品数据，通过 AI 自动生成英文描述，并一键导入到 Machrio 后台。
            </p>
            <div style={{ fontSize: '13px', opacity: 0.85, lineHeight: 1.8 }}>
              <p style={{ marginBottom: '8px' }}>功能特点：</p>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li>从震坤行分类页面自动爬取产品数据</li>
                <li>自动映射到 Machrio 三级分类体系</li>
                <li>使用通义千问 AI 生成专业英文产品描述</li>
                <li>自动生成符合模板格式的 Excel 文件</li>
              </ul>
            </div>
            <div style={{ marginTop: '16px' }}>
              <span style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
              }}>
                📁 工具位置: Documents/Machrio产品导入_完整代码包_v3/
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkImportView
