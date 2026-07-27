import type { APIContext } from 'astro'
import { buildFeedMemos } from '../lib/feed.ts'
import { getMemosInfo } from '../lib/memos/index.ts'
import { getSiteInfo } from '../lib/memos/instance.ts'

export async function GET(context: APIContext) {
  const info = await getMemosInfo({ pageSize: 50 })
  const site = await getSiteInfo()
  const items = buildFeedMemos(info)
  return new Response(JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    title: site.title,
    description: site.description,
    home_page_url: context.site?.toString() || site.instanceUrl,
    feed_url: `${context.site?.toString() || site.instanceUrl}/rss.json`,
    items: items.map(item => ({
      id: item.id,
      title: item.title,
      content_html: item.content,
      summary: item.snippet,
      url: item.link,
      date_published: item.pubDate.toISOString(),
    })),
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
