import type { APIContext } from 'astro'
import rss from '@astrojs/rss'
import { buildFeedMemos } from '../lib/feed.ts'
import { getMemosInfo } from '../lib/memos/index.ts'
import { getSiteInfo } from '../lib/memos/instance.ts'

export async function GET(context: APIContext) {
  const info = await getMemosInfo({ pageSize: 50 })
  const site = await getSiteInfo()
  const items = buildFeedMemos(info)
  return rss({
    title: site.title,
    description: site.description,
    site: context.site?.toString() || site.instanceUrl,
    items: items.map(item => ({
      title: item.title,
      pubDate: item.pubDate,
      description: item.snippet,
      link: item.link,
      content: item.content,
    })),
  })
}
