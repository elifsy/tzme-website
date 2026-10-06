// UI guidance, not image validation requirements. Keep the subject away from edges.
export const imageRecommendations = {
  product: { width: 1200, height: 800, fit: 'cover', hint: 'admin.imageProductHint' },
  news: { width: 1600, height: 900, fit: 'cover', hint: 'admin.imageNewsHint' },
  project: { width: 1600, height: 900, fit: 'cover', hint: 'admin.imageProjectHint' },
  certification: { width: 1240, height: 1754, fit: 'contain', hint: 'admin.imageCertificateHint' },
  map: { width: 1600, height: 700, fit: 'contain', hint: 'admin.imageMapHint' },
  body: { width: 1200, height: 800, fit: 'contain', hint: 'admin.imageBodyHint' },
}
