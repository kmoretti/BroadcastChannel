import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import { highlightCode } from '../prism.ts'

const tagRegex = /(^|\s)#([\u4E00-\u9FA5\w-]+)/g

function transformTags(content: string): string {
  return content.replace(tagRegex, (match, prefix, tag) => {
    return `${prefix}<a href="/search/result?q=${encodeURIComponent(tag)}" class="memo-tag">#${tag}</a>`
  })
}

function transformCodeBlocks(html: string): string {
  return html.replace(/<pre><code class="language-([^"]*)">([\s\S]*?)<\/code><\/pre>/g, (_, lang, code) => {
    const highlighted = highlightCode(decodeHtmlEntities(code), lang || 'text')
    return `<pre class="language-${lang || 'text'}"><code class="language-${lang || 'text'}">${highlighted}</code></pre>`
  }).replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_, code) => {
    const highlighted = highlightCode(decodeHtmlEntities(code), 'text')
    return `<pre class="language-text"><code class="language-text">${highlighted}</code></pre>`
  })
}

function decodeHtmlEntities(html: string): string {
  return html.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'')
}

function sanitizeLinks(html: string): string {
  return html.replace(/<a(?!\s+class="memo-tag")/g, '<a target="_blank" rel="noopener noreferrer"')
}

export function renderMarkdown(content: string): string {
  const withTags = transformTags(content)
  const rawHtml = marked.parse(withTags, { async: false }) as string
  const withCode = transformCodeBlocks(rawHtml)
  const withLinks = sanitizeLinks(withCode)
  return sanitizeHtml(withLinks, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'em',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'del',
      'img',
      'span',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'class'],
      code: ['class'],
      pre: ['class'],
      img: ['src', 'alt', 'title'],
    },
    allowedClasses: {
      a: ['memo-tag'],
      code: ['language-*'],
      pre: ['language-*'],
      span: ['token', 'token-*'],
    },
  })
}
