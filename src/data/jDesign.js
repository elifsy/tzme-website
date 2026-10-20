// Only curated, normal project paths are used at runtime.
export const jAssets = Object.freeze({
  logo: '/assets/tzme-j/brand/official-mark.jpg',
  // harbor: '/assets/tzme-j/banners/harbor-clean.png',
  harbor: '/assets/tzme-j/banners/1111111.jpg',
  factory: '/assets/tzme-j/factories/greenland-aerial.jpg',
  team: '/assets/tzme-j/banners/team-equipment.jpg',
  video: '/assets/tzme-j/videos/greenland-aerial.mp4',
  welding: '/assets/tzme-j/factories/welding-detail.jpg',
})
export const jBanner = {
  image: jAssets.harbor,
  title: { zh: '成为全球非标机械\n设备制造领域的\n领导者。', en: 'To become the world leader in non-standard mechanical equipment manufacturing.' },
  button: { zh: '品质之选', en: 'A quality choice' },
  to: '/solutions',
}
export const projectGalleries = {
  'turkey-grab-unloader': [1, 2, 3].map(i => `/assets/tzme-j/projects/turkey-unloader-0${i}.jpg`),
}
export const isPdf = value => /\.pdf(?:[?#]|$)/i.test(value || '')
