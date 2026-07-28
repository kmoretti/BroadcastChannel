/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    SITE_URL: string
    RSS_URL: string
    RSS_PREFIX: string
  }
}

declare module 'sanitize-html' {
  export interface SanitizeHtmlFrame {
    tag: string
    attribs: Record<string, string>
  }

  export interface SanitizeHtmlOptions {
    allowedTags?: string[]
    allowedAttributes?: Record<string, string[]>
    allowedClasses?: Record<string, string[]>
    exclusiveFilter?: (frame: SanitizeHtmlFrame) => boolean
  }

  interface SanitizeHtml {
    (dirty: string, options?: SanitizeHtmlOptions): string
    defaults: {
      allowedTags: string[]
      allowedAttributes: Record<string, string[]>
    }
  }

  const sanitizeHtml: SanitizeHtml

  export default sanitizeHtml
}

// prismjs/components/*.js files are side-effect-only and have no type declarations.
declare module 'prismjs/components/prism-*.js' {}
