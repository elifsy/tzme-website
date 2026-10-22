import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

let library
const jobs = []
let active = 0

export function pdfPreviewLibrary() {
  library ??= import('pdfjs-dist').then(pdf => {
    pdf.GlobalWorkerOptions.workerSrc = workerUrl
    return pdf
  }).catch(error => { library = undefined; throw error })
  return library
}

function drain() {
  while (active < 2 && jobs.length) {
    const { work, resolve, reject } = jobs.shift()
    active++
    Promise.resolve().then(work).then(resolve, reject).finally(() => { active--; drain() })
  }
}

// Limit work while several certificates enter the viewport together.
export function schedulePdfPreview(work) {
  return new Promise((resolve, reject) => { jobs.push({ work, resolve, reject }); drain() })
}
