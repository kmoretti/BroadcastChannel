import { getMemosApiUrl, getMemosAvatar, getMemosDescription, getMemosLogo, getMemosTitle, getSocialBilibiliUrl, getSocialEmailUrl, getSocialGithubUrl, getSocialQqUrl, getSocialRssUrl, getSocialTelegramUrl, getSocialXUrl } from '../env.ts'
import * as cache from './cache.ts'
import { getSiteIntroHtml } from './intro.ts'

export interface SiteInfo {
  title: string
  description: string
  avatar: string
  logo?: string
  instanceUrl: string
  introHtml: string
  social: {
    rss?: string
    x?: string
    github?: string
    telegram?: string
    qq?: string
    email?: string
    bilibili?: string
  }
}

export function inferInstanceUrl(apiUrl: string): string {
  return apiUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '')
}

function resolveAvatarUrl(avatarUrl: string | undefined, instanceUrl: string): string {
  if (!avatarUrl)
    return ''
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))
    return avatarUrl
  const base = instanceUrl.replace(/\/$/, '')
  const path = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`
  return `${base}${path}`
}

export async function getSiteInfo(): Promise<SiteInfo> {
  const profile = await cache.getCachedInstanceProfile()
  const envTitle = getMemosTitle()
  const envDescription = getMemosDescription()
  const envAvatar = getMemosAvatar()
  const instanceUrl = profile.instanceUrl || inferInstanceUrl(getMemosApiUrl())
  const adminAvatar = envAvatar || resolveAvatarUrl(profile.admin?.avatarUrl, instanceUrl)
  return {
    title: envTitle || profile.admin?.displayName || profile.admin?.username || 'Memos',
    description: envDescription || profile.admin?.description || '',
    avatar: adminAvatar,
    logo: getMemosLogo(),
    instanceUrl,
    introHtml: getSiteIntroHtml(),
    social: {
      rss: getSocialRssUrl(),
      x: getSocialXUrl(),
      github: getSocialGithubUrl(),
      telegram: getSocialTelegramUrl(),
      qq: getSocialQqUrl(),
      email: getSocialEmailUrl(),
      bilibili: getSocialBilibiliUrl(),
    },
  }
}

export function resolveSiteUrl(contextSite: URL | string | undefined, site: SiteInfo): string {
  const raw = contextSite ? contextSite.toString() : site.instanceUrl
  return raw.replace(/\/$/, '')
}
