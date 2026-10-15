// Only curated, normal project paths are used at runtime.
export const jAssets = Object.freeze({
  logo: '/assets/tzme-j/brand/official-mark.jpg',
  harbor: '/assets/tzme-j/banners/harbor-clean.png',
  factory: '/assets/tzme-j/factories/greenland-aerial.jpg',
  team: '/assets/tzme-j/banners/team-equipment.jpg',
  video: '/assets/tzme-j/videos/greenland-aerial.mp4',
  welding: '/assets/tzme-j/factories/welding-detail.jpg',
})
export const jBanners = [
  { image: jAssets.harbor, title: { zh: '成为全球非标机械\n设备制造领域的\n领导者。', en: 'To become the world leader in non-standard mechanical equipment manufacturing.' }, button: { zh: '品质之选', en: 'A quality choice' }, to: '/solutions' },
  { image: jAssets.factory, title: { zh: '合作共赢，\n共创美好未来。', en: 'Win-win cooperation.\nCreate a better future.' }, subtitle: { zh: '非标机械设备定制化服务供应商', en: 'Customised service supplier for non-standard mechanical equipment' }, button: { zh: '值得信赖', en: 'Trustworthy' }, to: '/about' },
  { image: jAssets.team, title: { zh: '为员工谋幸福，\n让更多优质产品\n服务世界。', en: 'To seek happiness for employees. Let more high-quality products serve the world.' }, button: { zh: '携手共创美好未来', en: 'Creating a better future together' }, to: '/about' },
]
export const projectGalleries = {
  'turkey-grab-unloader': [1, 2, 3].map(i => `/assets/tzme-j/projects/turkey-unloader-0${i}.jpg`),
}
export const isPdf = value => /\.pdf(?:[?#]|$)/i.test(value || '')
