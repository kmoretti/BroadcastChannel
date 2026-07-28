import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url)

  context.locals.SITE_URL = `${url.protocol}//${url.host}`
  context.locals.RSS_URL = '/rss.xml'
  context.locals.RSS_PREFIX = ''

  if (url.pathname.startsWith('/search/%23')) {
    const tag = decodeURIComponent(url.pathname.replace('/search/%23', ''))
    return context.redirect(`/search/result?q=%23${encodeURIComponent(tag)}`, 301)
  }

  const response = await next()

  if (response.status >= 200 && response.status < 400) {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/html')) {
      response.headers.set('Speculation-Rules', '"/rules/prefetch.json"')
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300')
    }
  }

  return response
})
