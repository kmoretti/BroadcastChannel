import type { NavItem } from '../types'

type Env = Record<string, string | undefined>

export const DEFAULT_TELEGRAM_HOST = 'telegram.me'

function getProcessEnv(name: string): string | undefined {
  return (Reflect.get(globalThis, 'process') as { env?: Env } | undefined)?.env?.[name]
}

/**
 * Runtime envs must win over Vite's build-time import.meta.env values.
 */
export function getEnv(env: Env | undefined, name: string): string | undefined {
  return getProcessEnv(name) ?? env?.[name]
}

export function getStaticProxy(env: Env): string {
  return getEnv(env, 'STATIC_PROXY') ?? '/static/'
}

export function getTelegramHost(env: Env): string {
  return getEnv(env, 'TELEGRAM_HOST') ?? DEFAULT_TELEGRAM_HOST
}

export function getTargetWhitelist(env: Env | undefined): string[] {
  const hostnames = parseCsvList(getEnv(env, 'TARGET_WHITELIST'))
    .map(hostname => hostname.toLowerCase())
    .filter(isValidHostname)

  return [...new Set(hostnames)]
}

export function getBooleanEnv(env: Env, name: string): boolean | undefined {
  const value = getEnv(env, name)
  return value === undefined ? undefined : value === 'true' || value === '1'
}

export function parseDelimitedItems(value = ''): NavItem[] {
  return value
    .split(';')
    .map(item => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [title = '', href = ''] = item.split(',').map(part => part.trim())
      return { title, href }
    })
    .filter(item => item.title.length > 0 && item.href.length > 0)
}

export function parseCsvList(value = ''): string[] {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function isValidHostname(hostname: string): boolean {
  if (hostname.length > 253 || !hostname.includes('.'))
    return false

  const labels = hostname.split('.')
  if (labels.every(label => /^\d+$/.test(label)))
    return false

  return labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
}

function getRuntimeEnv(): Record<string, string | undefined> {
  return (Reflect.get(globalThis, 'process') as { env?: Record<string, string | undefined> } | undefined)?.env ?? {}
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
