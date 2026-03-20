#!/usr/bin/env node

/**
 * Machrio Website QA Test Script
 * 运行方式: node scripts/qa-test.js
 */

import { chromium } from 'playwright';

const BASE_URL = 'https://machrio.com';
const TIMEOUT = 30000;

const results = {
  passed: 0,
  failed: 0,
  warnings: [],
  errors: [],
};

const testPages = [
  { url: '/', name: '首页' },
  { url: '/category', name: '分类列表' },
  { url: '/category/safety', name: '分类详情' },
  { url: '/new-arrivals', name: '新品上架' },
  { url: '/search', name: '搜索页' },
  { url: '/knowledge-center', name: '知识中心' },
  { url: '/rfq', name: '询价页' },
  { url: '/about', name: '关于我们' },
];

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, type = 'info') {
  const prefix = { pass: `${colors.green}✓${colors.reset}`, fail: `${colors.red}✗${colors.reset}`, warn: `${colors.yellow}!${colors.reset}`, info: `${colors.blue}ℹ${colors.reset}` };
  console.log(`${prefix} ${message}`);
}

async function main() {
  console.log('\n' + '█'.repeat(60));
  log('Machrio 网站 QA 测试开始');
  console.log('█'.repeat(60));
  console.log(`目标: ${BASE_URL}\n`);

  const browser = await chromium.launch();
  const startTime = Date.now();

  // 测试页面加载
  console.log('='.repeat(50));
  log('测试页面加载');
  console.log('='.repeat(50));

  for (const page of testPages) {
    try {
      const context = await browser.newContext();
      const p = await context.newPage();
      const start = Date.now();
      const res = await p.goto(`${BASE_URL}${page.url}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
      const ttfb = Date.now() - start;
      const ok = res.status() === 200;
      log(`${page.name} (${page.url}): HTTP ${res.status()} | TTFB ${ttfb}ms ${ttfb < 2000 ? '⚡' : '⚠️'}`, ok ? 'pass' : 'fail');
      if (ok) results.passed++; else results.failed++;
      await context.close();
    } catch (e) {
      log(`${page.name}: ${e.message}`, 'fail');
      results.failed++;
    }
  }

  // 测试 API
  console.log('\n' + '='.repeat(50));
  log('测试 API 端点');
  console.log('='.repeat(50));

  const apis = ['/sitemap.xml', '/robots.txt'];
  for (const api of apis) {
    try {
      const context = await browser.newContext();
      const p = await context.newPage();
      const res = await p.request.get(`${BASE_URL}${api}`, { timeout: 10000 });
      log(`${api}: HTTP ${res.status()}`, res.status() === 200 ? 'pass' : 'fail');
      if (res.status() === 200) results.passed++; else results.failed++;
      await context.close();
    } catch (e) {
      log(`${api}: ${e.message}`, 'fail');
      results.failed++;
    }
  }

  // 测试响应式
  console.log('\n' + '='.repeat(50));
  log('测试响应式设计');
  console.log('='.repeat(50));

  const viewports = [
    { name: '桌面', w: 1920, h: 1080 },
    { name: '平板', w: 768, h: 1024 },
    { name: '手机', w: 375, h: 667 },
  ];
  for (const vp of viewports) {
    try {
      const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const p = await context.newPage();
      await p.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
      const horizontal = await p.evaluate(() => document.body.scrollWidth > window.innerWidth);
      log(`${vp.name} (${vp.w}x${vp.h}): ${horizontal ? '⚠️ 水平滚动' : '✓ 正常'}`, horizontal ? 'warn' : 'pass');
      results.passed++;
      await context.close();
    } catch (e) {
      log(`${vp.name}: ${e.message}`, 'fail');
      results.failed++;
    }
  }

  await browser.close();

  const duration = Date.now() - startTime;

  console.log('\n' + '='.repeat(50));
  log('结果总结');
  console.log('='.repeat(50));
  console.log(`${colors.green}通过: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}失败: ${results.failed}${colors.reset}`);
  if (results.warnings.length) {
    console.log(`\n${colors.yellow}警告:${colors.reset}`);
    results.warnings.forEach(w => console.log(`  ⚠️ ${w}`));
  }
  console.log(`\n耗时: ${(duration/1000).toFixed(1)}s`);
  console.log('='.repeat(50));

  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(console.error);
