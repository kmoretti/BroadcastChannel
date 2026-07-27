import type { SiteInfo } from './memos/instance.ts'

export function getSiteMeta(site: SiteInfo) {
  return {
    title: site.title,
    description: site.description,
    image: site.avatar,
    url: site.instanceUrl,
  }
}
