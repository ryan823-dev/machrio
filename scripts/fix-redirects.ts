/**
 * 修复301重定向规则
 */

import * as fs from 'fs'

const configPath = '/Users/oceanlink/Documents/Qoder-1/machrio/next.config.mjs'
const snippetPath = '/Users/oceanlink/Documents/Qoder-1/machrio/scripts/output/next-config-redirects-snippet.txt'

// 读取配置
let config = fs.readFileSync(configPath, 'utf-8')

// 读取snippet文件（跳过前4行注释）
const snippet = fs.readFileSync(snippetPath, 'utf-8')
const snippetLines = snippet.split('\n').filter((_, i) => i > 3).map(l => '\t' + l).join('\n')

console.log('🔍 检查配置文件...')

// 检查是否已有Product Redirects from Old to New
const marker = '// ========== Product Redirects from Old to New (273) =========='

if (config.includes(marker)) {
  console.log('✅ 找到现有的Product Redirects from Old to New部分')
  // 找到该部分的开始位置
  const startIdx = config.indexOf(marker)
  
  // 找到下一个section开始位置
  const nextSectionIdx = config.indexOf('      // ==========', startIdx + 50)
  
  // 删除旧的部分
  config = config.substring(0, startIdx) + config.substring(nextSectionIdx)
  console.log('   已删除旧的重定向规则')
}

// 构建新的section
const newSection = `      ${marker}
      // 旧产品URL重定向到有分类的新产品URL
      // 生成时间: 2026-03-19
${snippetLines}
`

// 在 Brand Redirects 之前插入
const brandPattern = '      // ========== Brand Redirects (4) =========='
const insertIdx = config.indexOf(brandPattern)

if (insertIdx > 0) {
  config = config.substring(0, insertIdx) + newSection + '\n' + config.substring(insertIdx)
  console.log('✅ 已添加273条新重定向规则')
} else {
  console.error('❌ 未找到Brand Redirects标记')
}

// 写回
fs.writeFileSync(configPath, config)

// 验证
const newContent = fs.readFileSync(configPath, 'utf-8')
const exactMatches = (newContent.match(/source: '\/product\//g) || []).length
console.log(`\n📊 验证结果:`)
console.log(`   产品精确匹配重定向: ${exactMatches} 条`)
