export function focusProjectContent(id) {
  const content = document.getElementById(id)
  if (!content) return
  content.focus({ preventScroll: true })
  content.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'start',
  })
}
