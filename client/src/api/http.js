const ENV_API = import.meta.env.VITE_API_URL?.trim();

const API =
  ENV_API ||
  "https://ethiohub.onrender.com";

console.log("HubEthio mode:", import.meta.env.MODE);
console.log("HubEthio API:", API);

async function handleResponse(res) {
  if (res.ok) {
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return res.json();
    }

    return res.text();
  }

  let message = `Request failed with status ${res.status}`;

  try {
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await res.json();
      message = data.message || data.error || message;
    } else {
      const text = await res.text();
      if (text) message = text;
    }
  } catch (parseError) {
    console.error("Failed to read error response:", parseError);
  }

  throw new Error(message);
}

function handleFetchError(err, method, path) {
  console.error("========== HUBETHIO API ERROR ==========");
  console.error("Method:", method);
  console.error("Path:", path);
  console.error("API:", API);
  console.error("Name:", err?.name);
  console.error("Message:", err?.message);
  console.error("Full error:", err);
  console.error("========================================");

  if (
    err?.message === "Failed to fetch" ||
    err?.name === "TypeError"
  ) {
    throw new Error(
      `Network request failed for ${method} ${path}: ${err?.message || "Unknown network error"}`
    );
  }

  throw err;
}

function buildHeaders(token, hasBody = false) {
  return {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function buildUrl(path) {
  if (!path) {
    throw new Error("API path is required.");
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiGet(path, token) {
  const url = buildUrl(path);

  try {
    console.log("GET:", url);

    const res = await fetch(url, {
      method: "GET",
      headers: buildHeaders(token),
      cache: "no-store",
    });

    return await handleResponse(res);
  } catch (err) {
    handleFetchError(err, "GET", path);
  }
}

export async function apiPost(path, body, token) {
  const url = buildUrl(path);

  try {
    console.log("POST:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: buildHeaders(token, true),
      body: JSON.stringify(body ?? {}),
    });

    return await handleResponse(res);
  } catch (err) {
    handleFetchError(err, "POST", path);
  }
}

export async function apiPatch(path, body, token) {
  const url = buildUrl(path);

  try {
    console.log("PATCH:", url);

    const res = await fetch(url, {
      method: "PATCH",
      headers: buildHeaders(token, true),
      body: JSON.stringify(body ?? {}),
    });

    return await handleResponse(res);
  } catch (err) {
    handleFetchError(err, "PATCH", path);
  }
}

export async function apiDelete(path, token) {
  const url = buildUrl(path);

  try {
    console.log("DELETE:", url);

    const res = await fetch(url, {
      method: "DELETE",
      headers: buildHeaders(token),
    });

    return await handleResponse(res);
  } catch (err) {
    handleFetchError(err, "DELETE", path);
  }
}