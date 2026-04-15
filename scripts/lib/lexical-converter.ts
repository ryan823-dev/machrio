/**
 * HTML to Lexical JSON Converter
 * Converts Markdown/HTML content to PayloadCMS Lexical richText format
 */

interface LexicalNode {
  type: string
  children?: LexicalNode[]
  tag?: string
  listType?: string
  text?: string
  format?: number
  style?: string
}

interface LexicalRoot {
  root: {
    children: LexicalNode[]
    direction: 'ltr' | 'rtl'
    format: string
    indent: number
    type: 'root'
    version: 1
  }
}

const TEXT_FORMAT_BOLD = 1
const TEXT_FORMAT_ITALIC = 2

function createTextNode(text: string, format?: number): LexicalNode {
  return format
    ? { type: 'text', text, format }
    : { type: 'text', text }
}

function processInlineMarkdown(text: string): LexicalNode[] {
  const nodes: LexicalNode[] = []
  const pattern = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_)/g
  let lastIndex = 0

  for (const match of text.matchAll(pattern)) {
    const token = match[0]
    const index = match.index ?? 0

    if (index > lastIndex) {
      nodes.push(createTextNode(text.slice(lastIndex, index)))
    }

    if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(createTextNode(token.slice(2, -2), TEXT_FORMAT_BOLD))
    } else {
      nodes.push(createTextNode(token.slice(1, -1), TEXT_FORMAT_ITALIC))
    }

    lastIndex = index + token.length
  }

  if (lastIndex < text.length) {
    nodes.push(createTextNode(text.slice(lastIndex)))
  }

  return nodes.filter((node) => typeof node.text === 'string' && node.text.length > 0)
}

/**
 * Convert HTML string to Lexical JSON format
 * Supports: paragraphs, headings (h1-h6), lists (ul/ol), bold, italic, links
 */
export function htmlToLexical(html: string): LexicalRoot {
  const lines = html.split(/\n+/).filter(line => line.trim())
  const children: LexicalNode[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Parse heading tags
    const headingMatch = trimmed.match(/^<h([1-6])>(.*?)<\/h[1-6]>/i)
    if (headingMatch) {
      children.push({
        type: 'heading',
        tag: `h${headingMatch[1]}`,
        children: [{ type: 'text', text: headingMatch[2] }],
      })
      continue
    }

    // Parse paragraph tags
    const paragraphMatch = trimmed.match(/^<p>(.*?)<\/p>/i)
    if (paragraphMatch) {
      children.push({
        type: 'paragraph',
        children: processInlineHTML(paragraphMatch[1]),
      })
      continue
    }

    // Parse unordered lists
    const ulMatch = trimmed.match(/^<ul>(.*?)<\/ul>/is)
    if (ulMatch) {
      const items = extractListItems(ulMatch[1])
      children.push({
        type: 'list',
        listType: 'bullet',
        children: items.map(text => ({
          type: 'listitem',
          children: processInlineHTML(text),
        })),
      })
      continue
    }

    // Parse ordered lists
    const olMatch = trimmed.match(/^<ol>(.*?)<\/ol>/is)
    if (olMatch) {
      const items = extractListItems(olMatch[1])
      children.push({
        type: 'list',
        listType: 'number',
        children: items.map(text => ({
          type: 'listitem',
          children: processInlineHTML(text),
        })),
      })
      continue
    }

    // Plain text (wrap in paragraph)
    children.push({
      type: 'paragraph',
      children: processInlineHTML(trimmed),
    })
  }

  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

/**
 * Process inline HTML elements (bold, italic, links)
 */
function processInlineHTML(html: string): Array<{ type: string; text: string; format?: number; style?: string }> {
  const result: Array<{ type: string; text: string; format?: number; style?: string }> = []
  
  // Simple text without inline formatting
  let text = html
    .replace(/<strong>(.*?)<\/strong>/gi, '$1')
    .replace(/<b>(.*?)<\/b>/gi, '$1')
    .replace(/<em>(.*?)<\/em>/gi, '$1')
    .replace(/<i>(.*?)<\/i>/gi, '$1')
    .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
  
  if (text.trim()) {
    result.push({ type: 'text', text: text.trim() })
  }
  
  return result
}

/**
 * Extract list items from HTML
 */
function extractListItems(html: string): string[] {
  const items: string[] = []
  const liRegex = /<li>(.*?)<\/li>/gi
  let match
  
  while ((match = liRegex.exec(html)) !== null) {
    items.push(match[1])
  }
  
  return items
}

/**
 * Convert plain text with line breaks to Lexical format
 * Handles simple text content without HTML
 */
export function textToLexical(text: string): LexicalRoot {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
  const children: LexicalNode[] = []

  for (const para of paragraphs) {
    const lines = para.split(/\n/).filter(line => line.trim())
    
    // Check if first line looks like a heading
    if (lines.length > 0 && lines[0].length < 100 && !lines[0].includes(' ')) {
      children.push({
        type: 'heading',
        tag: 'h3',
        children: processInlineMarkdown(lines[0].trim()),
      })
      
      if (lines.length > 1) {
        children.push({
          type: 'paragraph',
          children: processInlineMarkdown(lines.slice(1).join(' ').trim()),
        })
      }
    } else {
      children.push({
        type: 'paragraph',
        children: processInlineMarkdown(lines.join(' ').trim()),
      })
    }
  }

  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

/**
 * Convert Markdown-style content to Lexical
 * Supports: # headings, **bold**, *italic*, - lists, 1. numbered lists
 */
export function markdownToLexical(markdown: string): LexicalRoot {
  const lines = markdown.split(/\r?\n/)
  const children: LexicalNode[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim()
    if (!trimmed) continue

    // Headings
    if (trimmed.startsWith('### ')) {
      children.push({
        type: 'heading',
        tag: 'h3',
        children: processInlineMarkdown(trimmed.slice(4)),
      })
      continue
    }

    if (trimmed.startsWith('## ')) {
      children.push({
        type: 'heading',
        tag: 'h2',
        children: processInlineMarkdown(trimmed.slice(3)),
      })
      continue
    }

    if (trimmed.startsWith('# ')) {
      children.push({
        type: 'heading',
        tag: 'h1',
        children: processInlineMarkdown(trimmed.slice(2)),
      })
      continue
    }

    // Unordered list items
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems: LexicalNode[] = []
      let i = index

      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        listItems.push({
          type: 'listitem',
          children: processInlineMarkdown(lines[i].trim().slice(2)),
        })
        i++
      }

      children.push({
        type: 'list',
        listType: 'bullet',
        children: listItems,
      })

      index = i - 1
      continue
    }

    // Ordered list items
    if (/^\d+\.\s/.test(trimmed)) {
      const listItems: LexicalNode[] = []
      let i = index

      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push({
          type: 'listitem',
          children: processInlineMarkdown(lines[i].trim().replace(/^\d+\.\s+/, '')),
        })
        i++
      }

      children.push({
        type: 'list',
        listType: 'number',
        children: listItems,
      })

      index = i - 1
      continue
    }

    // Default: paragraph
    children.push({
      type: 'paragraph',
      children: processInlineMarkdown(trimmed),
    })
  }

  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}
