import Link from 'next/link'
import type { ReactNode } from 'react'

interface AIMessageContentProps {
  content: string
}

function stripMarkdownDecorators(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*(\S(?:.*?\S)?)\*/g, '$1')
    .replace(/_(\S(?:.*?\S)?)_/g, '$1')
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const normalizedText = stripMarkdownDecorators(text)
  const nodes: ReactNode[] = []
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(normalizedText)) !== null) {
    const [fullMatch, label, href] = match
    const startIndex = match.index

    if (startIndex > lastIndex) {
      nodes.push(normalizedText.slice(lastIndex, startIndex))
    }

    const key = `${keyPrefix}-${startIndex}`
    if (/^https?:\/\//.test(href)) {
      nodes.push(
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          {label}
        </a>,
      )
    } else {
      nodes.push(
        <Link key={key} href={href} className="underline underline-offset-2">
          {label}
        </Link>,
      )
    }

    lastIndex = startIndex + fullMatch.length
  }

  if (lastIndex < normalizedText.length) {
    nodes.push(normalizedText.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : [normalizedText]
}

function isBulletLine(line: string) {
  return /^(\s*[-*•]\s+)/.test(line)
}

function getBulletText(line: string) {
  return line.replace(/^(\s*[-*•]\s+)/, '').trim()
}

function isNumberedLine(line: string) {
  return /^\s*\d+\.\s+/.test(line)
}

function getNumberedText(line: string) {
  return line.replace(/^\s*\d+\.\s+/, '').trim()
}

export function AIMessageContent({ content }: AIMessageContentProps) {
  const blocks = content
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <div className="space-y-2">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)

        if (lines.length > 0 && lines.every(isBulletLine)) {
          return (
            <ul key={`bullet-${blockIndex}`} className="space-y-1 pl-4">
              {lines.map((line, lineIndex) => (
                <li key={`bullet-${blockIndex}-${lineIndex}`} className="list-disc">
                  {renderInline(getBulletText(line), `bullet-${blockIndex}-${lineIndex}`)}
                </li>
              ))}
            </ul>
          )
        }

        if (lines.length > 0 && lines.every(isNumberedLine)) {
          return (
            <ol key={`number-${blockIndex}`} className="space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={`number-${blockIndex}-${lineIndex}`} className="list-decimal">
                  {renderInline(getNumberedText(line), `number-${blockIndex}-${lineIndex}`)}
                </li>
              ))}
            </ol>
          )
        }

        return (
          <p key={`paragraph-${blockIndex}`} className="whitespace-pre-wrap">
            {lines.map((line, lineIndex) => (
              <span key={`paragraph-${blockIndex}-${lineIndex}`}>
                {lineIndex > 0 ? <br /> : null}
                {renderInline(line, `paragraph-${blockIndex}-${lineIndex}`)}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}
