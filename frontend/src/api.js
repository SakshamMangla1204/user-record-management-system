import { getToken } from "./auth";

export const API_BASE_URL = "http://127.0.0.1:8001";

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const method = options.method || "GET";

  console.log("[api] request:", method, url);

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    console.log("[api] response:", response.status, url, data);

    if (!response.ok) {
      const error = new Error(
        typeof data === "object" && data !== null
          ? data.detail || data.message || `Request failed with status ${response.status}`
          : `Request failed with status ${response.status}`
      );
      error.status = response.status;
      error.responseData = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      console.error("[api] network error:", url, error);
      throw new Error(`Network error while requesting ${url}`);
    }

    console.error("[api] request failed:", url, error);
    throw error;
  }
}

export function authorizedHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
