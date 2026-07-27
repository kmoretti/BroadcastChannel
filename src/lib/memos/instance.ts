import { getMemosAvatar, getMemosDescription, getMemosTitle } from '../env.ts'
import * as cache from './cache.ts'

export interface SiteInfo {
  title: string
  description: string
  avatar: string
  instanceUrl: string
}

export async function getSiteInfo(): Promise<SiteInfo> {
  const profile = await cache.getCachedInstanceProfile()
  const envTitle = getMemosTitle()
  const envDescription = getMemosDescription()
  const envAvatar = getMemosAvatar()
  return {
    title: envTitle || profile.admin?.displayName || profile.admin?.username || 'Memos',
    description: envDescription || profile.admin?.description || '',
    avatar: envAvatar || profile.admin?.avatarUrl || '',
    instanceUrl: profile.instanceUrl,
  }
}
