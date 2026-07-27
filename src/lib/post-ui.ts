const weekInMs = 7 * 24 * 60 * 60 * 1000

function resolveLocale(locale = 'en'): string {
  try {
    return Intl.DateTimeFormat.supportedLocalesOf(locale)[0] ?? 'en'
  }
  catch {
    return 'en'
  }
}

function roundRelativeTime(diffInMs: number, unitInMs: number): number {
  return Math.sign(diffInMs) * Math.round(Math.abs(diffInMs) / unitInMs)
}

function formatRelativeTimeWithLocale(date: Date, locale: string): string {
  const diffInMs = date.getTime() - Date.now()
  const absoluteDiffInMs = Math.abs(diffInMs)
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'always' })

  if (absoluteDiffInMs < 60 * 1000) {
    return formatter.format(roundRelativeTime(diffInMs, 1000), 'second')
  }

  if (absoluteDiffInMs < 60 * 60 * 1000) {
    return formatter.format(roundRelativeTime(diffInMs, 60 * 1000), 'minute')
  }

  if (absoluteDiffInMs < 24 * 60 * 60 * 1000) {
    return formatter.format(roundRelativeTime(diffInMs, 60 * 60 * 1000), 'hour')
  }

  return formatter.format(roundRelativeTime(diffInMs, 24 * 60 * 60 * 1000), 'day')
}

function formatAbsoluteTime(date: Date, timezone: string | undefined, locale: string): string {
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    timeZone: timezone,
  }).format(date)
  const dateText = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: timezone,
  }).format(date)
  const weekday = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    weekday: 'short',
  }).format(date)

  return `${time} · ${dateText} · ${weekday}`
}

export function formatPostTime(datetime: string, timezone?: string, locale?: string): string {
  const resolvedLocale = resolveLocale(locale)
  const postTime = new Date(datetime)
  const isOlderThanWeek = postTime.getTime() < Date.now() - weekInMs

  return isOlderThanWeek
    ? formatAbsoluteTime(postTime, timezone, resolvedLocale)
    : formatRelativeTimeWithLocale(postTime, resolvedLocale)
}

export function getTagHref(tag: string): string {
  return `/search/result?q=${encodeURIComponent(`#${tag}`)}`
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60)
    return '刚刚'
  if (minutes < 60)
    return `${minutes}分钟前`
  if (hours < 24)
    return `${hours}小时前`
  if (days < 30)
    return `${days}天前`
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
