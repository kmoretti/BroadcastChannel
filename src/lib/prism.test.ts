import { describe, expect, it } from 'vitest'
import prism, { highlightCode } from './prism'

describe('prism syntax highlighter', () => {
  it('loads supported grammars eagerly', () => {
    expect(prism.languages.python).toBeTruthy()
  })

  it('highlights code with a known language', () => {
    const html = highlightCode('def hello():\n    pass', 'python')
    expect(html).toContain('<span')
  })

  it('falls back to plain text for unknown languages', () => {
    const html = highlightCode('some code', 'unknown-language')
    expect(html).toBe('some code')
  })

  it('detects language when lang is text', () => {
    const html = highlightCode('print("hello")', 'text')
    expect(html).toContain('<span')
  })
})
