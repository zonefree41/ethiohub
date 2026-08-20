import {
  setOptions,
  importLibrary,
} from "@googlemaps/js-api-loader";

let configured = false;

export async function loadGoogleMaps() {
  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Google Maps API key is not configured."
    );
  }

  if (!configured) {
    setOptions({
      key: apiKey,
      v: "weekly",
    });

    configured = true;
  }

  await importLibrary("core");
  await importLibrary("places");

  return window.google;
}