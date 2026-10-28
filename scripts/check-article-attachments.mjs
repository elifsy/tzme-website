import test from 'node:test'
import assert from 'node:assert/strict'
import { articleAttachments, articleAttachmentUrl, attachmentSize, validateArticleAttachment } from '../src/utils/articleAttachments.js'

test('attachment uploads accept documents and CAD with size and extension limits', () => {
  for (const name of ['产品手册.PDF','设备.docx','数据.xlsx','介绍.pptx','图纸.dwg','图纸.dxf','资料.zip']) assert.doesNotThrow(()=>validateArticleAttachment({name,size:100}))
  for (const file of [{name:'bad.exe',size:100},{name:'empty.pdf',size:0},{name:'large.pdf',size:20*1024*1024+1},{name:'x'.repeat(180)+'.pdf',size:100}]) assert.throws(()=>validateArticleAttachment(file))
})
test('displaying files accepts only local article download URLs', () => {
  const good={id:'12345678-1234-1234-1234-123456789012',url:'/api/article-attachments/12345678-1234-1234-1234-123456789012',name:'产品手册.pdf',size:1024}
  for (const url of ['javascript:alert(1)','https://example.invalid/file.pdf','/api/inquiry-attachments/private','/api/article-attachments/../private']) assert.equal(articleAttachmentUrl(url),false)
  assert.deepEqual(articleAttachments({attachments:[good,{...good,url:'javascript:alert(1)'},null]}),[good])
  assert.deepEqual(articleAttachments({}),[])
  assert.equal(attachmentSize(1),'1 KB');assert.equal(attachmentSize(1048576),'1.0 MB');assert.equal(attachmentSize(null),'')
})
