import React from "react";
import { loadGoogleMaps } from "../utils/loadGoogleMaps";

export default function AddressAutocomplete({
  name,
  value,
  onChange,
  placeholder = "Start typing an address...",
  required = false,
}) {
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    let autocomplete = null;
    let listener = null;
    let cancelled = false;

    async function setupAutocomplete() {
      try {
        const google = await loadGoogleMaps();

        if (
          cancelled ||
          !inputRef.current ||
          !google?.maps?.places
        ) {
          return;
        }

        autocomplete =
          new google.maps.places.Autocomplete(
            inputRef.current,
            {
              types: ["address"],
              componentRestrictions: {
                country: "us",
              },
              fields: [
                "formatted_address",
                "geometry",
                "name",
              ],
            }
          );

        listener = autocomplete.addListener(
          "place_changed",
          () => {
            const place = autocomplete.getPlace();

            const address =
              place.formatted_address ||
              place.name ||
              inputRef.current?.value ||
              "";

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

      if (listener) {
        listener.remove();
      }
    };
  }, [name, onChange]);

  return (
    <input
      ref={inputRef}
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete="off"
      required={required}
    />
  );
}