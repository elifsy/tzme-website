import test from 'node:test';
import assert from 'node:assert/strict';
import { CERTIFICATE_ACCEPT, MAX_CERTIFICATE_PDF_SIZE, validateCertificateFile, uploadCertificateFile } from '../src/services/certificateUpload.js';
import { validateImageFile } from '../src/services/imageUpload.js';

test('Certificate picker accepts PDF and the existing image formats', () => {
  for (const type of ['application/pdf', '.pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']) assert.ok(CERTIFICATE_ACCEPT.includes(type));
  for (const type of ['application/pdf', 'application/octet-stream', '']) {
    validateCertificateFile({ name: '认证.PDF', type, size: MAX_CERTIFICATE_PDF_SIZE });
  }
  validateCertificateFile({ name: '认证.png', type: 'image/png', size: 5 * 1024 * 1024 });
});
test('Certificate limits reject empty, wrong-format and oversized files without changing image policy', () => {
  for (const file of [null, { name: 'x.pdf', type: 'application/pdf', size: 0 },
    { name: 'x.pdf', type: 'application/pdf', size: MAX_CERTIFICATE_PDF_SIZE + 1 },
    { name: 'x.png', type: 'image/png', size: 5 * 1024 * 1024 + 1 },
    { name: 'x.exe', type: 'application/pdf', size: 20 }, { name: 'x.svg', type: 'image/svg+xml', size: 20 }]) {
    assert.throws(() => validateCertificateFile(file));
  }
  assert.throws(() => validateImageFile({ name: 'x.pdf', type: 'application/pdf', size: 30 }));
});
test('Certificate upload uses the protected multipart endpoint, preserves cancellation and rejects invalid responses', async () => {
  const originalFetch = globalThis.fetch, requests = [];
  let result = { url: '/api/uploads/certificates/12345678-1234-1234-1234-123456789abc.pdf' }, status = 201;
  globalThis.fetch = async (path, options = {}) => {
    if (path === '/api/auth/csrf') return Response.json({ headerName: 'X-CSRF-TOKEN', token: 'test-only-token' });
    requests.push({ path, options });
    return Response.json(result, { status });
  };
  try {
    const file = new File(['%PDF-1.7'], '资质.pdf', { type: 'application/pdf' }), controller = new AbortController();
    assert.deepEqual(await uploadCertificateFile(file, { signal: controller.signal }), result);
    const { path, options } = requests[0];
    assert.equal(path, '/api/uploads/certificates'); assert.equal(options.method, 'POST');
    assert.equal(options.headers.get('X-CSRF-TOKEN'), 'test-only-token');
    assert.equal(options.body.get('file').name, '资质.pdf'); assert.equal(options.signal, controller.signal);
    result = { url: 'https://invalid.example/file.pdf' };
    await assert.rejects(uploadCertificateFile(file), /Invalid uploaded certificate URL/);
    status = 500;
    await assert.rejects(uploadCertificateFile(file), /HTTP 500/);
    const count = requests.length;
    await assert.rejects(uploadCertificateFile(new File(['bad'], 'bad.exe', { type: 'application/octet-stream' })));
    assert.equal(requests.length, count);
  } finally { globalThis.fetch = originalFetch; }
});
