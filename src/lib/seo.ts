import type { SiteInfo } from './memos/instance.ts'

function isImageUrl(value: string | undefined): boolean {
  if (!value)
    return false
  return /^https?:\/\//i.test(value)
}

export function getSiteMeta(site: SiteInfo) {
  return {
    title: site.title,
    description: site.description,
    image: isImageUrl(site.avatar) ? site.avatar : undefined,
    url: site.instanceUrl,
  }
}
