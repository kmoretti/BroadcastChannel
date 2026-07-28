import type { Memo } from '../../types.ts'
import { getMemosApiUrl, getMemosCreatorAvatar, getMemosCreatorName } from '../env.ts'
import * as cache from './cache.ts'
import { inferInstanceUrl } from './instance.ts'

function absoluteAvatarUrl(avatarUrl: string, instanceUrl: string): string {
  if (!avatarUrl)
    return avatarUrl
  if (/^https?:\/\//.test(avatarUrl) || avatarUrl.startsWith('data:'))
    return avatarUrl
  if (avatarUrl.startsWith('//'))
    return `https:${avatarUrl}`
  const base = (instanceUrl || inferInstanceUrl(getMemosApiUrl())).replace(/\/$/, '')
  const path = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`
  return `${base}${path}`
}

async function fetchUser(username: string, instanceUrl: string): Promise<{ displayName?: string, avatarUrl?: string } | undefined> {
  try {
    const user = await cache.getCachedGetUser(username)
    if (!user)
      return undefined
    return {
      displayName: user.displayName,
      avatarUrl: absoluteAvatarUrl(user.avatarUrl, instanceUrl),
    }
  }
  catch {
    return undefined
  }
}

function getEnvCreatorOverride(): { displayName?: string, avatarUrl?: string } {
  const displayName = getMemosCreatorName()
  const avatarUrl = getMemosCreatorAvatar()
  if (!displayName && !avatarUrl)
    return {}
  return { displayName, avatarUrl }
}

export async function enrichCreators(memos: Memo[], instanceUrl: string): Promise<void> {
  const usernames = new Set<string>()
  for (const memo of memos) {
    usernames.add(memo.creator.username)
  }

  const userMap = new Map<string, { displayName?: string, avatarUrl?: string }>()
  await Promise.all(
    Array.from(usernames).map(async (username) => {
      const user = await fetchUser(username, instanceUrl)
      if (user)
        userMap.set(username, user)
    }),
  )

  const envOverride = getEnvCreatorOverride()

  for (const memo of memos) {
    const user = userMap.get(memo.creator.username)
    if (user) {
      memo.creator.displayName = memo.creator.displayName || user.displayName
      memo.creator.avatarUrl = memo.creator.avatarUrl || user.avatarUrl
    }

    // 环境变量优先级最高，允许覆盖单个或多个创作者
    if (envOverride.displayName)
      memo.creator.displayName = envOverride.displayName
    if (envOverride.avatarUrl)
      memo.creator.avatarUrl = envOverride.avatarUrl
  }
}
