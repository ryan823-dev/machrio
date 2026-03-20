/**
 * 正确添加301重定向规则到next.config.mjs
 * 使用6空格缩进与原配置一致
 */

import * as fs from 'fs'

const configPath = '/Users/oceanlink/Documents/Qoder-1/machrio/next.config.mjs'
const snippetPath = '/Users/oceanlink/Documents/Qoder-1/machrio/scripts/output/next-config-redirects-snippet.txt'

// 读取配置
let config = fs.readFileSync(configPath, 'utf-8')

// 读取snippet文件（跳过前4行注释）
const snippet = fs.readFileSync(snippetPath, 'utf-8')
const snippetLines = snippet.split('\n').filter((_, i) => i > 3)

// 将4空格缩进转换为6空格缩进
const formattedLines = snippetLines.map(line => {
  if (line.trim().startsWith('{')) {
    return '      ' + line.trimStart()
  } else if (line.trim().startsWith('source:') || 
             line.trim().startsWith('destination:') || 
             line.trim().startsWith('permanent:')) {
    return '        ' + line.trimStart()
  } else if (line.trim() === '},') {
    return '      },'
  } else {
    return line
  }
}).join('\n')

console.log('🔍 准备添加273条重定向规则...')
console.log('   使用6空格缩进与原配置对齐')

// 构建新的section
const newSection = `
      // ========== Product Redirects from Old to New (273) ==========
      // 旧产品URL重定向到有分类的新产品URL
      // 生成时间: 2026-03-19
${formattedLines}
`

// 在 Brand Redirects 之前插入
const brandPattern = '      // ========== Brand Redirects (4) =========='
const insertIdx = config.indexOf(brandPattern)

if (insertIdx > 0) {
  config = config.substring(0, insertIdx) + newSection + '\n' + config.substring(insertIdx)
  console.log('✅ 已添加273条重定向规则')
} else {
  console.error('❌ 未找到Brand Redirects标记')
  process.exit(1)
}

// 写回
fs.writeFileSync(configPath, config)

// 验证
const newContent = fs.readFileSync(configPath, 'utf-8')
const exactMatches = (newContent.match(/source: '\/product\//g) || []).length
console.log(`\n📊 验证结果:`)
console.log(`   产品精确匹配重定向: ${exactMatches} 条`)
console.log(`   配置文件语法: 检查中...`)

// 检查语法
try {
  require('child_process').execSync('node -c ' + configPath, { encoding: 'utf-8' })
  console.log('   ✅ 语法正确')
} catch (e) {
  console.log('   ❌ 语法错误')
}
