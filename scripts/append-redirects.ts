/**
 * 将生成的301重定向规则追加到next.config.mjs
 */

import * as fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function appendRedirects() {
  const configPath = path.join(__dirname, '..', 'next.config.mjs')
  const snippetPath = path.join(__dirname, 'output', 'next-config-redirects-snippet.txt')
  
  // 读取当前配置
  let configContent = fs.readFileSync(configPath, 'utf-8')
  
  // 读取重定向规则片段
  let snippetContent = fs.readFileSync(snippetPath, 'utf-8')
  
  // 移除注释行（第一到四行）
  const lines = snippetContent.split('\n')
  const codeLines = lines.filter((line, idx) => idx > 3) // 跳过前4行注释
  
  // 格式化代码（添加制表符缩进）
  const formattedCode = codeLines.map(line => '\t' + line).join('\n')
  
  // 替换Brand Redirects后的内容，添加Product Redirects
  const oldPattern = `      // ========== Brand Redirects (4) ==========
      {
        source: '/brand/:slug*',
        destination: '/',
        permanent: true,
      },
    ]`
  
  const newPattern = `      // ========== Brand Redirects (4) ==========
      {
        source: '/brand/:slug*',
        destination: '/',
        permanent: true,
      },

      // ========== Product Redirects from Old to New (273) ==========
      // 旧产品URL重定向到有分类的新产品URL
      // 生成时间: 2026-03-19
${formattedCode}
    ]`
  
  const newConfig = configContent.replace(oldPattern, newPattern)
  
  // 写回配置文件
  fs.writeFileSync(configPath, newConfig)
  
  console.log('✅ 已将273条301重定向规则添加到 next.config.mjs')
  console.log(`   配置文件: ${configPath}`)
}

// 执行
appendRedirects().catch(console.error)
