let googleMapsPromise = null;

export function loadGoogleMaps() {
  if (window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Promise.reject(
      new Error(
        "Google Maps API key is not configured."
      )
    );
  }

  googleMapsPromise = new Promise(
    (resolve, reject) => {
      const existingScript =
        document.querySelector(
          'script[data-hubethio-google-maps="true"]'
        );

      if (existingScript) {
        if (window.google?.maps?.importLibrary) {
          resolve(window.google);
          return;
        }

        existingScript.addEventListener(
          "load",
          () => {
            if (window.google?.maps?.importLibrary) {
              resolve(window.google);
            } else {
              reject(
                new Error(
                  "Google Maps JavaScript API did not load correctly."
                )
              );
            }
          },
          { once: true }
        );

        existingScript.addEventListener(
          "error",
          () =>
            reject(
              new Error(
                "Failed to load Google Maps."
              )
            ),
          { once: true }
        );

        return;
      }

      const script =
        document.createElement("script");

      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
          apiKey
        )}&loading=async&v=weekly`;

      script.async = true;

      script.dataset.hubethioGoogleMaps =
        "true";

      script.onload = () => {
        if (window.google?.maps?.importLibrary) {
          resolve(window.google);
        } else {
          reject(
            new Error(
              "Google Maps JavaScript API did not load correctly."
            )
          );
        }
      };

      script.onerror = () =>
        reject(
          new Error(
            "Failed to load Google Maps."
          )
        );

      document.head.appendChild(script);
    }
  );

  return googleMapsPromise;
}