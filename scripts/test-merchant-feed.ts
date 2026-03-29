/**
 * 测试 Google Merchant XML Feed
 * 
 * 使用方法:
 * npx tsx scripts/test-merchant-feed.ts
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

async function testMerchantFeed() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const feedUrl = `${baseUrl}/api/merchant-feed`
  
  console.log('🔍 Testing Google Merchant XML Feed...')
  console.log(`URL: ${feedUrl}\n`)
  
  try {
    // 读取 XML 文件（如果是静态文件）
    // 或者从本地服务器获取
    const response = await fetch(feedUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const xmlContent = await response.text()
    
    // 验证 XML 基本结构
    console.log('✅ Successfully retrieved XML feed')
    console.log(`📊 Content length: ${xmlContent.length} bytes\n`)
    
    // 基本验证
    const checks = [
      {
        name: 'XML 声明',
        test: xmlContent.includes('<?xml version="1.0" encoding="UTF-8"?>'),
        critical: true
      },
      {
        name: 'Google Merchant 命名空间',
        test: xmlContent.includes('xmlns:g="http://base.google.com/ns/1.0"'),
        critical: true
      },
      {
        name: 'RSS 根元素',
        test: xmlContent.includes('<rss') && xmlContent.includes('</rss>'),
        critical: true
      },
      {
        name: 'Channel 元素',
        test: xmlContent.includes('<channel>') && xmlContent.includes('</channel>'),
        critical: true
      },
      {
        name: '产品项 (item)',
        test: xmlContent.includes('<item>') && xmlContent.includes('</item>'),
        critical: true
      },
      {
        name: '产品 ID (g:id)',
        test: xmlContent.includes('<g:id>'),
        critical: true
      },
      {
        name: '产品标题 (g:title)',
        test: xmlContent.includes('<g:title>'),
        critical: true
      },
      {
        name: '产品描述 (g:description)',
        test: xmlContent.includes('<g:description>'),
        critical: true
      },
      {
        name: '产品链接 (g:link)',
        test: xmlContent.includes('<g:link>'),
        critical: true
      },
      {
        name: '图片链接 (g:image_link)',
        test: xmlContent.includes('<g:image_link>'),
        critical: true
      },
      {
        name: '库存状态 (g:availability)',
        test: xmlContent.includes('<g:availability>'),
        critical: true
      },
      {
        name: '价格 (g:price)',
        test: xmlContent.includes('<g:price>'),
        critical: true
      },
      {
        name: '品牌 (g:brand)',
        test: xmlContent.includes('<g:brand>'),
        critical: false
      },
      {
        name: '产品状态 (g:condition)',
        test: xmlContent.includes('<g:condition>'),
        critical: false
      },
      {
        name: '产品类型 (g:product_type)',
        test: xmlContent.includes('<g:product_type>'),
        critical: false
      },
      {
        name: 'MPN (g:mpn)',
        test: xmlContent.includes('<g:mpn>'),
        critical: false
      }
    ]
    
    let passed = 0
    let failed = 0
    let criticalFailed = false
    
    console.log('📋 Validation Results:')
    console.log('='.repeat(60))
    
    for (const check of checks) {
      const status = check.test ? '✅' : '❌'
      const criticality = check.critical ? '[REQUIRED]' : '[OPTIONAL]'
      console.log(`${status} ${criticality} ${check.name}`)
      
      if (check.test) {
        passed++
      } else {
        failed++
        if (check.critical) {
          criticalFailed = true
        }
      }
    }
    
    console.log('='.repeat(60))
    console.log(`\n📊 Summary:`)
    console.log(`   Passed: ${passed}/${checks.length}`)
    console.log(`   Failed: ${failed}/${checks.length}`)
    console.log(`   Success Rate: ${((passed / checks.length) * 100).toFixed(1)}%`)
    
    // 统计产品数量
    const productCount = (xmlContent.match(/<item>/g) || []).length
    console.log(`\n📦 Total products in feed: ${productCount}`)
    
    // 保存 XML 到文件（用于详细检查）
    const outputPath = join(process.cwd(), 'merchant-feed-output.xml')
    writeFileSync(outputPath, xmlContent)
    console.log(`\n💾 XML saved to: ${outputPath}`)
    
    // 显示前 3 个产品的简要信息
    const itemMatches = xmlContent.matchAll(/<item>([\s\S]*?)<\/item>/g)
    let count = 0
    console.log('\n📝 Sample Products:')
    console.log('='.repeat(60))
    
    for (const match of itemMatches) {
      if (count >= 3) break
      
      const item = match[1]
      const idMatch = item.match(/<g:id>([\s\S]*?)<\/g:id>/)
      const titleMatch = item.match(/<g:title>([\s\S]*?)<\/g:title>/)
      const priceMatch = item.match(/<g:price>([\s\S]*?)<\/g:price>/)
      
      if (idMatch && titleMatch && priceMatch) {
        count++
        console.log(`${count}. ${titleMatch[1]} (${idMatch[1]}) - ${priceMatch[1]}`)
      }
    }
    
    console.log('='.repeat(60))
    
    // 最终结果
    if (criticalFailed) {
      console.log('\n❌ VALIDATION FAILED - Critical required fields are missing!')
      console.log('\n⚠️  Please check the errors above and fix the feed generation.')
      process.exit(1)
    } else {
      console.log('\n✅ VALIDATION PASSED - Feed is ready for Google Merchant Center!')
      console.log('\n📌 Next steps:')
      console.log('   1. Deploy to production: npm run build && npm run start')
      console.log('   2. Verify live URL: https://machrio.com/api/merchant-feed')
      console.log('   3. Submit to Google Merchant Center')
      console.log('   4. Monitor for any warnings in Merchant Center dashboard')
    }
    
  } catch (error) {
    console.error('\n❌ Error testing feed:')
    console.error(error)
    console.error('\n💡 Make sure:')
    console.error('   1. The development server is running (npm run dev)')
    console.error('   2. DATABASE_URI is configured in .env')
    console.error('   3. There are published products in the database')
    process.exit(1)
  }
}

// 运行测试
testMerchantFeed()
