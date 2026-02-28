# Machrio 产品页与内容页互动架构

## 概述

本文档定义产品页（PDP、分类页）与内容页（Knowledge Center 文章、行业页）之间的双向导引策略，目标是通过科学的内部链接结构：

1. 帮助用户在采购决策过程中获得所需信息
2. 提升页面之间的 SEO 权重传递
3. 形成"教育→信任→转化"的用户旅程闭环

---

## 用户旅程模型

```
                    ┌─────────────────────────────────────┐
                    │          用户旅程阶段                │
                    └─────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   【调研阶段】           【比较阶段】           【决策阶段】
   "我需要什么?"         "这几个有什么区别?"    "这个适合我吗?"
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ 文章页  │ ──────▶  │ 分类页  │ ──────▶  │ 产品页  │
   │(选型指南)│          │(筛选比较)│          │(规格确认)│
   └─────────┘          └─────────┘          └─────────┘
        │                     │                     │
        │◀─────────────────────────────────────────┘
        │         (遇到疑问时回到内容页)
```

---

## 导引机制设计

### 1. 产品页 → 内容页（帮助决策）

**位置**：产品页侧边栏或规格表下方

**触发逻辑**：根据产品所属分类/标签，推荐对应的选型指南

| 产品分类/标签 | 推荐文章 |
|-------------|---------|
| Safety → gloves / cut-resistant | How to Choose Cut-Resistant Gloves |
| Safety → eyewear | Safety Glasses Buying Guide |
| Safety → fall protection / harness | Fall Protection Basics |
| Adhesives → thread locker | (待创建) Thread Locker Selection Guide |
| Material Handling → pallet jack | (待创建) Pallet Jack Buying Guide |

**UI 形式**：
```
┌─────────────────────────────────────┐
│ 💡 Not sure if this is right?       │
│                                     │
│ Read: How to Choose Cut-Resistant   │
│ Gloves: ANSI/ISEA 105 Explained →   │
└─────────────────────────────────────┘
```

**技术实现**：
- 创建 `RelatedGuide` 组件
- 基于产品 `tags` 或 `primaryCategory` 匹配文章
- 文章页的 `tags` 字段用于匹配

---

### 2. 分类页 → 内容页（引导学习）

**位置**：分类页顶部，筛选器上方

**触发逻辑**：分类 slug 映射到对应的选型指南

| 分类 slug | 推荐文章 |
|-----------|---------|
| safety | How to Choose Cut-Resistant Gloves (或通用 Safety 指南) |
| adhesives-sealants-tape | (待创建) Adhesives Selection Guide |
| material-handling | (待创建) Material Handling Buying Guide |
| packaging-shipping | (待创建) Packaging Buying Guide |

**UI 形式**：
```
┌─────────────────────────────────────────────────────────┐
│ 📖 Buying Guide: How to Choose Cut-Resistant Gloves    │
│ Understand ANSI/ISEA 105 cut levels A1-A9 →            │
└─────────────────────────────────────────────────────────┘
```

**技术实现**：
- 创建 `CategoryBuyingGuide` 组件
- 静态映射表：category slug → article slug
- 如无对应文章则不显示

---

### 3. 文章页 → 产品页（引导转化）

**位置**：文章末尾

**机制**：使用 Articles CMS 已有的 `relatedProducts` 字段

**UI 形式**：
```
┌─────────────────────────────────────────────────────────┐
│ Shop Products Featured in This Guide                   │
├─────────────────────────────────────────────────────────┤
│ [产品卡片1] [产品卡片2] [产品卡片3] [产品卡片4]         │
└─────────────────────────────────────────────────────────┘
```

**技术实现**：
- 文章详情页已支持 `relatedProducts` 渲染
- 创建/编辑文章时关联对应产品
- 可通过 Payload Admin 或脚本批量设置

---

### 4. 行业页 → 内容页（深度学习）

**位置**：FAQ 区域下方或 scenarios 区块中

**逻辑**：行业页关联的 categories 对应到该分类的选型指南

**UI 形式**：
```
┌─────────────────────────────────────────────────────────┐
│ 📚 Learn More                                          │
├─────────────────────────────────────────────────────────┤
│ • How to Choose Cut-Resistant Gloves →                 │
│ • Safety Glasses Buying Guide →                        │
│ • Fall Protection Basics →                             │
└─────────────────────────────────────────────────────────┘
```

**优先级**：P2（行业页已有较丰富内容，此项增量价值较低）

---

## 实施优先级

| 优先级 | 任务 | 影响 | 复杂度 | 状态 |
|-------|------|------|-------|------|
| **P0** | 产品页添加 "Related Guide" 区块 | 高（决策阶段用户转化） | 中 | ✅ 已完成 |
| **P0** | 分类页添加 "Buying Guide" 横幅 | 高（浏览阶段引导） | 低 | ✅ 已完成 |
| **P1** | 文章页使用 relatedProducts 显示产品 | 中（内容→转化闭环） | 低 | ✅ 已完成 |
| **P2** | 行业页添加 "Learn More" 文章链接 | 低 | 低 | 待定 |
| **P3** | 文章行文中嵌入产品卡片 | 中 | 高（需 CMS 支持） | 待定 |

---

## 文章-分类映射表

随着文章库扩充，持续更新此映射表：

| 文章 slug | 关联分类 | 关联产品标签 |
|-----------|---------|-------------|
| how-to-choose-cut-resistant-gloves | safety | gloves, cut-resistant |
| safety-glasses-buying-guide-ansi-z87 | safety | eyewear, glasses |
| fall-protection-basics-osha-requirements | safety | fall-protection, harness |

---

## 成功指标

1. **内链密度提升**：每个产品页至少 1 个内容页链接，每篇文章至少 3 个产品链接
2. **用户行为**：文章页 → 产品页的点击率 > 5%
3. **SEO 效果**：Knowledge Center 文章的有机流量占比提升
4. **转化率**：通过文章页进入的用户转化率高于直接访问产品页的用户

---

*文档创建：2026-02-28*
*最后更新：2026-02-28*
