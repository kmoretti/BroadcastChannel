type Env = Record<string, string | undefined>

function getProcessEnv(name: string): string | undefined {
  return (Reflect.get(globalThis, 'process') as { env?: Env } | undefined)?.env?.[name]
}

/**
 * Runtime envs must win over Vite's build-time import.meta.env values.
 */
export function getEnv(env: Env | undefined, name: string): string | undefined {
  return getProcessEnv(name) ?? env?.[name] ?? getViteEnv()?.[name]
}

function getRuntimeEnv(): Record<string, string | undefined> {
  return (Reflect.get(globalThis, 'process') as { env?: Record<string, string | undefined> } | undefined)?.env ?? {}
}

function getViteEnv(): Env | undefined {
  try {
    return (import.meta as { env?: Env }).env
  }
  catch {
    return undefined
  }
}

export function getMemosApiUrl(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string {
  return getEnv(env, 'MEMOS_API_URL') || 'https://mm.2005815.xyz/api/v1'
}

export function getMemosCreators(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string[] {
  const value = getEnv(env, 'MEMOS_CREATORS')
  return value
    ? value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : []
}

export function getMemosPageSize(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): number {
  const value = Number.parseInt(getEnv(env, 'MEMOS_PAGE_SIZE') || '20', 10)
  return Number.isNaN(value) || value < 1 ? 20 : value
}

export function getMemosTitle(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, 'MEMOS_TITLE')
}

export function getMemosDescription(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, 'MEMOS_DESCRIPTION')
}

export function getMemosAvatar(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, 'MEMOS_AVATAR')
}

export function getMemosLogo(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, 'MEMOS_LOGO')
}

export function getMemosCreatorName(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, 'MEMOS_CREATOR_NAME')
}

export function getMemosCreatorAvatar(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, 'MEMOS_CREATOR_AVATAR')
}

export function getFriendLinkApiUrl(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string {
  return getEnv(env, 'FRIEND_LINK_API_URL') || 'https://blog-api.2005815.xyz/'
}

export function getFriendLinkApplyUrl(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, 'FRIEND_LINK_APPLY_URL')
}

export function getSocialRssUrl(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, 'SOCIAL_RSS_URL') || '/rss.xml'
}

export function getSocialXUrl(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, 'SOCIAL_X_URL')
}

export function getSocialGithubUrl(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, 'SOCIAL_GITHUB_URL')
}

export function getSocialTelegramUrl(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, 'SOCIAL_TELEGRAM_URL')
}

export function getSocialQqUrl(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, 'SOCIAL_QQ_URL')
}

export function getSocialEmailUrl(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, 'SOCIAL_EMAIL_URL')
}

export function getSocialBilibiliUrl(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, 'SOCIAL_BILIBILI_URL')
}

export function getBlogUrl(
  env: Record<string, string | undefined> = getRuntimeEnv(),
): string | undefined {
  return getEnv(env, 'BLOG_URL')
}
