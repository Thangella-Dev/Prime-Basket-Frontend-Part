function supportsAbortController() {
  return typeof AbortController !== "undefined";
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  if (!supportsAbortController()) {
    return fetch(url, options);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}
