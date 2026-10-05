import { computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const navigationItems = [
  { key: 'navHome', path: '/' },
  { key: 'navAbout', path: '/about' },
  { key: 'navProducts', path: '/solutions' },
  { key: 'navProjects', path: '/projects' },
  { key: 'navNews', path: '/insights' },
  { key: 'navContact', path: '/contact' },
]

export function useSiteNavigation() {
  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n({ useScope: 'global' })
  const menuItems = computed(() => navigationItems.map(({ key, path }) => ({
    key,
    label: t(`site.${key}`),
    path,
  })))

  function isMenuActive(item) {
    if (item.path === '/') return route.path === '/'
    return route.path === item.path || route.path.startsWith(`${item.path}/`)
  }

  async function goTo(path) {
    const [pathname, hash] = path.split('#')
    await router.push({ path: pathname || '/', hash: hash ? `#${hash}` : '' })
    await nextTick()
    if (hash) {
      document.getElementById(hash)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start',
      })
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }

  function navigateLink(event, path) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    goTo(path)
  }

  return { menuItems, isMenuActive, goTo, navigateLink }
}
