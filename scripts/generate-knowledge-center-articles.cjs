/**
 * Generate Knowledge Center articles (Buying Guides) for all Level-2 categories.
 * Uses DashScope (Qwen) API to create SEO-optimized, AEO-friendly content.
 * 
 * AEO Optimization:
 * - Semantic triples (Subject-Verb-Object) for AI extraction
 * - Direct answer paragraphs for featured snippets
 * - FAQ section for People Also Ask
 * - Clear structure with H2/H3 headings
 * 
 * Usage: node scripts/generate-knowledge-center-articles.cjs
 */
const { MongoClient, ObjectId } = require('mongodb')

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio?retryWrites=true&w=majority'
const DASHSCOPE_API_KEY = 'sk-73c6886b82a64d00adf44d147b2dcf63'
const MODEL = 'qwen-max'
const CONCURRENCY = 3 // parallel requests (conservative for quality)

async function callDashScope(prompt, systemPrompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        if (response.status === 429) {
          console.log(`    Rate limited, waiting ${5 * (attempt + 1)}s...`)
          await new Promise(r => setTimeout(r, 5000 * (attempt + 1)))
          continue
        }
        throw new Error(`API ${response.status}: ${errText.substring(0, 200)}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content.trim()
      return JSON.parse(content)
    } catch (err) {
      if (attempt < retries) {
        console.log(`    Retry ${attempt + 1}/${retries}: ${err.message}`)
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
        continue
      }
      throw err
    }
  }
}

// Convert plain text sections to Lexical richText format
function textToLexical(sections) {
  const children = []
  
  if (!Array.isArray(sections)) {
    console.log('    Warning: sections is not an array, wrapping...')
    sections = [sections]
  }
  
  for (const section of sections) {
    if (!section || typeof section !== 'object') continue
    
    if (section.type === 'heading') {
      children.push({
        type: 'heading',
        tag: section.level || 'h2',
        children: [{ type: 'text', text: String(section.text || ''), format: 0, detail: 0, mode: 'normal', style: '' }],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      })
    } else if (section.type === 'paragraph') {
      children.push({
        type: 'paragraph',
        children: [{ type: 'text', text: String(section.text || ''), format: 0, detail: 0, mode: 'normal', style: '' }],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        version: 1,
      })
    } else if (section.type === 'list') {
      // Handle various list formats from AI
      let items = section.items
      if (!Array.isArray(items)) {
        if (typeof items === 'string') {
          items = items.split('\n').filter(Boolean)
        } else {
          items = []
        }
      }
      
      if (items.length > 0) {
        children.push({
          type: 'list',
          listType: section.ordered ? 'number' : 'bullet',
          start: 1,
          tag: section.ordered ? 'ol' : 'ul',
          children: items.map(item => ({
            type: 'listitem',
            value: 1,
            children: [{ type: 'text', text: String(item || ''), format: 0, detail: 0, mode: 'normal', style: '' }],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          })),
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        })
      }
    }
  }
  
  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

const SYSTEM_PROMPT = `You are an expert B2B industrial content writer specializing in MRO (Maintenance, Repair, Operations) supplies. 
Your task is to create comprehensive buying guides that are:
1. SEO-optimized with natural keyword usage
2. AEO-friendly with clear, quotable answer paragraphs (for AI citation)
3. Written for procurement professionals and facility managers
4. Technically accurate and practical

Output Format (JSON):
{
  "title": "How to Choose [Category]: Complete Buying Guide for Industrial Applications",
  "slug": "how-to-choose-[category-slug]-buying-guide",
  "excerpt": "150-200 char summary with main keyword",
  "sections": [
    {"type": "paragraph", "text": "Opening paragraph with direct answer to 'what is this category'"},
    {"type": "heading", "level": "h2", "text": "Why [Category] Matters for Industrial Operations"},
    {"type": "paragraph", "text": "Content..."},
    {"type": "heading", "level": "h2", "text": "Key Factors to Consider When Choosing [Category]"},
    {"type": "list", "ordered": false, "items": ["Factor 1: explanation", "Factor 2: explanation"]},
    {"type": "heading", "level": "h2", "text": "Types of [Category] and Their Applications"},
    {"type": "paragraph", "text": "Content..."},
    {"type": "heading", "level": "h2", "text": "Industry Standards and Certifications"},
    {"type": "paragraph", "text": "Content about ANSI, OSHA, ISO standards..."},
    {"type": "heading", "level": "h2", "text": "Common Mistakes to Avoid"},
    {"type": "list", "ordered": true, "items": ["Mistake 1", "Mistake 2", "Mistake 3"]},
    {"type": "heading", "level": "h2", "text": "Frequently Asked Questions"},
    {"type": "heading", "level": "h3", "text": "Q: Question 1?"},
    {"type": "paragraph", "text": "A: Answer 1 (2-3 sentences)"},
    {"type": "heading", "level": "h3", "text": "Q: Question 2?"},
    {"type": "paragraph", "text": "A: Answer 2"},
    {"type": "heading", "level": "h2", "text": "Conclusion: Making the Right Choice"},
    {"type": "paragraph", "text": "Summary with call to action"}
  ],
  "tags": ["tag1", "tag2", "tag3"],
  "metaTitle": "How to Choose [Category] | Industrial Buying Guide 2026",
  "metaDescription": "Learn how to select the right [category] for your facility. Expert guide covering types, specifications, standards, and best practices for B2B buyers."
}

Important:
- Write 1500-2000 words total
- Use semantic triples: "[Product] provides [benefit]", "[Feature] ensures [outcome]"
- Include specific numbers, standards, and technical specs where relevant
- Write for US market (use imperial units, ANSI/OSHA standards)
- Make FAQ questions natural - how users would ask AI assistants`

async function generateArticle(category, parentCategory) {
  const prompt = `Write a comprehensive buying guide for the industrial category: "${category.name}"
Parent Category: ${parentCategory?.name || 'Top Level'}

This guide should help B2B buyers (procurement managers, facility managers, safety officers) understand:
1. What products are in this category
2. How to choose the right products for their needs
3. Key specifications and standards to look for
4. Common applications and use cases
5. Mistakes to avoid when purchasing

Category context: This is part of Machrio's B2B industrial MRO (Maintenance, Repair, Operations) catalog.`

  return await callDashScope(prompt, SYSTEM_PROMPT)
}

async function main() {
  console.log('='.repeat(60))
  console.log('Knowledge Center Article Generator')
  console.log('Generating Buying Guides for Level-2 Categories')
  console.log('='.repeat(60))
  
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db('machrio')
  
  try {
    // Get all categories
    const categories = await db.collection('categories').find().toArray()
    const topLevel = categories.filter(c => !c.parent)
    const level2 = categories.filter(c => {
      if (!c.parent) return false
      return topLevel.some(t => t._id.toString() === c.parent.toString())
    })
    
    console.log(`\nFound ${level2.length} Level-2 categories to process`)
    
    // Check existing articles to avoid duplicates
    const existingArticles = await db.collection('articles').find({
      category: 'buying-guide'
    }).toArray()
    const existingSlugs = new Set(existingArticles.map(a => a.slug))
    
    console.log(`Existing buying guides: ${existingArticles.length}`)
    
    // Filter categories that need articles
    const categoriesToProcess = level2.filter(cat => {
      const expectedSlug = `how-to-choose-${cat.slug}-buying-guide`
      return !existingSlugs.has(expectedSlug)
    })
    
    console.log(`Categories needing articles: ${categoriesToProcess.length}\n`)
    
    if (categoriesToProcess.length === 0) {
      console.log('All categories already have buying guides!')
      return
    }
    
    let successCount = 0
    let errorCount = 0
    
    // Process in batches
    for (let i = 0; i < categoriesToProcess.length; i += CONCURRENCY) {
      const batch = categoriesToProcess.slice(i, i + CONCURRENCY)
      console.log(`\nBatch ${Math.floor(i/CONCURRENCY) + 1}/${Math.ceil(categoriesToProcess.length/CONCURRENCY)}`)
      
      const results = await Promise.allSettled(
        batch.map(async (cat) => {
          const parent = topLevel.find(t => t._id.toString() === cat.parent?.toString())
          console.log(`  Processing: ${cat.name} (${parent?.name || 'unknown parent'})`)
          
          try {
            const articleData = await generateArticle(cat, parent)
            
            // Convert sections to Lexical format
            const content = textToLexical(articleData.sections)
            
            // Calculate reading time (~200 words per minute)
            const wordCount = articleData.sections
              .filter(s => s.type === 'paragraph')
              .reduce((sum, s) => sum + (s.text?.split(/\s+/).length || 0), 0)
            const readingTime = Math.max(1, Math.ceil(wordCount / 200))
            
            // Prepare article document
            const article = {
              title: articleData.title,
              slug: articleData.slug || `how-to-choose-${cat.slug}-buying-guide`,
              excerpt: articleData.excerpt,
              content,
              category: 'buying-guide',
              tags: articleData.tags || [cat.slug, parent?.slug].filter(Boolean),
              author: 'Machrio Technical Team',
              status: 'published',
              publishedAt: new Date(),
              relatedCategories: [cat._id],
              seo: {
                metaTitle: articleData.metaTitle,
                metaDescription: articleData.metaDescription,
              },
              readingTime,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            
            // Insert into database
            await db.collection('articles').insertOne(article)
            console.log(`    ✓ Created: ${article.title}`)
            return { success: true, category: cat.name }
          } catch (err) {
            console.log(`    ✗ Failed: ${cat.name} - ${err.message}`)
            return { success: false, category: cat.name, error: err.message }
          }
        })
      )
      
      // Count results
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++
        } else {
          errorCount++
        }
      }
      
      // Rate limiting pause between batches
      if (i + CONCURRENCY < categoriesToProcess.length) {
        console.log('  Waiting 3s before next batch...')
        await new Promise(r => setTimeout(r, 3000))
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('Generation Complete!')
    console.log(`  Success: ${successCount}`)
    console.log(`  Errors: ${errorCount}`)
    console.log('='.repeat(60))
    
    // Verify final count
    const finalCount = await db.collection('articles').countDocuments({ category: 'buying-guide' })
    console.log(`\nTotal buying guides in database: ${finalCount}`)
    
  } finally {
    await client.close()
  }
}

main().catch(console.error)
