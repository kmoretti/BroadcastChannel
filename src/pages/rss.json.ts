import type { APIContext } from 'astro'
import { buildFeedMemos } from '../lib/feed.ts'
import { getMemosInfo } from '../lib/memos/index.ts'
import { getSiteInfo, resolveSiteUrl } from '../lib/memos/instance.ts'

export async function GET(context: APIContext) {
  const [info, site] = await Promise.all([getMemosInfo({ pageSize: 50 }), getSiteInfo()])
  const siteUrl = resolveSiteUrl(context.site, site)
  const items = buildFeedMemos(info, siteUrl)
  return new Response(JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    title: site.title,
    description: site.description,
    home_page_url: siteUrl,
    feed_url: `${siteUrl}/rss.json`,
    items: items.map(item => ({
      id: item.id,
      title: item.title,
      content_html: item.content,
      summary: item.snippet,
      url: item.link,
      date_published: item.pubDate.toISOString(),
    })),
  }), {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
