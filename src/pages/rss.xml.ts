import type { APIContext } from 'astro'
import rss from '@astrojs/rss'
import { buildFeedMemos } from '../lib/feed.ts'
import { getMemosInfo } from '../lib/memos/index.ts'
import { getSiteInfo, resolveSiteUrl } from '../lib/memos/instance.ts'

export async function GET(context: APIContext) {
  const [info, site] = await Promise.all([getMemosInfo({ pageSize: 50 }), getSiteInfo()])
  const siteUrl = resolveSiteUrl(context.site, site)
  const items = buildFeedMemos(info, siteUrl)
  const response = await rss({
    title: site.title,
    description: site.description,
    site: siteUrl,
    items: items.map(item => ({
      title: item.title,
      pubDate: item.pubDate,
      description: item.snippet,
      link: item.link,
      content: item.content,
    })),
  })
  response.headers.set('Cache-Control', 'public, max-age=3600')
  return response
}
