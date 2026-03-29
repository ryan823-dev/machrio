/**
 * Website Link Checker
 * 
 * 自动检查网站所有链接的可用性
 * 从 sitemap 获取所有 URL，逐个测试访问
 */

import { parseStringPromise } from 'xml2js'

const BASE_URL = 'https://machrio.com'
const TIMEOUT = 10000 // 10 秒超时
const CONCURRENT_LIMIT = 5 // 并发限制

interface LinkResult {
  url: string
  status: number
  statusText: string
  error?: string
  loadTime?: number
}

interface CheckSummary {
  total: number
  success: number
  failed: number
  notFound: number
  serverError: number
  timeout: number
  results: LinkResult[]
}

/**
 * 从 sitemap 获取所有 URL
 */
async function fetchUrlsFromSitemap(): Promise<string[]> {
  console.log('📥 获取 sitemap.xml...')
  
  try {
    const response = await fetch(`${BASE_URL}/sitemap.xml`, {
      signal: AbortSignal.timeout(TIMEOUT),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status}`)
    }
    
    const xmlContent = await response.text()
    const parsed = await parseStringPromise(xmlContent)
    
    const urls: string[] = []
    
    // 处理主 sitemap
    if (parsed.urlset?.url) {
      for (const url of parsed.urlset.url) {
        if (url.loc?.[0]) {
          urls.push(url.loc[0])
        }
      }
    }
    
    // 处理 sitemap index（如果有）
    if (parsed.sitemapindex?.sitemap) {
      console.log('📑 发现 sitemap index，获取子 sitemap...')
      for (const sitemap of parsed.sitemapindex.sitemap) {
        if (sitemap.loc?.[0]) {
          const subUrls = await fetchUrlsFromSitemapUrl(sitemap.loc[0])
          urls.push(...subUrls)
        }
      }
    }
    
    console.log(`✅ 找到 ${urls.length} 个 URL`)
    return urls
  } catch (error) {
    console.error('❌ 获取 sitemap 失败:', error)
    return []
  }
}

/**
 * 从单个 sitemap URL 获取链接
 */
async function fetchUrlsFromSitemapUrl(sitemapUrl: string): Promise<string[]> {
  try {
    const response = await fetch(sitemapUrl, {
      signal: AbortSignal.timeout(TIMEOUT),
    })
    
    if (!response.ok) {
      return []
    }
    
    const xmlContent = await response.text()
    const parsed = await parseStringPromise(xmlContent)
    
    const urls: string[] = []
    
    if (parsed.urlset?.url) {
      for (const url of parsed.urlset.url) {
        if (url.loc?.[0]) {
          urls.push(url.loc[0])
        }
      }
    }
    
    return urls
  } catch (error) {
    console.error(`获取 ${sitemapUrl} 失败:`, error)
    return []
  }
}

/**
 * 检查单个 URL
 */
async function checkUrl(url: string): Promise<LinkResult> {
  const startTime = Date.now()
  
  try {
    const response = await fetch(url, {
      method: 'HEAD', // 使用 HEAD 请求加快速度
      signal: AbortSignal.timeout(TIMEOUT),
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })
    
    const loadTime = Date.now() - startTime
    
    return {
      url,
      status: response.status,
      statusText: response.statusText,
      loadTime,
    }
  } catch (error) {
    const loadTime = Date.now() - startTime
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          url,
          status: 0,
          statusText: 'Timeout',
          error: 'Request timed out',
          loadTime,
        }
      }
      
      return {
        url,
        status: 0,
        statusText: 'Error',
        error: error.message,
        loadTime,
      }
    }
    
    return {
      url,
      status: 0,
      statusText: 'Unknown Error',
      error: 'Unknown error',
      loadTime,
    }
  }
}

/**
 * 批量检查 URLs（带并发限制）
 */
async function checkUrlsBatched(urls: string[]): Promise<LinkResult[]> {
  const results: LinkResult[] = []
  
  for (let i = 0; i < urls.length; i += CONCURRENT_LIMIT) {
    const batch = urls.slice(i, i + CONCURRENT_LIMIT)
    console.log(`\n🔍 检查 ${i + 1}-${Math.min(i + CONCURRENT_LIMIT, urls.length)} / ${urls.length}`)
    
    const batchResults = await Promise.all(batch.map(url => checkUrl(url)))
    results.push(...batchResults)
    
    // 打印当前批次结果
    batchResults.forEach((result, idx) => {
      const icon = result.status === 200 ? '✅' : 
                   result.status === 404 ? '❌' : 
                   result.status >= 500 ? '💥' : '⚠️'
      console.log(`${icon} ${result.url} - ${result.status} ${result.statusText}${result.loadTime ? ` (${result.loadTime}ms)` : ''}`)
      if (result.error) {
        console.log(`   错误：${result.error}`)
      }
    })
    
    // 短暂延迟，避免请求过快
    if (i + CONCURRENT_LIMIT < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  return results
}

/**
 * 生成报告
 */
function generateReport(results: LinkResult[]): string {
  const summary: CheckSummary = {
    total: results.length,
    success: results.filter(r => r.status === 200).length,
    failed: results.filter(r => r.status !== 200).length,
    notFound: results.filter(r => r.status === 404).length,
    serverError: results.filter(r => r.status >= 500).length,
    timeout: results.filter(r => r.status === 0 && r.error?.includes('timeout')).length,
    results,
  }
  
  let report = `
# 🔗 网站链接检查报告

**检查时间**: ${new Date().toLocaleString('zh-CN')}
**基础 URL**: ${BASE_URL}

## 📊 统计摘要

- **总计**: ${summary.total} 个链接
- **✅ 成功**: ${summary.success} 个 (${((summary.success / summary.total) * 100).toFixed(1)}%)
- **❌ 失败**: ${summary.failed} 个 (${((summary.failed / summary.total) * 100).toFixed(1)}%)
  - 404 Not Found: ${summary.notFound} 个
  - 500 Server Error: ${summary.serverError} 个
  - Timeout: ${summary.timeout} 个

## ❌ 失败的链接

`
  
  // 404 错误
  const notFoundLinks = results.filter(r => r.status === 404)
  if (notFoundLinks.length > 0) {
    report += `### 404 Not Found (${notFoundLinks.length}个)\n\n`
    notFoundLinks.forEach(link => {
      report += `- [${link.url}](${link.url})\n`
    })
    report += '\n'
  }
  
  // 服务器错误
  const serverErrors = results.filter(r => r.status >= 500)
  if (serverErrors.length > 0) {
    report += `### 500 Server Error (${serverErrors.length}个)\n\n`
    serverErrors.forEach(link => {
      report += `- [${link.url}](${link.url}) - ${link.statusText}\n`
    })
    report += '\n'
  }
  
  // 超时
  const timeouts = results.filter(r => r.status === 0 && r.error?.includes('timeout'))
  if (timeouts.length > 0) {
    report += `### Timeout (${timeouts.length}个)\n\n`
    timeouts.forEach(link => {
      report += `- [${link.url}](${link.url})\n`
    })
    report += '\n'
  }
  
  // 其他错误
  const otherErrors = results.filter(r => r.status === 0 && !r.error?.includes('timeout'))
  if (otherErrors.length > 0) {
    report += `### Other Errors (${otherErrors.length}个)\n\n`
    otherErrors.forEach(link => {
      report += `- [${link.url}](${link.url}) - ${r.error}\n`
    })
    report += '\n'
  }
  
  // 慢速链接
  const slowLinks = results.filter(r => r.loadTime && r.loadTime > 3000)
  if (slowLinks.length > 0) {
    report += `### 🐌 加载缓慢 (>3 秒) (${slowLinks.length}个)\n\n`
    slowLinks.sort((a, b) => (b.loadTime || 0) - (a.loadTime || 0))
    slowLinks.forEach(link => {
      report += `- [${link.url}](${link.url}) - ${link.loadTime}ms\n`
    })
    report += '\n'
  }
  
  report += `---
**生成时间**: ${new Date().toISOString()}
`
  
  return report
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始检查网站链接...\n')
  
  // 从 sitemap 获取 URLs
  const urls = await fetchUrlsFromSitemap()
  
  if (urls.length === 0) {
    console.error('❌ 没有找到任何 URL')
    return
  }
  
  // 检查所有链接
  const results = await checkUrlsBatched(urls)
  
  // 生成报告
  const report = generateReport(results)
  
  // 保存报告
  const fs = await import('fs')
  const path = await import('path')
  const reportPath = path.join(process.cwd(), 'LINK-CHECK-REPORT.md')
  fs.writeFileSync(reportPath, report, 'utf-8')
  
  console.log(`\n📄 报告已保存到: ${reportPath}`)
  console.log('\n' + '='.repeat(50))
  console.log(report)
}

// 运行
main().catch(console.error)
