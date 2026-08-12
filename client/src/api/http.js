import { Capacitor, CapacitorHttp } from "@capacitor/core";

const ENV_API = import.meta.env.VITE_API_URL?.trim();

const API = ENV_API || "https://ethiohub.onrender.com";

console.log("HubEthio mode:", import.meta.env.MODE);
console.log("HubEthio API:", API);

function buildUrl(path) {
  if (!path) {
    throw new Error("API path is required.");
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildHeaders(token, hasBody = false) {
  return {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function handleResponse(response) {
  const status = response.status;

  if (status >= 200 && status < 300) {
    return response.data;
  }

  let message = `Request failed with status ${status}`;

  const data = response.data;

  if (typeof data === "string" && data.trim()) {
    message = data;
  } else if (data && typeof data === "object") {
    message = data.message || data.error || message;
  }

  const error = new Error(message);
  error.status = status;
  error.data = data;

  throw error;
}

export function isPublicNotFoundError(err) {
  const status = Number(err?.status || 0);

  if (status === 404) {
    return true;
  }

  const message = String(
    err?.message || ""
  ).toLowerCase();

  return (
    message.includes("404") ||
    message.includes("not found") ||
    message.includes("could not be found") ||
    message.includes("not be found")
  );
}

function handleRequestError(err, method, path) {
  console.error("========== HUBETHIO API ERROR ==========");
  console.error("Method:", method);
  console.error("Path:", path);
  console.error("API:", API);
  console.error("Name:", err?.name);
  console.error("Message:", err?.message);
  console.error("Full error:", err);
  console.error("========================================");

  const message =
    err?.message || `Unknown error while requesting ${method} ${path}`;

  throw new Error(`Network request failed for ${method} ${path}: ${message}`);
}

export async function apiGet(path, token) {
  const url = buildUrl(path);

  try {
    console.log("GET:", url);

    // Android/iOS: use native HTTP
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.get({
        url,
        headers: buildHeaders(token),
        connectTimeout: 15000,
        readTimeout: 30000,
      });

      return handleResponse(response);
    }

    // Browser/localhost: use fetch without cache
    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(token),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
  const error = new Error(
    data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`
  );

  error.status = response.status;
  error.data = data;

  throw error;
}

    return data;
  } catch (err) {
    handleRequestError(err, "GET", path);
  }
}

export async function apiPost(path, body, token) {
  const url = buildUrl(path);

  try {
    console.log("POST:", url);

    const response = await CapacitorHttp.post({
      url,
      headers: buildHeaders(token, true),
      data: body ?? {},
      connectTimeout: 15000,
      readTimeout: 30000,
    });

    return handleResponse(response);
  } catch (err) {
    handleRequestError(err, "POST", path);
  }
}

export async function apiPatch(path, body, token) {
  const url = buildUrl(path);

  try {
    console.log("PATCH:", url);

    const response = await CapacitorHttp.patch({
      url,
      headers: buildHeaders(token, true),
      data: body ?? {},
      connectTimeout: 15000,
      readTimeout: 30000,
    });

    return handleResponse(response);
  } catch (err) {
    handleRequestError(err, "PATCH", path);
  }
}

export async function apiDelete(path, token) {
  const url = buildUrl(path);

  try {
    console.log("DELETE:", url);

    const response = await CapacitorHttp.delete({
      url,
      headers: buildHeaders(token),
      connectTimeout: 15000,
      readTimeout: 30000,
    });

    return handleResponse(response);
  } catch (err) {
    handleRequestError(err, "DELETE", path);
  }
}