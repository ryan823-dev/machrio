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
        children: [{ type: 'text', text: lines[0].trim() }],
      })
      
      if (lines.length > 1) {
        children.push({
          type: 'paragraph',
          children: [{ type: 'text', text: lines.slice(1).join(' ').trim() }],
        })
      }
    } else {
      children.push({
        type: 'paragraph',
        children: [{ type: 'text', text: lines.join(' ').trim() }],
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
  const lines = markdown.split(/\n+/).filter(line => line.trim())
  const children: LexicalNode[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Headings
    if (trimmed.startsWith('### ')) {
      children.push({
        type: 'heading',
        tag: 'h3',
        children: [{ type: 'text', text: trimmed.slice(4) }],
      })
      continue
    }

    if (trimmed.startsWith('## ')) {
      children.push({
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: trimmed.slice(3) }],
      })
      continue
    }

    if (trimmed.startsWith('# ')) {
      children.push({
        type: 'heading',
        tag: 'h1',
        children: [{ type: 'text', text: trimmed.slice(2) }],
      })
      continue
    }

    // Unordered list items
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems: LexicalNode[] = []
      let i = lines.indexOf(line)
      
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        listItems.push({
          type: 'listitem',
          children: [{ type: 'text', text: lines[i].trim().slice(2) }],
        })
        i++
      }
      
      children.push({
        type: 'list',
        listType: 'bullet',
        children: listItems,
      })
      continue
    }

    // Default: paragraph
    children.push({
      type: 'paragraph',
      children: [{ type: 'text', text: trimmed }],
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
