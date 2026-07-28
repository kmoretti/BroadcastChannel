import { describe, expect, it } from 'vitest'
import vercelConfig from './vercel.json'

describe('vercel rewrites', () => {
  it('has no rewrites after static proxy removal', () => {
    expect(vercelConfig.rewrites).toEqual([])
  })
})
