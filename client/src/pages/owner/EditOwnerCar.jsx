import React from "react";
import {
  apiGet,
  apiPatch,
} from "../../api/http.js";
import { apiPost } from "../../api/http.js";
import "../SellCar.css";

const initialForm = {
  sellerType: "private",
  sellerName: "",
  sellerEmail: "",
  sellerPhone: "",

  year: "",
  make: "",
  model: "",
  trim: "",

  price: "",
  mileage: "",
  vin: "",

  exteriorColor: "",
  interiorColor: "",
  transmission: "",
  drivetrain: "",
  fuelType: "",
  titleStatus: "",
  condition: "",

  description: "",
  city: "",
  state: "",

  photos: [],
};

export default function EditOwnerCar() {
    const token =
    localStorage.getItem("ownerToken");

  const pathParts =
  window.location.pathname
    .split("/")
    .filter(Boolean);

const vehicleId =
  pathParts[pathParts.length - 2];

  const [loading, setLoading] =
    React.useState(true);

  const [message, setMessage] =
    React.useState("");
  const [form, setForm] = React.useState(initialForm);
  const [uploadingPhotos, setUploadingPhotos] =
    React.useState(false);
  const [submitting, setSubmitting] =
    React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
  document.title = "Edit Car Listing | HubEthio";

  if (!token) {
    window.location.href =
      `/owner/login?redirect=/owner/my-cars/${vehicleId}/edit`;
    return;
  }

  async function loadVehicle() {
    try {
      setLoading(true);
      setError("");

      const vehicle = await apiGet(
        `/api/cars/mine/${vehicleId}`,
        token
      );

      setForm({
        sellerType: vehicle.sellerType || "private",
        sellerName: vehicle.sellerName || "",
        sellerEmail: vehicle.sellerEmail || "",
        sellerPhone: vehicle.sellerPhone || "",

        year: vehicle.year ?? "",
        make: vehicle.make || "",
        model: vehicle.model || "",
        trim: vehicle.trim || "",

        price: vehicle.price ?? "",
        mileage: vehicle.mileage ?? "",
        vin: vehicle.vin || "",

        exteriorColor:
          vehicle.exteriorColor || "",
        interiorColor:
          vehicle.interiorColor || "",
        transmission:
          vehicle.transmission || "",
        drivetrain:
          vehicle.drivetrain || "",
        fuelType:
          vehicle.fuelType || "",
        titleStatus:
          vehicle.titleStatus || "",
        condition:
          vehicle.condition || "",

        description:
          vehicle.description || "",
        city: vehicle.city || "",
        state: vehicle.state || "",

        photos: Array.isArray(vehicle.photos)
          ? vehicle.photos
          : [],
      });
    } catch (err) {
      const text =
        err.message ||
        "Unable to load vehicle listing.";

      if (
        text.toLowerCase().includes("login") ||
        text.toLowerCase().includes("token") ||
        text.includes("401")
      ) {
        localStorage.removeItem("ownerToken");
        localStorage.removeItem("ownerUser");

        window.location.href =
          `/owner/login?redirect=/owner/my-cars/${vehicleId}/edit`;
        return;
      }

      setError(text);
    } finally {
      setLoading(false);
    }
  }

  if (vehicleId) {
    loadVehicle();
  }
}, [token, vehicleId]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handlePhotosUpload(e) {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const currentPhotos = Array.isArray(form.photos)
      ? form.photos
      : [];

    const remainingSlots =
      10 - currentPhotos.length;

    const filesToUpload =
      files.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      setError(
        "You can upload up to 10 vehicle photos."
      );
      return;
    }

    setUploadingPhotos(true);
    setError("");

    try {
      const uploadedUrls = [];

      for (const file of filesToUpload) {
        const formData = new FormData();

        formData.append("image", file);

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message ||
              "Vehicle photo upload failed"
          );
        }

        uploadedUrls.push(data.url);
      }

      setForm((prev) => ({
        ...prev,
        photos: [
          ...(prev.photos || []),
          ...uploadedUrls,
        ].slice(0, 10),
      }));
    } catch (err) {
      setError(
        err.message ||
          "Vehicle photo upload failed"
      );
    } finally {
      setUploadingPhotos(false);
    }
  }

  function removePhoto(indexToRemove) {
    setForm((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter(
        (_, index) =>
          index !== indexToRemove
      ),
    }));
  }

  async function handleSubmit(e) {
  e.preventDefault();

  setSubmitting(true);
  setError("");
  setMessage("");

  try {
    const result = await apiPatch(
      `/api/cars/mine/${vehicleId}`,
      {
        ...form,
        year: Number(form.year),
        price: Number(form.price),
        mileage: Number(form.mileage),
      },
      token
    );

    setMessage(
      result?.message ||
        "Vehicle listing updated successfully."
    );

    window.setTimeout(() => {
      window.location.href = "/owner/my-cars";
    }, 900);
  } catch (err) {
    setError(
      err.message ||
        "Unable to update vehicle listing."
    );
  } finally {
    setSubmitting(false);
  }
}

  return (
    <main className="sell-car-page">
      <div className="sell-car-container">
        <header className="sell-car-hero">
          <a
  href="/owner/my-cars"
  className="sell-car-back"
>
  ← My Cars
</a>

          <p className="sell-car-kicker">
            HubEthio Cars Marketplace
          </p>

          <h1>Edit Car Listing</h1>

<p>
  Update your vehicle information.
  Approved listings will return to
  admin review after changes.
</p>
        </header>

        {message && (
  <div className="sell-car-success">
    {message}
  </div>
)}

        {error && (
          <div className="sell-car-error">
            {error}
          </div>
        )}

        <form
          className="sell-car-form"
          onSubmit={handleSubmit}
        >
          <section className="sell-car-section">
            <h2>Seller Information</h2>

            <div className="sell-car-grid">
              <label>
                Seller Type
                <select
                  name="sellerType"
                  value={form.sellerType}
                  onChange={handleChange}
                >
                  <option value="private">
                    Private Seller
                  </option>
                  <option value="dealer">
                    Dealer
                  </option>
                </select>
              </label>

              <label>
                Seller Name *
                <input
                  name="sellerName"
                  value={form.sellerName}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Email *
                <input
                  type="email"
                  name="sellerEmail"
                  value={form.sellerEmail}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Phone *
                <input
                  name="sellerPhone"
                  value={form.sellerPhone}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>
          </section>

          <section className="sell-car-section">
            <h2>Vehicle Information</h2>

            <div className="sell-car-grid">
              <label>
                Year *
                <input
                  type="number"
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  min="1900"
                  max="2100"
                  required
                />
              </label>

              <label>
                Make *
                <input
                  name="make"
                  value={form.make}
                  onChange={handleChange}
                  placeholder="Toyota"
                  required
                />
              </label>

              <label>
                Model *
                <input
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  placeholder="Camry"
                  required
                />
              </label>

              <label>
                Trim
                <input
                  name="trim"
                  value={form.trim}
                  onChange={handleChange}
                  placeholder="SE"
                />
              </label>

              <label>
                Price *
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </label>

              <label>
                Mileage *
                <input
                  type="number"
                  name="mileage"
                  value={form.mileage}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </label>

              <label>
                VIN
                <input
                  name="vin"
                  value={form.vin}
                  onChange={handleChange}
                  maxLength={17}
                />
              </label>

              <label>
                Condition
                <select
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                >
                  <option value="">
                    Select
                  </option>
                  <option value="Excellent">
                    Excellent
                  </option>
                  <option value="Good">
                    Good
                  </option>
                  <option value="Fair">
                    Fair
                  </option>
                  <option value="Needs Work">
                    Needs Work
                  </option>
                </select>
              </label>
            </div>
          </section>

          <section className="sell-car-section">
            <h2>Vehicle Details</h2>

            <div className="sell-car-grid">
              <label>
                Transmission
                <select
                  name="transmission"
                  value={form.transmission}
                  onChange={handleChange}
                >
                  <option value="">
                    Select
                  </option>
                  <option value="Automatic">
                    Automatic
                  </option>
                  <option value="Manual">
                    Manual
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </label>

              <label>
                Drivetrain
                <select
                  name="drivetrain"
                  value={form.drivetrain}
                  onChange={handleChange}
                >
                  <option value="">
                    Select
                  </option>
                  <option value="FWD">
                    FWD
                  </option>
                  <option value="RWD">
                    RWD
                  </option>
                  <option value="AWD">
                    AWD
                  </option>
                  <option value="4WD">
                    4WD
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </label>

              <label>
                Fuel Type
                <select
                  name="fuelType"
                  value={form.fuelType}
                  onChange={handleChange}
                >
                  <option value="">
                    Select
                  </option>
                  <option value="Gasoline">
                    Gasoline
                  </option>
                  <option value="Diesel">
                    Diesel
                  </option>
                  <option value="Hybrid">
                    Hybrid
                  </option>
                  <option value="Plug-in Hybrid">
                    Plug-in Hybrid
                  </option>
                  <option value="Electric">
                    Electric
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </label>

              <label>
                Title Status
                <select
                  name="titleStatus"
                  value={form.titleStatus}
                  onChange={handleChange}
                >
                  <option value="">
                    Select
                  </option>
                  <option value="Clean">
                    Clean
                  </option>
                  <option value="Rebuilt">
                    Rebuilt
                  </option>
                  <option value="Salvage">
                    Salvage
                  </option>
                  <option value="Lien">
                    Lien
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </label>

              <label>
                Exterior Color
                <input
                  name="exteriorColor"
                  value={form.exteriorColor}
                  onChange={handleChange}
                />
              </label>

              <label>
                Interior Color
                <input
                  name="interiorColor"
                  value={form.interiorColor}
                  onChange={handleChange}
                />
              </label>

              <label>
                City *
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                State *
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  required
                  maxLength={50}
                />
              </label>
            </div>

            <label className="sell-car-full">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={6}
                maxLength={5000}
                placeholder="Describe the vehicle condition, maintenance history, features, and anything buyers should know."
              />
            </label>
          </section>

          <section className="sell-car-section">
            <h2>Vehicle Photos</h2>

            <p className="sell-car-help">
              Upload up to 10 clear vehicle
              photos.
            </p>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotosUpload}
              disabled={uploadingPhotos}
            />

            {uploadingPhotos && (
              <p>
                Uploading vehicle photos...
              </p>
            )}

            {form.photos.length > 0 && (
              <div className="sell-car-photos">
                {form.photos.map(
                  (photo, index) => (
                    <div
                      key={`${photo}-${index}`}
                      className="sell-car-photo"
                    >
                      <img
                        src={photo}
                        alt={`Vehicle ${index + 1}`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removePhoto(index)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          <button
            type="submit"
            className="sell-car-submit"
            disabled={
              submitting ||
              uploadingPhotos
            }
          >
            {submitting
  ? "Saving Changes..."
  : "Save Changes"}
          </button>

          <p className="sell-car-disclaimer">
  You will not be charged another listing fee.
  Changes to a live vehicle listing require
  HubEthio admin review before the vehicle
  appears publicly again.
</p>
        </form>
      </div>
    </main>
  );
}