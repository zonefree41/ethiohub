import React from "react";
import { loadGoogleMaps } from "../utils/loadGoogleMaps";

export default function AddressAutocomplete({
  name,
  value,
  onChange,
  placeholder = "Start typing an address...",
  required = false,
}) {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    let autocompleteElement = null;
    let cancelled = false;

    async function setupAutocomplete() {
      try {
        const google = await loadGoogleMaps();

        if (
          cancelled ||
          !containerRef.current ||
          !google?.maps?.places
        ) {
          return;
        }

        const { PlaceAutocompleteElement } =
          await google.maps.importLibrary("places");

        autocompleteElement =
          new PlaceAutocompleteElement({
            includedRegionCodes: ["us"],
          });

        autocompleteElement.placeholder =
          placeholder;

        autocompleteElement.style.width =
          "100%";

        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(
          autocompleteElement
        );

        autocompleteElement.addEventListener(
          "gmp-select",
          async (event) => {
            const placePrediction =
              event.placePrediction;

            if (!placePrediction) {
              return;
            }

            const place =
              placePrediction.toPlace();

            await place.fetchFields({
              fields: [
                "formattedAddress",
                "location",
              ],
            });

            const address =
              place.formattedAddress || "";

            onChange({
              target: {
                name,
                value: address,
              },
            });
          }
        );
      } catch (err) {
        console.error(
          "Google address autocomplete error:",
          err
        );
      }
    }

    setupAutocomplete();

    return () => {
      cancelled = true;

      if (
        autocompleteElement &&
        autocompleteElement.parentNode
      ) {
        autocompleteElement.parentNode.removeChild(
          autocompleteElement
        );
      }
    };
  }, [name, onChange, placeholder]);

  return (
    <>
      <div
        ref={containerRef}
        className="hubethio-address-autocomplete"
      />

      <input
        type="hidden"
        name={name}
        value={value}
        required={required}
        readOnly
      />
    </>
  );
}