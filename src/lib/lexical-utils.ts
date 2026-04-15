/**
 * Lexical richText utility functions
 * For converting and working with Payload CMS Lexical format.
 */

type LexicalNode = Record<string, unknown>

const TEXT_FORMAT_BOLD = 1
const TEXT_FORMAT_ITALIC = 2

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function applyMarkdownFallback(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>')
}

function unwrapJsonString(value: string): unknown {
  let current: unknown = value

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (typeof current !== 'string') break

    const trimmed = current.trim()
    if (!trimmed) return ''

    const firstChar = trimmed[0]
    if (!['{', '[', '"'].includes(firstChar)) break

    try {
      current = JSON.parse(trimmed)
    } catch {
      break
    }
  }

  return current
}

export function normalizeRichTextContent(richText: unknown): unknown {
  if (typeof richText !== 'string') return richText

  const parsed = unwrapJsonString(richText)
  return typeof parsed === 'string' ? richText : parsed
}

function extractNodePlainText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''

  const record = node as LexicalNode
  if (record.type === 'text') return typeof record.text === 'string' ? record.text : ''
  if (record.type === 'list') return extractListItemTexts(record).join(' ')
  if (Array.isArray(record.children)) return extractChildrenPlain(record.children)

  return ''
}

export function extractChildrenPlain(children: unknown[]): string {
  if (!Array.isArray(children)) return ''

  return children.map(extractNodePlainText).join('')
}

function extractListItemTexts(node: LexicalNode): string[] {
  if (!Array.isArray(node.children)) return []

  return (node.children as LexicalNode[])
    .map((item) => extractChildrenPlain((item.children as unknown[]) || []).trim())
    .filter(Boolean)
}

function isRedundantFollowupList(previous: LexicalNode, next: LexicalNode): boolean {
  if (previous.type !== 'list' || next.type !== 'list') return false
  if (previous.listType !== next.listType) return false

  const previousItems = extractListItemTexts(previous)
  const nextItems = extractListItemTexts(next)

  if (previousItems.length === 0 || nextItems.length === 0 || nextItems.length > previousItems.length) {
    return false
  }

  const suffix = previousItems.slice(previousItems.length - nextItems.length)
  return suffix.every((item, index) => item === nextItems[index])
}

function normalizeNodes(nodes: LexicalNode[]): LexicalNode[] {
  const normalized: LexicalNode[] = []

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]
    normalized.push(node)

    if (node.type !== 'list') continue

    let previous = node
    while (index + 1 < nodes.length && isRedundantFollowupList(previous, nodes[index + 1] as LexicalNode)) {
      previous = nodes[index + 1] as LexicalNode
      index += 1
    }
  }

  return normalized
}

function getRootChildren(richText: unknown): LexicalNode[] {
  const normalized = normalizeRichTextContent(richText)
  if (!normalized || typeof normalized !== 'object') return []

  const root = (normalized as LexicalNode).root as LexicalNode | undefined
  if (!root || !Array.isArray(root.children)) return []

  return normalizeNodes(root.children as LexicalNode[])
}

function buildHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function extractChildren(children: unknown[]): string {
  if (!Array.isArray(children)) return ''

  return children
    .map((node) => {
      const n = node as LexicalNode

      if (n.type === 'text') {
        const rawText = typeof n.text === 'string' ? n.text : ''
        if (!rawText) return ''

        let text = applyMarkdownFallback(rawText)
        const format = typeof n.format === 'number' ? n.format : 0

        if ((format & TEXT_FORMAT_BOLD) === TEXT_FORMAT_BOLD || n.bold) {
          text = `<strong>${text}</strong>`
        }

        if ((format & TEXT_FORMAT_ITALIC) === TEXT_FORMAT_ITALIC || n.italic) {
          text = `<em>${text}</em>`
        }

        return text
      }

      if (n.type === 'link') {
        const fields = (n.fields as LexicalNode | undefined) || {}
        const url =
          (typeof n.url === 'string' && n.url) ||
          (typeof fields.url === 'string' && fields.url) ||
          '#'
        const inner = extractChildren((n.children as unknown[]) || [])

        return `<a href="${escapeHtml(url)}" class="text-primary-600 underline hover:text-primary-800">${inner}</a>`
      }

      if (Array.isArray(n.children)) return extractChildren(n.children)

      return ''
    })
    .join('')
}

export function extractPlainText(richText: unknown): string {
  return getRootChildren(richText)
    .map((node) => extractNodePlainText(node).trim())
    .filter(Boolean)
    .join(' ')
}

export function extractHeadings(richText: unknown): { id: string; text: string; level: number }[] {
  return getRootChildren(richText)
    .filter((node) => node.type === 'heading')
    .map((node) => {
      const text = extractChildrenPlain((node.children as unknown[]) || []).trim()
      const id = buildHeadingId(text)
      const tag = typeof node.tag === 'string' ? node.tag : 'h3'
      const parsedLevel = Number.parseInt(tag.replace('h', ''), 10)
      const level = Number.isFinite(parsedLevel) ? parsedLevel : 3

      return { id, text, level }
    })
    .filter((heading) => heading.text.length > 0)
}

export function lexicalToHtml(richText: unknown): string {
  return getRootChildren(richText)
    .map((node) => {
      if (node.type === 'paragraph') {
        const text = extractChildren((node.children as unknown[]) || [])
        return text ? `<p>${text}</p>` : ''
      }

      if (node.type === 'heading') {
        const tag = typeof node.tag === 'string' ? node.tag : 'h3'
        const text = extractChildren((node.children as unknown[]) || [])
        const id = buildHeadingId(extractChildrenPlain((node.children as unknown[]) || []))

        return text ? `<${tag} id="${id}">${text}</${tag}>` : ''
      }

      if (node.type === 'list') {
        const listTag = node.listType === 'number' ? 'ol' : 'ul'
        const items = ((node.children as LexicalNode[]) || [])
          .map((item) => {
            const text = extractChildren((item.children as unknown[]) || [])
            return text ? `<li>${text}</li>` : ''
          })
          .filter(Boolean)
          .join('')

        return items ? `<${listTag}>${items}</${listTag}>` : ''
      }

      return ''
    })
    .filter(Boolean)
    .join('\n')
}

export function hasRichTextContent(richText: unknown): boolean {
  return extractPlainText(richText).trim().length > 0
}
