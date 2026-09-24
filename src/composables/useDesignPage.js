import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { setLocale as saveLocale } from '../i18n/index.js'
import { siteKeyByEnglish } from '../i18n/site.js'

const navigationItems = [
  { label: 'Solutions', path: '/solutions' },
  { label: 'Industries', path: '/#industries' },
  { label: 'Capabilities', path: '/#capabilities' },
  { label: 'Projects', path: '/#projects' },
  { label: 'About TZME', path: '/about' },
  { label: 'Insights', path: '/insights' },
  { label: 'Contact', path: '/contact' },
]

const routeByLabel = Object.fromEntries(navigationItems.map(({ label, path }) => [label, path]))

export function useDesignPage(pageKey, page) {
  const router = useRouter()
  const { t, locale } = useI18n({ useScope: 'global' })
  const drawerOpen = ref(false)
  const menuItems = computed(() => navigationItems.map(({ label, path }) => ({
    label: siteKeyByEnglish.has(label) ? t(`site.${siteKeyByEnglish.get(label)}`) : label,
    path,
  })))
  const originalNodes = []
  const originalAttributes = []
  let managedProducts = []
  let managedArticles = []
  const productSlots = pageKey === 'hc-home'
    ? ['material-handling', 'mining-equipment', 'port-machinery', 'metallurgy', 'bridge-equipment']
    : ['mining-equipment', 'material-handling', 'conveying', 'port-machinery', 'bridge-equipment', 'metallurgy', 'environmental', 'tourism']
  const message = (english, chinese) => locale.value === 'zh' ? chinese : english

  function contentField(item, name) {
    return locale.value === 'zh'
      ? (item[`${name}Zh`] || item[`${name}En`] || item[name] || '')
      : (item[`${name}En`] || item[name] || '')
  }

  function setText(element, value) {
    if (!element || !value) return
    if (element.childNodes.length === 1 && element.firstChild.nodeType === Node.TEXT_NODE) {
      element.firstChild.nodeValue = value
    } else {
      element.textContent = value
    }
  }

  function applyManagedContent() {
    const root = page.value
    if (!root) return
    if (pageKey === 'hc-home' || pageKey === 'hc-products') {
      const cards = [...root.querySelectorAll('.hc-cards .hc-card')].filter((card) => !card.classList.contains('managed-extra'))
      const byId = new Map(managedProducts.map((item) => [item.id, item]))
      cards.slice(0, productSlots.length).forEach((card, index) => {
        const item = byId.get(productSlots[index])
        if (!item) return
        card.style.display = item.status === 'draft' ? 'none' : ''
        if (item.status === 'draft') return
        setText(card.querySelector('h3'), contentField(item, 'title'))
        setText(card.querySelector('p'), contentField(item, 'summary'))
        if (item.image) card.querySelector('img')?.setAttribute('src', item.image)
      })
      if (pageKey === 'hc-products') {
        root.querySelectorAll('.managed-extra').forEach((card) => card.remove())
        const grid = cards[0]?.parentElement
        for (const item of managedProducts.filter((product) => !productSlots.includes(product.id) && product.status === 'published')) {
          const card = document.createElement('a')
          card.className = 'hc-card managed-extra'
          card.tabIndex = 0
          card.setAttribute('role', 'link')
          card.dataset.action = 'catalog item'
          const imageWrap = document.createElement('div')
          imageWrap.className = 'im'
          const image = document.createElement('img')
          image.alt = ''
          image.src = item.image || '/assets/p-other-1.jpg'
          imageWrap.append(image)
          const body = document.createElement('div')
          body.className = 'bd'
          const title = document.createElement('h3')
          title.textContent = contentField(item, 'title')
          const summary = document.createElement('p')
          summary.textContent = contentField(item, 'summary')
          const arrow = document.createElement('span')
          arrow.className = 'go'
          arrow.textContent = message('Explore →', '了解更多 →')
          body.append(title, summary, arrow)
          card.append(imageWrap, body)
          grid?.append(card)
        }
      }
    }
    if (pageKey === 'hc-news' && managedArticles.length) {
      const articles = managedArticles.filter((item) => item.status === 'published')
      const rows = [...root.querySelectorAll('a[style*="grid-template-columns:150px"]')]
      rows.forEach((row, index) => {
        const item = articles[index]
        if (!item) return
        row.dataset.articleId = item.id
        setText(row.children[0], item.date?.replaceAll('-', '.') || '')
        setText(row.children[1], contentField(item, 'title'))
        setText(row.children[2], contentField(item, 'category'))
      })
      const featured = root.querySelector('section .hc-w>div[style*="grid-template-columns:1fr 1fr"]')
      const first = articles[0]
      if (featured && first) {
        featured.dataset.articleId = first.id
        setText(featured.querySelector('h3'), contentField(first, 'title'))
        setText(featured.querySelector('p'), contentField(first, 'summary'))
        setText(featured.querySelector('.hc-tag'), contentField(first, 'category'))
        if (first.image) featured.querySelector('img')?.setAttribute('src', first.image)
      }
    }
  }

  async function loadManagedContent() {
    const type = pageKey === 'hc-news' ? 'articles' : 'products'
    if (!['hc-home', 'hc-products', 'hc-news'].includes(pageKey)) return
    let records = []
    try {
      const response = await fetch(`/api/${type}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      records = await response.json()
    } catch { /* The page can show the reference copy while the API is offline. */ }
    try {
      const edits = JSON.parse(localStorage.getItem('tzme-content-edits'))?.[type] || {}
      const local = JSON.parse(localStorage.getItem(`tzme-${type}`)) || []
      const byId = new Map(records.map((item) => [item.id, item]))
      for (const item of local) {
        if (edits[item.id] === 'save' || (!records.length && edits[item.id] === 'synced')) byId.set(item.id, item)
      }
      for (const [id, action] of Object.entries(edits)) if (action === 'delete') byId.delete(id)
      records = [...byId.values()]
    } catch { /* Keep the API records or the reference copy. */ }
    if (type === 'articles') managedArticles = records
    else managedProducts = records
    renderCopy()
  }

  function captureCopy(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const node = walker.currentNode
      const original = node.textContent
      const key = siteKeyByEnglish.get(original.replace(/\s+/g, ' ').trim())
      if (key) originalNodes.push({ node, original, key })
    }
    root.querySelectorAll('[placeholder],[aria-label]').forEach((element) => {
      for (const name of ['placeholder', 'aria-label']) {
        const original = element.getAttribute(name)
        const key = siteKeyByEnglish.get(original)
        if (key) originalAttributes.push({ element, name, original, key })
      }
    })
  }

  function renderCopy() {
    for (const { node, original, key } of originalNodes) {
      if (node.isConnected) {
        const leading = original.match(/^\s*/)?.[0] || ''
        const trailing = original.match(/\s*$/)?.[0] || ''
        node.textContent = locale.value === 'en' ? original : `${leading}${t(`site.${key}`)}${trailing}`
      }
    }
    for (const { element, name, original, key } of originalAttributes) {
      if (element.isConnected) element.setAttribute(name, locale.value === 'en' ? original : t(`site.${key}`))
    }
    applyManagedContent()
  }

  watch(locale, () => nextTick(renderCopy), { flush: 'post' })

  async function goTo(path) {
    drawerOpen.value = false
    const [pathname, hash] = path.split('#')
    await router.push({ path: pathname || '/', hash: hash ? `#${hash}` : '' })
    await nextTick()
    if (hash) {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }

  async function submitInquiry(form) {
    const values = {}
    const fieldNames = ['name', 'company', 'country', 'email', 'phone', 'industry', 'requirements']
    for (const [index, field] of [...form.querySelectorAll('.hc-f')].entries()) {
      const name = fieldNames[index]
      const input = field.querySelector('input,textarea')
      if (name && input) values[name] = input.value.trim()
    }
    const required = ['name', 'company', 'country', 'email', 'industry', 'requirements']
    const missing = required.find((name) => !values[name])
    if (missing) {
      ElMessage.warning(message(`Please enter ${missing === 'requirements' ? 'project requirements' : missing}.`, '请填写所有必填项。'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      ElMessage.warning(message('Please enter a valid email address.', '请输入有效的邮箱地址。'))
      return
    }
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      form.querySelectorAll('input,textarea').forEach((input) => {
        input.value = ''
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
      ElMessage.success(message('Your inquiry has been sent. We will contact you soon.', '咨询已发送，我们会尽快与您联系。'))
    } catch {
      ElMessage.error(message('Could not send your inquiry. Please email tzme@tzme.net.', '发送失败，请发邮件至 tzme@tzme.net。'))
    }
  }

  async function showNotice(target) {
    const articleId = target.closest('[data-article-id]')?.dataset.articleId
    const managed = managedArticles.find((item) => item.id === articleId)
    const item = target.closest('a') || target.closest('.hc-w')
    const title = (managed && contentField(managed, 'title')) || item?.querySelector('h3')?.textContent?.trim()
      || item?.querySelector('span[style*="font-size:15px"]')?.textContent?.trim()
      || message('News & insights', '新闻与洞察')
    const content = (managed && contentField(managed, 'content')) || (managed && contentField(managed, 'summary')) || item?.querySelector('p')?.textContent?.trim()
      || message('Please contact TZME for details about this notice.', '请联系 TZME 了解详情。')
    await ElMessageBox.alert(content, title, { confirmButtonText: message('Close', '关闭') })
  }

  function onClick(event) {
    const root = page.value
    const target = event.target instanceof Element ? event.target : null
    if (!root || !target) return
    const control = target.closest('.hc-logo,.hc-menu a,.hc-foot-nav a,.hc-btn,.hc-lnk,.hc-card,.hc-ico,.hc-upload,.hc-ind>div,.hc-soc>span,a[style*="grid-template-columns:150px"]')
    if (!control || !root.contains(control)) return
    event.preventDefault()

    if (control.matches('.hc-logo')) return goTo('/')
    if (control.matches('.hc-menu a,.hc-foot-nav a')) {
      return goTo(routeByLabel[control.dataset.action] || '/contact')
    }
    if (control.matches('.hc-ico')) return goTo('/solutions')
    if (control.matches('.hc-soc>span')) {
      ElMessage.info(message('Please contact us at tzme@tzme.net.', '请发邮件至 tzme@tzme.net 联系我们。'))
      return
    }
    if (control.matches('.hc-upload')) {
      ElMessage.info(message('Please email drawings and attachments to tzme@tzme.net.', '请将图纸和附件发送至 tzme@tzme.net。'))
      return
    }
    if (control.matches('.hc-ind>div')) return goTo('/solutions')

    const label = (control.dataset.action || control.textContent).replace(/→/g, '').trim().toLowerCase()
    if (label === 'send inquiry') return submitInquiry(control.closest('.hc-form'))
    if (pageKey === 'hc-news' && label !== 'subscribe to updates' && control.matches('.hc-lnk,a')) return showNotice(control)
    if (label.includes('all project')) return goTo('/#projects')
    if (label.includes('industr')) return goTo('/#industries')
    if (label.includes('contact') || label.includes('project') || label.includes('quote') || label.includes('certificate') || label.includes('factory visit') || label.includes('subscribe')) return goTo('/contact')
    if (label.includes('datasheet')) {
      ElMessage.info(message('Please request the datasheet at tzme@tzme.net.', '请发邮件至 tzme@tzme.net 索取技术资料。'))
      return
    }
    if (label.includes('facility') || label.includes('global reach')) return goTo('/about')
    if (label.includes('solution') || label.includes('product list') || label.includes('port equipment')) return goTo('/solutions')
    if (control.matches('.hc-card')) {
      if (pageKey === 'hc-home') return goTo('/solutions')
      return goTo('/solutions/ports/ship-loader')
    }
  }

  function onKeydown(event) {
    if (!['Enter', ' '].includes(event.key)) return
    if (event.target.matches('.hc-logo,.hc-menu a,.hc-foot-nav a,.hc-lnk,.hc-card,.hc-ico,.hc-upload,.hc-ind>div,.hc-soc>span,a[style*="grid-template-columns:150px"]')) onClick(event)
  }

  onMounted(() => {
    const root = page.value
    root?.querySelectorAll('.hc-menu a,.hc-foot-nav a,.hc-btn,.hc-lnk,.hc-card').forEach((control) => {
      control.dataset.action = control.textContent.replace(/→/g, '').trim()
    })
    if (root) {
      captureCopy(root)
      renderCopy()
      loadManagedContent()
    }
    root?.addEventListener('click', onClick)
    root?.addEventListener('keydown', onKeydown)
    root?.querySelectorAll('.hc-logo,.hc-menu a,.hc-foot-nav a,.hc-lnk,.hc-card,.hc-ico,.hc-upload,.hc-ind>div,.hc-soc>span,a[style*="grid-template-columns:150px"]').forEach((control) => {
      control.tabIndex = 0
      control.setAttribute('role', 'link')
    })
  })
  onUnmounted(() => {
    page.value?.removeEventListener('click', onClick)
    page.value?.removeEventListener('keydown', onKeydown)
  })

  return { drawerOpen, goTo, menuItems, locale, setLocale: saveLocale }
}
