import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isRef, toRaw } from 'vue';
import { dataErrors, retryFailedData } from '../src/services/api.js';

// Exercise the actual service contracts with an in-memory HTTP boundary. No
// request can reach the CMS, and no production content is modified.
globalThis.document = { getElementById: () => null };
globalThis.location = { pathname: '/admin/settings-contract-check' };
let respond, calls;
globalThis.fetch = async (path, options = {}) => {
  calls.push({ path, ...options });
  if (path === '/api/auth/csrf') return json({ headerName: 'X-CSRF-TOKEN', token: 'contract-token' });
  return respond(path, options);
};
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
const text = { zh: '已配置的中文内容' };
const aboutSection = {
  kicker: text, titleLine1: text, titleLine2: text, description: text,
  description2: text, imageAlt: text, image: '',
  entries: Array.from({ length: 4 }, () => ({ value: text, suffix: text, label: text })),
};
const cases = [
  {
    name: 'About TZME', path: '/api/about-tzme', file: 'aboutTzme', key: 'aboutTzme',
    use: 'useAboutTzme', load: 'loadAboutTzme', save: 'saveAboutTzme', clearOnError: true,
    fixture: { home: aboutSection, about: aboutSection },
    loadError: 'Invalid About TZME settings', saveError: 'Invalid saved About TZME settings',
  },
  {
    name: 'Manufacturing capabilities', path: '/api/home-capabilities', file: 'capabilities', key: 'capabilities',
    use: 'useCapabilities', load: 'loadCapabilities', save: 'saveCapabilities', clearOnError: true,
    fixture: { enabled: true, image: '', kicker: text, titleLine1: text, titleLine2: text, description: text, imageAlt: text, steps: [] },
    loadError: 'Invalid homepage capabilities settings', saveError: 'Invalid saved capabilities settings',
  },
  {
    name: 'Homepage solutions', path: '/api/home-solutions', file: 'homeSolutions', key: 'homeSolutions',
    use: 'useHomeSolutions', load: 'loadHomeSolutions', save: 'saveHomeSolutions', clearOnError: true,
    fixture: { section: { kicker: text, title: text, buttonText: text }, products: {}, industries: {} },
    loadError: 'Invalid homepage solution settings', saveError: 'Invalid saved homepage solution settings',
  },
  {
    name: 'Partners', path: '/api/partners', file: 'partners', key: 'partners',
    use: 'usePartners', load: 'loadPartners', save: 'savePartners', clearOnError: false,
    fixture: JSON.parse(readFileSync('server/src/main/resources/partners-defaults.json', 'utf8')),
    loadError: 'Invalid partner settings', saveError: 'Invalid partner settings',
  },
];

for (const entry of cases) {
  const service = await import(`../src/services/${entry.file}.js`);
  const load = service[entry.load], save = service[entry.save];
  const state = service[entry.use]()[entry.key];
  const fixture = (revision) => ({ ...structuredClone(entry.fixture), revision });

  test(`${entry.name}: shared reactive state and coalesced loads remain fresh`, async () => {
    dataErrors.clear(); calls = [];
    assert.ok(isRef(state));
    assert.equal(state, service[entry.use]()[entry.key]);
    assert.equal(service[entry.use]()[entry.load], load);
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    respond = async () => { await gate; return json(fixture(1)); };
    const first = load(), second = load();
    assert.equal(first, second, 'concurrent callers share the same pending operation');
    release();
    assert.deepEqual(await first, fixture(1));
    assert.deepEqual(toRaw(state.value), fixture(1));
    assert.equal(calls.filter(call => call.path === entry.path).length, 1);
    respond = () => json(fixture(2));
    assert.deepEqual(await load(), fixture(2), 'a later refresh fetches new content');
    assert.equal(calls.filter(call => call.path === entry.path).length, 2);
  });

  test(`${entry.name}: failed loads preserve the existing policy and remain retryable`, async () => {
    calls = [];
    const previous = structuredClone(toRaw(state.value));
    respond = () => { throw new Error('Temporary network failure'); };
    assert.equal(await load(), null);
    assert.equal(dataErrors.get(entry.path), 'Temporary network failure');
    assert.deepEqual(toRaw(state.value), entry.clearOnError ? null : previous);
    respond = () => json(fixture(3));
    await retryFailedData();
    assert.deepEqual(toRaw(state.value), fixture(3));
    assert.equal(dataErrors.has(entry.path), false);
    respond = () => json({ invalid: true });
    assert.equal(await load(), null);
    assert.equal(dataErrors.get(entry.path), entry.loadError);
    assert.deepEqual(toRaw(state.value), entry.clearOnError ? null : fixture(3));
    respond = () => json(fixture(4));
    assert.deepEqual(await load(), fixture(4));
    assert.equal(dataErrors.has(entry.path), false);
  });

  test(`${entry.name}: saves retain the endpoint, payload, CSRF and server response`, async () => {
    calls = [];
    dataErrors.set(entry.path, 'Previous failure');
    const body = fixture(5), saved = fixture(6);
    respond = () => json(saved);
    assert.deepEqual(await save(body), saved);
    const request = calls.find(call => call.method === 'PUT');
    assert.equal(request.path, entry.path);
    assert.deepEqual(JSON.parse(request.body), body);
    assert.equal(request.headers.get('X-CSRF-TOKEN'), 'contract-token');
    assert.equal(request.credentials, 'same-origin');
    assert.deepEqual(toRaw(state.value), saved);
    assert.equal(dataErrors.has(entry.path), false);
  });

  test(`${entry.name}: rejected saves never replace the last valid settings`, async () => {
    calls = [];
    const previous = structuredClone(toRaw(state.value));
    respond = () => json({ invalid: true });
    await assert.rejects(save(fixture(7)), { message: entry.saveError });
    assert.deepEqual(toRaw(state.value), previous);
    respond = () => json({ message: 'Save unavailable' }, 503);
    await assert.rejects(save(fixture(8)), { message: 'Save unavailable', status: 503 });
    assert.deepEqual(toRaw(state.value), previous);
    respond = () => json(fixture(9));
    assert.deepEqual(await save(fixture(9)), fixture(9));
    assert.deepEqual(toRaw(state.value), fixture(9));
  });
}
