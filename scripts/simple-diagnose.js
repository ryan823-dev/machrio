/**
 * 简单诊断产品列表分页问题
 */

const totalProducts = 9147  // 根据用户提供的数据
const pageSize = 20
const totalPages = Math.ceil(totalProducts / pageSize)

console.log('🔍 产品列表分页诊断\n')
console.log(`总产品数：${totalProducts.toLocaleString()}`)
console.log(`每页显示：${pageSize} 条`)
console.log(`理论页数：${totalPages} 页`)
console.log('---\n')

// 计算每页的产品范围
console.log('📊 分页计算:')
console.log(`第 1 页：1 - ${pageSize}`)
console.log(`第 2 页：${pageSize + 1} - ${pageSize * 2}`)
console.log('...')
const lastPageStart = (totalPages - 1) * pageSize + 1
const lastPageEnd = totalProducts
console.log(`第 ${totalPages-1}页：${(totalPages - 2) * pageSize + 1} - ${(totalPages - 1) * pageSize}`)
console.log(`第 ${totalPages}页 (最后): ${lastPageStart} - ${lastPageEnd}`)
console.log('---\n')

// 检查最后一页
const lastPageCount = totalProducts - (totalPages - 1) * pageSize
console.log(`✅ 最后一页应该有：${lastPageCount} 条产品`)

if (lastPageCount === 0) {
  console.log('❌ 错误：最后一页计算为空，说明 totalPages 计算有误')
} else if (lastPageCount < 0) {
  console.log('❌ 错误：page 参数超出范围')
} else {
  console.log('✅ 最后一页计算正常')
}

console.log('\n💡 可能的问题:')
console.log('1. 前端分页组件的 page 从 0 开始计数，但后端从 1 开始')
console.log('2. offset 计算错误：应该是 (page-1)*pageSize，但用了 page*pageSize')
console.log('3. 总数统计包含 draft 文档，但查询时过滤了 draft')
console.log('4. 排序不稳定导致某些文档被重复/遗漏')
