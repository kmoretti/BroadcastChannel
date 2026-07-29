interface ApplyFormData {
  name: string
  link: string
  description: string
  avatar: string
  snapshot: string
  email: string
  friend_link_page: string
  feed: string
  enable_rss: boolean
}

interface UpdateFormData extends ApplyFormData {
  original_url: string
}

interface Submission {
  id: number
  name: string
  description?: string
  status: string
  updated_at: number
}

interface SubmissionsResponse {
  submissions: Submission[]
  total: number
  page: number
  page_size: number
}

interface VerifyConfig {
  turnstile: {
    enable: boolean
    site_key?: string
  }
}

interface Turnstile {
  render: (container: string | HTMLElement, options: TurnstileRenderOptions) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

interface TurnstileRenderOptions {
  'sitekey': string
  'theme'?: 'light' | 'dark'
  'callback'?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: '未审批',
  survival: '已通过',
  rejected: '已拒绝',
  timeout: '超时',
  error: '错误',
}

const PAGE_SIZE = 12

function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}

function showToast(container: HTMLElement, message: string, type: 'success' | 'error' = 'success') {
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  container.appendChild(toast)
  requestAnimationFrame(() => toast.classList.add('show'))
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

function normalizeURL(url: string) {
  return url.replace(/\/$/, '').trim()
}

function isValidEmail(email: string) {
  if (typeof document === 'undefined')
    return false
  const input = document.createElement('input')
  input.type = 'email'
  input.value = email
  return input.checkValidity()
}

function validateApplyForm(data: ApplyFormData): string | null {
  if (!data.name.trim())
    return '请输入站点名称'
  const link = normalizeURL(data.link)
  if (!link)
    return '请输入站点地址'
  if (!/^https?:\/\//i.test(link))
    return '站点地址必须以 http:// 或 https:// 开头'
  if (!data.avatar.trim())
    return '请输入头像地址'
  if (data.email && !isValidEmail(data.email))
    return '请输入有效的邮箱地址'
  return null
}

function validateUpdateForm(data: UpdateFormData): string | null {
  const original = normalizeURL(data.original_url)
  if (!original)
    return '请输入原站点地址'
  if (!/^https?:\/\//i.test(original))
    return '原站点地址必须以 http:// 或 https:// 开头'
  return validateApplyForm(data)
}

function setSubmitting(btn: HTMLButtonElement, submitting: boolean, text: string) {
  btn.disabled = submitting
  btn.textContent = submitting ? '提交中...' : text
}

function collectFormData(form: HTMLFormElement): ApplyFormData | UpdateFormData {
  const formData = new FormData(form)
  const base: ApplyFormData = {
    name: String(formData.get('name') ?? '').trim(),
    link: String(formData.get('link') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    avatar: String(formData.get('avatar') ?? '').trim(),
    snapshot: String(formData.get('snapshot') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim(),
    friend_link_page: String(formData.get('friend_link_page') ?? '').trim(),
    feed: String(formData.get('feed') ?? '').trim(),
    enable_rss: formData.get('enable_rss') === 'on',
  }
  const originalUrl = String(formData.get('original_url') ?? '').trim()
  if (originalUrl) {
    return {
      ...base,
      original_url: originalUrl,
    }
  }
  return base
}

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  })

  let payload: { code?: number, message?: string, data?: T } | null = null
  try {
    payload = await res.json()
  }
  catch {
    payload = null
  }

  if (!res.ok || (payload?.code && payload.code >= 400)) {
    throw new Error(payload?.message || `请求失败 (${res.status})`)
  }

  return (payload?.data ?? payload) as T
}

class TurnstileManager {
  private siteKey: string | null = null
  private widgets: Record<string, string | null> = { apply: null, update: null }
  private tokens: Record<string, string | undefined> = { apply: undefined, update: undefined }
  private scriptLoaded = false
  private scriptPromise: Promise<void> | null = null

  configure(siteKey: string | undefined) {
    this.siteKey = siteKey || null
  }

  private loadScript(): Promise<void> {
    if (this.scriptLoaded)
      return Promise.resolve()
    if (this.scriptPromise)
      return this.scriptPromise

    this.scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-turnstile]') as HTMLScriptElement | null
      if (existing) {
        existing.addEventListener('load', () => resolve())
        existing.addEventListener('error', () => reject(new Error('Turnstile 脚本加载失败')))
        return
      }

      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.turnstile = 'true'
      script.addEventListener('load', () => resolve())
      script.addEventListener('error', () => reject(new Error('Turnstile 脚本加载失败')))
      document.head.appendChild(script)
    }).then(() => {
      this.scriptLoaded = true
    })

    return this.scriptPromise
  }

  async render(container: HTMLElement, key: 'apply' | 'update') {
    if (!this.siteKey || !container)
      return
    await this.loadScript()
    if (!window.turnstile)
      return

    this.remove(key)
    const theme = isDarkMode() ? 'dark' : 'light'
    this.tokens[key] = undefined
    this.widgets[key] = window.turnstile.render(container, {
      'sitekey': this.siteKey,
      theme,
      'callback': (token) => {
        this.tokens[key] = token
      },
      'expired-callback': () => {
        this.tokens[key] = undefined
      },
      'error-callback': () => {
        this.tokens[key] = undefined
      },
    })
  }

  getToken(key: 'apply' | 'update'): string | undefined {
    return this.tokens[key]
  }

  remove(key: 'apply' | 'update') {
    const widgetId = this.widgets[key]
    if (widgetId && window.turnstile) {
      window.turnstile.remove(widgetId)
      this.widgets[key] = null
      this.tokens[key] = undefined
    }
  }

  reset(key: 'apply' | 'update') {
    this.tokens[key] = undefined
    const widgetId = this.widgets[key]
    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId)
    }
  }

  removeAll() {
    (Object.keys(this.widgets) as Array<'apply' | 'update'>).forEach(key => this.remove(key))
  }
}

class FriendApplyController {
  private section: HTMLElement
  private apiUrl: string
  private submitUrl: string
  private turnstile = new TurnstileManager()

  private conditions: HTMLInputElement[]
  private conditionHint: HTMLElement
  private applyCard: HTMLElement
  private successCard: HTMLElement
  private successMessage: HTMLElement
  private continueBtn: HTMLButtonElement
  private modeButtons: HTMLButtonElement[]
  private applyForm: HTMLFormElement
  private updateForm: HTMLFormElement
  private toastContainer: HTMLElement
  private loading: HTMLElement
  private errorEl: HTMLElement
  private emptyEl: HTMLElement
  private grid: HTMLElement
  private pagination: HTMLElement
  private prevBtn: HTMLButtonElement
  private nextBtn: HTMLButtonElement
  private pageInfo: HTMLElement
  private statusFilter: HTMLSelectElement
  private searchInput: HTMLInputElement
  private countLabel: HTMLElement

  private mode: 'apply' | 'update' = 'apply'
  private status = ''
  private search = ''
  private page = 1
  private total = 0

  constructor(section: HTMLElement) {
    this.section = section
    this.apiUrl = section.dataset.apiUrl || ''
    this.submitUrl = section.dataset.submitUrl || ''

    this.conditions = Array.from(section.querySelectorAll('[data-condition]'))
    this.conditionHint = section.querySelector('[data-condition-hint]') as HTMLElement
    this.applyCard = section.querySelector('[data-apply-card]') as HTMLElement
    this.successCard = section.querySelector('[data-success-card]') as HTMLElement
    this.successMessage = section.querySelector('[data-success-message]') as HTMLElement
    this.continueBtn = section.querySelector('[data-continue-btn]') as HTMLButtonElement
    this.modeButtons = Array.from(section.querySelectorAll('[data-mode]'))
    this.applyForm = section.querySelector('[data-form="apply"]') as HTMLFormElement
    this.updateForm = section.querySelector('[data-form="update"]') as HTMLFormElement
    this.toastContainer = document.querySelector('[data-toast-container]') as HTMLElement
    this.loading = section.querySelector('[data-submissions-loading]') as HTMLElement
    this.errorEl = section.querySelector('[data-submissions-error]') as HTMLElement
    this.emptyEl = section.querySelector('[data-submissions-empty]') as HTMLElement
    this.grid = section.querySelector('[data-submissions-grid]') as HTMLElement
    this.pagination = section.querySelector('[data-submissions-pagination]') as HTMLElement
    this.prevBtn = section.querySelector('[data-page-prev]') as HTMLButtonElement
    this.nextBtn = section.querySelector('[data-page-next]') as HTMLButtonElement
    this.pageInfo = section.querySelector('[data-page-info]') as HTMLElement
    this.statusFilter = section.querySelector('[data-status-filter]') as HTMLSelectElement
    this.searchInput = section.querySelector('[data-search-input]') as HTMLInputElement
    this.countLabel = section.querySelector('[data-submissions-count]') as HTMLElement
  }

  async init() {
    this.bindConditions()
    this.bindModes()
    this.bindForms()
    this.bindSubmissions()
    this.bindContinue()
    this.bindThemeChange()

    await this.loadVerifyConfig()
    await this.loadSubmissions()
    this.updateConditionUI()
  }

  private bindConditions() {
    this.conditions.forEach((checkbox) => {
      checkbox.addEventListener('change', () => this.updateConditionUI())
    })
  }

  private updateConditionUI() {
    const allChecked = this.conditions.every(c => c.checked)
    this.conditionHint.hidden = allChecked
    this.applyCard.hidden = !allChecked
    this.successCard.hidden = true

    if (allChecked) {
      this.renderTurnstileForCurrentMode()
    }
    else {
      this.turnstile.removeAll()
    }
  }

  private bindModes() {
    this.modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode as 'apply' | 'update'
        this.setMode(mode)
      })
    })
  }

  private setMode(mode: 'apply' | 'update') {
    this.mode = mode
    this.modeButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode)
    })
    this.applyForm.hidden = mode !== 'apply'
    this.updateForm.hidden = mode !== 'update'
    this.clearFormError(this.applyForm)
    this.clearFormError(this.updateForm)
    this.renderTurnstileForCurrentMode()
  }

  private renderTurnstileForCurrentMode() {
    const container = this.mode === 'apply'
      ? this.section.querySelector('[data-turnstile-apply]') as HTMLElement
      : this.section.querySelector('[data-turnstile-update]') as HTMLElement
    if (container) {
      void this.turnstile.render(container, this.mode)
    }
  }

  private bindForms() {
    this.applyForm.addEventListener('submit', e => this.handleSubmit(e, 'apply'))
    this.updateForm.addEventListener('submit', e => this.handleSubmit(e, 'update'))
  }

  private async handleSubmit(e: Event, mode: 'apply' | 'update') {
    e.preventDefault()
    const form = mode === 'apply' ? this.applyForm : this.updateForm
    const btn = form.querySelector('[data-submit-btn]') as HTMLButtonElement
    const errorEl = form.querySelector('[data-form-error]') as HTMLElement
    const turnstileKey = mode

    this.clearFormError(form)

    const data = collectFormData(form)
    const validationError = mode === 'apply'
      ? validateApplyForm(data as ApplyFormData)
      : validateUpdateForm(data as UpdateFormData)
    if (validationError) {
      errorEl.textContent = validationError
      return
    }

    setSubmitting(btn, true, mode === 'apply' ? '提交申请' : '提交更新')
    try {
      const token = this.turnstile.getToken(turnstileKey)
      const payload = { ...data, turnstile_token: token }
      const url = mode === 'apply' ? this.submitUrl : this.submitUrl.replace(/\/apply$/, '/update-apply')
      const result = await apiRequest<{ id: number, status: string, message: string }>(url, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      showToast(this.toastContainer, result.message || '提交成功', 'success')
      this.showSuccess(result.message || '提交成功')
      form.reset()
      this.turnstile.reset(turnstileKey)
      void this.loadSubmissions()
    }
    catch (err) {
      const message = err instanceof Error ? err.message : '提交失败'
      showToast(this.toastContainer, message, 'error')
      this.turnstile.reset(turnstileKey)
    }
    finally {
      setSubmitting(btn, false, mode === 'apply' ? '提交申请' : '提交更新')
    }
  }

  private clearFormError(form: HTMLFormElement) {
    const errorEl = form.querySelector('[data-form-error]') as HTMLElement
    errorEl.textContent = ''
  }

  private showSuccess(message: string) {
    this.applyCard.hidden = true
    this.successCard.hidden = false
    this.successMessage.textContent = message
  }

  private bindContinue() {
    this.continueBtn.addEventListener('click', () => {
      this.successCard.hidden = true
      this.applyCard.hidden = false
      this.setMode('apply')
      this.applyForm.reset()
    })
  }

  private bindSubmissions() {
    this.statusFilter.addEventListener('change', () => {
      this.status = this.statusFilter.value
      this.page = 1
      void this.loadSubmissions()
    })

    let debounceTimer: ReturnType<typeof setTimeout>
    this.searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        this.search = this.searchInput.value.trim()
        this.page = 1
        void this.loadSubmissions()
      }, 300)
    })

    this.prevBtn.addEventListener('click', () => {
      if (this.page > 1) {
        this.page--
        void this.loadSubmissions()
      }
    })

    this.nextBtn.addEventListener('click', () => {
      if (this.page * PAGE_SIZE < this.total) {
        this.page++
        void this.loadSubmissions()
      }
    })
  }

  private async loadSubmissions() {
    this.loading.hidden = false
    this.errorEl.hidden = true
    this.emptyEl.hidden = true
    this.grid.innerHTML = ''
    this.pagination.hidden = true

    const params = new URLSearchParams({ page: String(this.page), page_size: String(PAGE_SIZE) })
    if (this.status)
      params.set('status', this.status)
    if (this.search)
      params.set('search', this.search)

    try {
      const result = await apiRequest<SubmissionsResponse>(`${this.apiUrl}/api/public/friend/submissions?${params.toString()}`)
      this.total = result.total
      this.renderSubmissions(result.submissions, result.total)
    }
    catch (err) {
      this.loading.hidden = true
      this.errorEl.hidden = false
      this.errorEl.textContent = err instanceof Error ? err.message : '加载失败'
    }
  }

  private renderSubmissions(items: Submission[], total: number) {
    this.loading.hidden = true
    this.countLabel.textContent = total > 0 ? `(${total})` : ''

    if (items.length === 0) {
      this.emptyEl.hidden = false
      this.pagination.hidden = true
      return
    }

    const fragment = document.createDocumentFragment()
    items.forEach((item) => {
      const el = document.createElement('div')
      el.className = 'submission-item'
      const statusClass = item.status
      const label = STATUS_LABELS[item.status] || item.status
      el.innerHTML = `
        <div class="submission-top">
          <span class="submission-name" title="${this.escapeHtml(item.name)}">${this.escapeHtml(item.name)}</span>
          <span class="submission-badge ${statusClass}">${label}</span>
        </div>
        <p class="submission-desc" title="${this.escapeHtml(item.description || '')}">${this.escapeHtml(item.description || '暂无描述')}</p>
      `
      fragment.appendChild(el)
    })
    this.grid.appendChild(fragment)

    const totalPages = Math.ceil(total / PAGE_SIZE)
    this.pagination.hidden = totalPages <= 1
    this.pageInfo.textContent = `${this.page} / ${totalPages}`
    this.prevBtn.disabled = this.page <= 1
    this.nextBtn.disabled = this.page >= totalPages
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  private themeObserver: MutationObserver | null = null

  private bindThemeChange() {
    this.themeObserver = new MutationObserver(() => {
      if (this.conditions.every(c => c.checked)) {
        this.renderTurnstileForCurrentMode()
      }
    })
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  }

  destroy() {
    this.turnstile.removeAll()
    this.themeObserver?.disconnect()
  }

  private async loadVerifyConfig() {
    try {
      const config = await apiRequest<VerifyConfig>(`${this.apiUrl}/api/public/verify_conf`)
      if (config.turnstile?.enable && config.turnstile.site_key) {
        this.turnstile.configure(config.turnstile.site_key)
      }
    }
    catch {
      // 验证配置可选，失败不影响主流程
    }
  }
}

const controllers = new WeakMap<HTMLElement, FriendApplyController>()

export function initFriendApplyForm() {
  const section = document.querySelector('[data-api-url]') as HTMLElement | null
  if (!section)
    return

  const existing = controllers.get(section)
  if (existing)
    existing.destroy()

  const controller = new FriendApplyController(section)
  controllers.set(section, controller)
  void controller.init()
}
