import { describe, expect, it, vi } from 'vitest'

vi.mock('astro:middleware', () => ({
  defineMiddleware: <T>(handler: T): T => handler,
}))

const { onRequest } = await import('./middleware')

function createContext(request?: Request) {
  const req = request || new Request('https://example.com/')
  return {
    request: req,
    url: new URL(req.url),
    redirect: vi.fn((path: string, status: number) => new Response('', { status, headers: { Location: path } })),
  } as unknown as Parameters<typeof onRequest>[0]
}

describe('middleware', () => {
  it('redirects legacy hashtag search paths', async () => {
    const context = createContext(new Request('https://example.com/search/%23astro'))
    const next = vi.fn(async () => new Response('', { headers: { 'content-type': 'text/html; charset=utf-8' } }))

    await onRequest(context, next)

    expect(context.redirect).toHaveBeenCalledWith('/search/result?q=%23astro', 301)
  })

  it('adds speculation rules and cache headers to html responses', async () => {
    const context = createContext()
    const next = vi.fn(async () => new Response('', { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }))

    const response = await onRequest(context, next)

    expect(response).toBeInstanceOf(Response)
    expect((response as Response).headers.get('Speculation-Rules')).toBe('/rules/prefetch.json')
    expect((response as Response).headers.get('Cache-Control')).toBe('public, max-age=300, s-maxage=300')
  })

  it('does not add headers to non-html responses', async () => {
    const context = createContext()
    const next = vi.fn(async () => new Response('', { status: 200, headers: { 'content-type': 'application/json' } }))

    const response = await onRequest(context, next)

    expect(response).toBeInstanceOf(Response)
    expect((response as Response).headers.has('Speculation-Rules')).toBe(false)
    expect((response as Response).headers.has('Cache-Control')).toBe(false)
  })
})
