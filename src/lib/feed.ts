import type { Memo, MemoInfo } from '../types.ts'

export interface FeedMemo {
  id: string
  title: string
  link: string
  pubDate: Date
  content: string
  snippet: string
}

export function buildFeedMemos(info: MemoInfo, siteUrl?: string): FeedMemo[] {
  const baseUrl = siteUrl || info.instanceUrl
  return info.memos.map((memo: Memo) => {
    const title = memo.property.title || memo.snippet.slice(0, 60) || `Memo ${memo.shortId}`
    return {
      id: memo.id,
      title,
      link: `${baseUrl.replace(/\/$/, '')}/posts/${memo.shortId}`,
      pubDate: new Date(memo.createTime),
      content: memo.html,
      snippet: memo.snippet,
    }
  })
}
