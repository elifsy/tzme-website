import { reactive, ref } from "vue";
import { sessionFetch } from "./session.js";
import { peekPublicBootstrap, takePublicBootstrap } from "./publicBootstrap.js";

export const dataErrors = reactive(new Map());
const retries = new Map();
const publicGets = new Map();

export function registerDataLoader(path, loader) {
  retries.set(path, loader);
}
export async function retryFailedData() {
  await Promise.allSettled(
    [...dataErrors.keys()].map((path) => retries.get(path)?.()),
  );
}
export function apiRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  // Share only concurrent public reads, not a time-based cache: a later page
  // visit or an administrator's refresh must still see newly saved content.
  if (
    method !== "GET" ||
    options.signal ||
    /^\/admin(?:\/|$)/.test(location.pathname)
  )
    return performRequest(path, { ...options, method });
  if (publicGets.has(path)) return publicGets.get(path);
  const request = performRequest(path, { ...options, method });
  publicGets.set(path, request);
  const clear = () => {
    if (publicGets.get(path) === request) publicGets.delete(path);
  };
  request.then(clear, clear);
  return request;
}
async function performRequest(path, { method = "GET", body, signal } = {}) {
  try {
    if (method === "GET") {
      const initial = takePublicBootstrap(path);
      if (initial !== undefined) {
        dataErrors.delete(path);
        return initial;
      }
    }
    const response = await sessionFetch(path, {
      method,
      signal,
      cache: "no-store",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      const error = new Error(detail.message || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    const value = response.status === 204 ? null : await response.json();
    if (method === "GET") dataErrors.delete(path);
    return value;
  } catch (error) {
    if (
      method === "GET" &&
      error.name !== "AbortError" &&
      ![401, 403].includes(error.status)
    )
      dataErrors.set(path, error.message);
    throw error;
  }
}
export function createCollection(path, normalize = (item) => item) {
  const initial = peekPublicBootstrap(path);
  const records = ref(
    Array.isArray(initial)
      ? initial.filter((item) => item.status !== "deleted").map(normalize)
      : [],
  );
  const loading = ref(false);
  let pending;
  function load() {
    if (pending) return pending;
    loading.value = true;
    pending = (async () => {
      try {
        const response = await apiRequest(path);
        if (!Array.isArray(response)) throw new Error("Invalid data response");
        records.value = response
          .filter((item) => item.status !== "deleted")
          .map(normalize);
        dataErrors.delete(path);
      } catch (error) {
        records.value = [];
        dataErrors.set(path, error.message);
      } finally {
        loading.value = false;
        pending = undefined;
      }
      return records.value;
    })();
    return pending;
  }
  registerDataLoader(path, load);
  return { records, loading, load };
}

export function createSettingsResource(
  path,
  { validate, loadError, saveError, clearOnError = true },
) {
  const settings = ref(null);
  let pending;
  function load() {
    if (pending) return pending;
    pending = (async () => {
      try {
        const value = await apiRequest(path);
        if (!validate(value)) throw new Error(loadError);
        settings.value = value;
        dataErrors.delete(path);
        return value;
      } catch (error) {
        if (clearOnError) settings.value = null;
        dataErrors.set(path, error.message);
        return null;
      } finally {
        pending = undefined;
      }
    })();
    return pending;
  }
  async function save(value) {
    const saved = await apiRequest(path, { method: "PUT", body: value });
    if (!validate(saved)) throw new Error(saveError);
    settings.value = saved;
    dataErrors.delete(path);
    return saved;
  }
  registerDataLoader(path, load);
  return { settings, load, save };
}
