import type { APIContext } from 'astro'
import { getSiteInfo, resolveSiteUrl } from '../lib/memos/instance.ts'

export async function GET(context: APIContext) {
  const site = await getSiteInfo()
  const baseUrl = resolveSiteUrl(context.site, site)
  const icons = site.avatar
    ? [{ src: site.avatar, sizes: '192x192', type: 'image/png' }]
    : [{ src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' }]
  return new Response(JSON.stringify({
    name: site.title,
    short_name: site.title,
    start_url: baseUrl,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons,
  }), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
