import type { APIContext } from 'astro'
import { getSiteInfo } from '../lib/memos/instance.ts'

export async function GET(context: APIContext) {
  const site = await getSiteInfo()
  const baseUrl = context.site?.toString() || site.instanceUrl
  return new Response(JSON.stringify({
    name: site.title,
    short_name: site.title,
    start_url: baseUrl,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: site.avatar ? [{ src: site.avatar, sizes: '192x192', type: 'image/png' }] : [],
  }), {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
