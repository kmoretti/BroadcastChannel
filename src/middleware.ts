import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next()
  const url = new URL(context.request.url)

  if (url.pathname.startsWith('/search/%23')) {
    const tag = decodeURIComponent(url.pathname.replace('/search/%23', ''))
    return context.redirect(`/search/result?q=%23${encodeURIComponent(tag)}`, 301)
  }

  if (response.status >= 200 && response.status < 400) {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/html')) {
      response.headers.set('Speculation-Rules', '/rules/prefetch.json')
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300')
    }
  }

  return response
})
