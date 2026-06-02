export const DEFAULT_REQUEST_TIMEOUT_MS = 20000;
export const PDF_UPLOAD_TIMEOUT_MS = 30000;

export class RequestTimeoutError extends Error {
  constructor(timeoutMs) {
    super(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
    this.name = "RequestTimeoutError";
  }
}

export const fetchWithTimeout = async (url, options = {}, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new RequestTimeoutError(timeoutMs);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
};
