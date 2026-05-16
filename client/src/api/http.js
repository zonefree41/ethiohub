const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function handleResponse(res) {
  if (res.ok) return res.json();

  let message = "Something went wrong. Please try again.";

  try {
    const data = await res.json();
    message = data.message || message;
  } catch {
    message = await res.text();
  }

  throw new Error(message);
}

function handleFetchError(err) {
  if (
    err.message === "Failed to fetch" ||
    err.name === "TypeError"
  ) {
    throw new Error(
      "We couldn’t load services right now. Please check your internet connection and try again."
    );
  }

  throw err;
}

export async function apiGet(path, token) {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return await handleResponse(res);
  } catch (err) {
    handleFetchError(err);
  }
}

export async function apiPost(path, body, token) {
  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    return await handleResponse(res);
  } catch (err) {
    handleFetchError(err);
  }
}

export async function apiPatch(path, body, token) {
  try {
    const res = await fetch(`${API}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    return await handleResponse(res);
  } catch (err) {
    handleFetchError(err);
  }
}