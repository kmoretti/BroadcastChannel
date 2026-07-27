import type { APIContext } from 'astro'
import { getMemosInfo } from '../lib/memos/index.ts'
import { getSiteInfo } from '../lib/memos/instance.ts'

export async function GET(context: APIContext) {
  const [info, site] = await Promise.all([getMemosInfo({ pageSize: 1000 }), getSiteInfo()])
  const baseUrl = context.site?.toString() || site.instanceUrl
  const urls = info.memos.map(m => `<url><loc>${baseUrl}/posts/${m.shortId}</loc><lastmod>${m.updateTime}</lastmod></url>`).join('')
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
