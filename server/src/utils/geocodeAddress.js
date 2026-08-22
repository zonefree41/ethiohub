export async function geocodeAddress({
  address = "",
  city = "",
  state = "",
  zip = "",
}) {
  const parts = [
    address,
    city,
    state,
    zip,
    "USA",
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (!city || !state) {
    return null;
  }

  const query = parts.join(", ");

  try {
    const url =
      "https://nominatim.openstreetmap.org/search?" +
      new URLSearchParams({
        q: query,
        format: "jsonv2",
        limit: "1",
        countrycodes: "us",
      });

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "HubEthio/1.0 (https://hubethio.com)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        "Geocoding HTTP error:",
        response.status
      );
      return null;
    }

    const results = await response.json();

    if (!Array.isArray(results) || !results.length) {
      console.log("No geocoding result found.");
      return null;
    }

    const lat = Number(results[0].lat);
    const lng = Number(results[0].lon);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return null;
    }

    return {
      lat,
      lng,
    };
  } catch (err) {
    console.error("Geocoding failed:", err);
    return null;
  }
}