/**
 * AI Content Generation Prompts for Category SEO/AEO
 * Templates for generating intro_content, buying_guide, faq, and seo_content
 */

export interface CategoryData {
  slug: string
  name: string
  level: 'L1' | 'L2' | 'L3'
  parentName?: string
  parentSlug?: string
  existingDescription?: string
  productCount?: number
}

export interface GeneratedContent {
  introContent: string
  buyingGuide: string
  faq: Array<{ question: string; answer: string }>
  seoContent: string
}

/**
 * Generate AI prompt for category content
 */
export function generateCategoryPrompt(category: CategoryData): string {
  const { name, level, parentName, existingDescription } = category
  
  const wordCounts = {
    L1: { intro: 200, guide: 250, seo: 200, faqCount: 6 },
    L2: { intro: 150, guide: 200, seo: 150, faqCount: 5 },
    L3: { intro: 250, guide: 300, seo: 250, faqCount: 8 },
  }
  
  const counts = wordCounts[level]
  
  return `You are an SEO content specialist for Machrio (machrio.com), a B2B industrial MRO supplier serving global buyers.

Generate SEO-optimized, AEO-ready content for the following category:

**Category Information:**
- Name: ${name}
- Level: ${level} ${level === 'L1' ? '(Top-level category)' : level === 'L2' ? '(Subcategory)' : '(Leaf category)'}
${parentName ? `- Parent Category: ${parentName}` : ''}
- Current Description: ${existingDescription || 'Not provided'}

**Content Requirements:**

1. **introContent** (${counts.intro}-250 words):
   - Start with a clear definition of the category
   - Include 2-3 key industrial applications
   - Mention Machrio's value propositions: fast shipping, verified suppliers, bulk discounts
   - Natural integration of primary keywords
   - Professional, informative tone for B2B buyers
   ${level === 'L1' ? '- Cover the full breadth of the category' : level === 'L2' ? '- Focus on this specific product type' : '- Include technical specifications and use cases'}

2. **buyingGuide** (${counts.guide}-300 words):
   - Title: "How to Choose the Right ${name}"
   - 3-5 key selection criteria with detailed explanations
   - Include relevant industry standards (ANSI, OSHA, ISO, etc.) where applicable
   - Use H2/H3 headings structure
   - Add bullet points for readability
   - Address common buyer concerns and decision factors
   ${level === 'L3' ? '- Include specific technical parameters to consider' : '- Focus on general selection principles'}

3. **faq** (${counts.faqCount} Q&A pairs):
   - Questions that B2B buyers actually ask (not generic consumer questions)
   - Answers: 2-4 sentences each, informative and specific
   - Include keywords naturally
   - Cover topics like:
     * Technical specifications and compatibility
     * Lead times and availability
     * Certifications and compliance
     * Bulk pricing and MOQ
     * Applications and use cases
   ${level === 'L3' ? '- Include installation and maintenance questions' : ''}

4. **seoContent** (${counts.seo}-250 words):
   - Long-tail keyword variations
   - Related product categories (for internal linking)
   - Industry-specific applications
   - Brand mentions where relevant (3M, Loctite, etc.)
   - Geographic and market segments served
   - Call-to-action for RFQ or product browsing

**SEO/AEO Best Practices:**
- Use semantic HTML structure (H2/H3 headings)
- Include LSI (Latent Semantic Indexing) keywords
- Write for both humans and AI search engines
- Avoid keyword stuffing - maintain natural flow
- Include specific numbers, standards, and technical details
- Answer questions directly for AI citation potential

**Output Format:**
Return as JSON with exactly these keys:
{
  "introContent": "string (plain text, will be converted to Lexical)",
  "buyingGuide": "string (use Markdown: ## for H2, ### for H3, - for bullets)",
  "faq": [{"question": "string", "answer": "string"}],
  "seoContent": "string (plain text, will be converted to Lexical)"
}

**Tone & Style:**
- Professional B2B tone
- Technical but accessible
- Action-oriented for conversion
- Trust-building (mention quality, reliability, compliance)

**DO NOT:**
- Use consumer-focused language ("you'll love", "amazing")
- Make unverifiable claims ("best", "#1")
- Include pricing (varies by quantity)
- Write generic content that could apply to any category`
}

/**
 * Generate follow-up prompt for content refinement
 */
export function generateRefinementPrompt(
  category: CategoryData,
  generatedContent: GeneratedContent,
  issues: string[]
): string {
  return `Please revise the content for ${category.name} (${category.slug}) based on these issues:

${issues.map(issue => `- ${issue}`).join('\n')}

Original content:
${JSON.stringify(generatedContent, null, 2)}

Please regenerate improved content addressing all issues while maintaining SEO/AEO best practices.`
}

/**
 * Validate generated content meets requirements
 */
export function validateGeneratedContent(content: GeneratedContent): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  // Validate introContent
  if (!content.introContent || content.introContent.trim().length < 100) {
    issues.push('introContent is too short (minimum 100 characters)')
  }
  
  // Validate buyingGuide
  if (!content.buyingGuide || content.buyingGuide.trim().length < 150) {
    issues.push('buyingGuide is too short (minimum 150 characters)')
  }
  
  if (!content.buyingGuide.includes('##') && !content.buyingGuide.includes('###')) {
    issues.push('buyingGuide should include H2/H3 headings')
  }
  
  // Validate FAQ
  if (!content.faq || !Array.isArray(content.faq)) {
    issues.push('faq should be an array of Q&A pairs')
  } else {
    if (content.faq.length < 3) {
      issues.push('faq should have at least 3 questions')
    }
    
    content.faq.forEach((item, index) => {
      if (!item.question || !item.answer) {
        issues.push(`faq item ${index + 1} is missing question or answer`)
      }
      if (item.answer && item.answer.length < 20) {
        issues.push(`faq item ${index + 1} answer is too short`)
      }
    })
  }
  
  // Validate seoContent
  if (!content.seoContent || content.seoContent.trim().length < 100) {
    issues.push('seoContent is too short (minimum 100 characters)')
  }
  
  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Sample prompts for testing
 */
export const samplePrompts = {
  safety: {
    slug: 'safety',
    name: 'Safety',
    level: 'L1' as const,
    existingDescription: 'Comprehensive personal protective equipment (PPE) and safety supplies for industrial workplaces.',
  },
  
  gloves: {
    slug: 'safety-gloves',
    name: 'Safety Gloves',
    level: 'L2' as const,
    parentName: 'Safety',
    existingDescription: 'Hand protection for various industrial applications including cut resistance, chemical resistance, and general purpose.',
  },
  
  cutResistant: {
    slug: 'cut-resistant-gloves',
    name: 'Cut Resistant Gloves',
    level: 'L3' as const,
    parentName: 'Safety Gloves',
    existingDescription: 'Gloves designed to protect against cuts and lacerations from sharp materials.',
  },
}
