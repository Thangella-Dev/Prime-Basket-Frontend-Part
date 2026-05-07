function getStorage(type) {
  if (typeof window === "undefined") return null;
  try {
    return window[type] ?? null;
  } catch {
    return null;
  }
}

function safeGet(storageType, key, fallback = null) {
  const storage = getStorage(storageType);
  if (!storage) return fallback;
  try {
    const value = storage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function safeSet(storageType, key, value) {
  const storage = getStorage(storageType);
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(storageType, key) {
  const storage = getStorage(storageType);
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function safeLocalGet(key, fallback = null) {
  return safeGet("localStorage", key, fallback);
}

export function safeLocalSet(key, value) {
  return safeSet("localStorage", key, value);
}

export function safeLocalRemove(key) {
  return safeRemove("localStorage", key);
}

export function safeSessionGet(key, fallback = null) {
  return safeGet("sessionStorage", key, fallback);
}

export function safeSessionSet(key, value) {
  return safeSet("sessionStorage", key, value);
}

export function safeSessionRemove(key) {
  return safeRemove("sessionStorage", key);
}
