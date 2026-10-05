import DOMPurify from 'dompurify'

const escapeText = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
const allowedStyles = new Set(['color', 'background-color', 'font-size', 'font-family', 'font-weight',
  'font-style', 'text-decoration', 'text-align', 'line-height', 'text-indent', 'margin-left',
  'padding-left', 'width', 'height', 'max-width', 'vertical-align', 'border', 'border-collapse'])

// Older news records contain plain text. Keep their paragraph breaks when opening the editor.
export function sanitizeRichText(value) {
  const source = String(value || '')
  if (!source.trim()) return ''
  const html = /<\/?[a-z][^>]*>/i.test(source) ? source
    : source.split(/\r?\n\s*\r?\n/).map((paragraph) => `<p>${escapeText(paragraph).replaceAll('\n', '<br>')}</p>`).join('')
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'iframe', 'video', 'audio', 'form', 'input', 'button'],
    FORBID_ATTR: ['id', 'class'],
    ADD_ATTR: ['target', 'data-w-e-type', 'data-w-e-is-void', 'data-w-e-is-inline', 'data-language', 'data-indent'],
  })
  const template = document.createElement('template')
  template.innerHTML = clean
  template.content.querySelectorAll('[style]').forEach((element) => {
    const safe = []
    for (const property of Array.from(element.style)) {
      const content = element.style.getPropertyValue(property)
      if (allowedStyles.has(property) && !/url\s*\(|expression|javascript|@import/i.test(content))
        safe.push(`${property}: ${content}`)
    }
    if (safe.length) element.setAttribute('style', safe.join('; '))
    else element.removeAttribute('style')
  })
  template.content.querySelectorAll('a').forEach((link) => {
    if (link.getAttribute('target') === '_blank') link.setAttribute('rel', 'noopener noreferrer')
  })
  return template.content.textContent.trim() || template.content.querySelector('img, table, hr') ? template.innerHTML : ''
}
