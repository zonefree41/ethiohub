import React from "react";
import { apiGet, apiPatch } from "../../api/http.js";
import "./EditListing.css";

export default function EditListing() {
  console.log("✅ EditListing component loaded");
  const token = localStorage.getItem("ownerToken");
  const id = window.location.pathname.split("/").pop();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [uploadingBanner, setUploadingBanner] = React.useState(false);
  const [uploadingPropertyPhotos, setUploadingPropertyPhotos] = React.useState(false);
  const [uploadingPropertyVideo, setUploadingPropertyVideo] = React.useState(false);

  const [form, setForm] = React.useState({
    title: "",
    subcategory: "",
    phone: "",
    whatsapp: "",
    website: "",
    businessHours: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    description_en: "",
    description_am: "",
    logoUrl: "",
    imageUrl: "",
    propertyVideoUrl: "",
propertyImages: [],
availabilityStatus: "available",
availableFrom: "",

monthlyRent: "",
bedrooms: "",
bathrooms: "",
squareFeet: "",
securityDeposit: "",
leaseTerm: "",
parking: false,
petsAllowed: false,
utilitiesIncluded: false,
furnished: false,
  });

  React.useEffect(() => {
    document.title = "Edit Listing | HubEthio";
  }, []);

  function update(e) {
  const { name, value } = e.target;

  console.log("FIELD CHANGED:", name, value);

  setForm((prev) => ({
    ...prev,
    [name]: value,
  }));
}

function updateCheckbox(e) {
  const { name, checked } = e.target;

  setForm((prev) => ({
    ...prev,
    [name]: checked,
  }));
}

async function handlePropertyVideoUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.type !== "video/mp4") {
    setError("Only MP4 video files are allowed.");
    return;
  }

  setUploadingPropertyVideo(true);
  setError("");
  setMessage("");

  try {
    const formData = new FormData();
    formData.append("video", file);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/video`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Video upload failed");
    }

    setForm((prev) => ({
      ...prev,
      propertyVideoUrl: data.url,
    }));
  } catch (err) {
    setError(err.message || "Video upload failed");
  } finally {
    setUploadingPropertyVideo(false);
  }
}

function removePropertyVideo() {
  setForm((prev) => ({
    ...prev,
    propertyVideoUrl: "",
  }));
}

  async function uploadImage(file, fieldName) {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Image upload failed");
    }

    setForm((prev) => ({
      ...prev,
      [fieldName]: data.url,
    }));
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError("");
    setMessage("");

    try {
      await uploadImage(file, "logoUrl");
    } catch (err) {
      setError(err.message || "Logo upload failed");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleBannerUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    setError("");
    setMessage("");

    try {
      await uploadImage(file, "imageUrl");
    } catch (err) {
      setError(err.message || "Banner upload failed");
    } finally {
      setUploadingBanner(false);
    }
  }

  async function handlePropertyPhotosUpload(e) {
  const files = Array.from(e.target.files || []);

  if (files.length === 0) return;

  const currentImages = Array.isArray(form.propertyImages)
    ? form.propertyImages
    : [];

  if (currentImages.length + files.length > 20) {
    setError("You can upload up to 20 property photos.");
    return;
  }

  setUploadingPropertyPhotos(true);
  setError("");
  setMessage("");

  try {
    const uploadedUrls = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Property photo upload failed");
      }

      uploadedUrls.push(data.url);
    }

    setForm((prev) => ({
      ...prev,
      propertyImages: [...(prev.propertyImages || []), ...uploadedUrls].slice(0, 20),
    }));
  } catch (err) {
    setError(err.message || "Property photo upload failed");
  } finally {
    setUploadingPropertyPhotos(false);
  }
}

function removePropertyImage(indexToRemove) {
  setForm((prev) => ({
    ...prev,
    propertyImages: (prev.propertyImages || []).filter(
      (_, index) => index !== indexToRemove
    ),
  }));
}

  async function loadListing() {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet(`/api/owner/listings/${id}`, token);

      setForm({
        title: data.title || "",
        subcategory: data.subcategory || "",
        phone: data.phone || "",
        whatsapp: data.whatsapp || "",
        website: data.website || "",
        businessHours: data.businessHours || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zip: data.zip || "",
        description_en: data.description_en || "",
        description_am: data.description_am || "",
        logoUrl: data.logoUrl || "",
        imageUrl: data.imageUrl || "",
        propertyVideoUrl: data.propertyVideoUrl || "",
propertyImages: Array.isArray(data.propertyImages) ? data.propertyImages : [],
        availabilityStatus: data.availabilityStatus || "available",
availableFrom: data.availableFrom
  ? data.availableFrom.slice(0, 10)
  : "",

  monthlyRent: data.monthlyRent ?? "",
bedrooms: data.bedrooms ?? "",
bathrooms: data.bathrooms ?? "",
squareFeet: data.squareFeet ?? "",
securityDeposit: data.securityDeposit ?? "",
leaseTerm: data.leaseTerm || "",
parking: Boolean(data.parking),
petsAllowed: Boolean(data.petsAllowed),
utilitiesIncluded: Boolean(data.utilitiesIncluded),
furnished: Boolean(data.furnished),
      });
    } catch (err) {
      setError(err.message || "Failed to load listing");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (!token) {
      window.location.href = "/owner/login";
      return;
    }

    loadListing();
  }, [id]);

  async function submit(e) {
  e.preventDefault();

  try {
    setSaving(true);
    setError("");
    setMessage("");

    console.log("Saving owner listing form:", form);

    const result = await apiPatch(`/api/owner/listings/${id}`, form, token);

    setMessage(result.message || "✅ Listing updated successfully.");
  } catch (err) {
    setError(err.message || "Failed to update listing");
  } finally {
    setSaving(false);
  }
}

  const isBusy =
  uploadingLogo ||
  uploadingBanner ||
  uploadingPropertyPhotos ||
  uploadingPropertyVideo ||
  saving;

  const isHousingListing = [
  "Apartments",
  "Houses",
  "Basement Rentals",
  "Rooms",
  "Roommates",
].includes(form.subcategory);

  return (
    <main className="edit-listing-page">
      <div className="edit-listing-container">
        <a href="/owner/dashboard" className="edit-listing-back">
          ← Back to Dashboard
        </a>

        <section className="edit-listing-hero">
          <p className="edit-listing-label">Business Portal</p>
          <h1>Edit Listing</h1>
          <p>
            Update your business details, images, contact information, and
            descriptions. Changes may be reviewed by HubEthio before appearing
            publicly.
          </p>
        </section>

        {loading && (
          <div className="edit-listing-state">
            <div className="edit-listing-spinner"></div>
            <h2>Loading listing...</h2>
            <p>Please wait while we load your business information.</p>
          </div>
        )}

        {!loading && error && (
          <div className="edit-listing-error">Error: {error}</div>
        )}

        {!loading && message && (
          <div className="edit-listing-success">{message}</div>
        )}

        {!loading && (
          <form onSubmit={submit} className="edit-listing-form">
            <section className="edit-listing-section">
              <h2>Business Information</h2>

              <input
                name="title"
                placeholder="Business title"
                value={form.title}
                onChange={update}
                required
              />

              <div className="edit-listing-two-col">
                <input
                  name="phone"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={update}
                  required
                />

                <input
                  name="whatsapp"
                  placeholder="WhatsApp"
                  value={form.whatsapp}
                  onChange={update}
                />
              </div>

              <input
                name="website"
                placeholder="Website"
                value={form.website}
                onChange={update}
              />
              <textarea
  name="businessHours"
  placeholder="Business Hours: Mon–Fri 9AM–5PM, Sat 10AM–3PM"
  rows="3"
  value={form.businessHours}
  onChange={update}
/>

<div className="edit-listing-two-col">
  <select
    name="availabilityStatus"
    value={form.availabilityStatus}
    onChange={update}
  >
    <option value="available">🟢 Available</option>
    <option value="rented">🔴 Rented</option>
  </select>

  <input
    type="date"
    name="availableFrom"
    value={form.availableFrom}
    onChange={update}
  />
</div>
            </section>

{isHousingListing && (
            <section className="edit-listing-section">
  <h2>Rental Information</h2>

  <div className="edit-listing-two-col">
    <input
      type="number"
      name="monthlyRent"
      placeholder="Monthly Rent"
      value={form.monthlyRent}
      onChange={update}
      min="0"
    />

    <input
      type="number"
      name="securityDeposit"
      placeholder="Security Deposit"
      value={form.securityDeposit}
      onChange={update}
      min="0"
    />
  </div>

  <div className="edit-listing-three-col">
    <input
      type="number"
      name="bedrooms"
      placeholder="Bedrooms"
      value={form.bedrooms}
      onChange={update}
      min="0"
    />

    <input
      type="number"
      name="bathrooms"
      placeholder="Bathrooms"
      value={form.bathrooms}
      onChange={update}
      min="0"
      step="0.5"
    />

    <input
      type="number"
      name="squareFeet"
      placeholder="Square Feet"
      value={form.squareFeet}
      onChange={update}
      min="0"
    />
  </div>

  <select name="leaseTerm" value={form.leaseTerm} onChange={update}>
    <option value="">Select Lease Term</option>
    <option value="Month-to-Month">Month-to-Month</option>
    <option value="6 Months">6 Months</option>
    <option value="12 Months">12 Months</option>
    <option value="Flexible">Flexible</option>
  </select>

  <div className="edit-listing-checkboxes">
    <label>
      <input
        type="checkbox"
        name="parking"
        checked={form.parking}
        onChange={updateCheckbox}
      />
      Parking
    </label>

    <label>
      <input
        type="checkbox"
        name="petsAllowed"
        checked={form.petsAllowed}
        onChange={updateCheckbox}
      />
      Pets Allowed
    </label>

    <label>
      <input
        type="checkbox"
        name="utilitiesIncluded"
        checked={form.utilitiesIncluded}
        onChange={updateCheckbox}
      />
      Utilities Included
    </label>

    <label>
      <input
        type="checkbox"
        name="furnished"
        checked={form.furnished}
        onChange={updateCheckbox}
      />
      Furnished
    </label>
  </div>
</section>
)}

            <section className="edit-listing-section">
              <h2>Location</h2>

              <input
                name="address"
                placeholder="Address"
                value={form.address}
                onChange={update}
              />

              <div className="edit-listing-three-col">
                <input
                  name="city"
                  placeholder="City"
                  value={form.city}
                  onChange={update}
                />

                <input
                  name="state"
                  placeholder="State"
                  value={form.state}
                  onChange={update}
                />

                <input
                  name="zip"
                  placeholder="ZIP"
                  value={form.zip}
                  onChange={update}
                />
              </div>
            </section>

            <section className="edit-listing-section">
              <h2>Descriptions</h2>

              <textarea
                name="description_en"
                placeholder="English description"
                rows="5"
                value={form.description_en}
                onChange={update}
              />

              <textarea
                name="description_am"
                placeholder="Amharic description"
                rows="5"
                value={form.description_am}
                onChange={update}
              />
            </section>

            <section className="edit-listing-section">
              <h2>Images</h2>

              <div className="edit-listing-upload-card">
                <label>Business Logo</label>
                <p>Recommended: square image, like 500x500.</p>

                <input type="file" accept="image/*" onChange={handleLogoUpload} />

                {uploadingLogo && (
                  <p className="edit-listing-uploading">Uploading logo...</p>
                )}

                {form.logoUrl && (
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    className="edit-listing-logo-preview"
                  />
                )}
              </div>

              <div className="edit-listing-upload-card">
                <label>Business Banner Image</label>
                <p>Recommended: wide image, like 1200x600.</p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                />

                {uploadingBanner && (
                  <p className="edit-listing-uploading">Uploading banner...</p>
                )}

                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="Banner preview"
                    className="edit-listing-banner-preview"
                  />
                )}
              </div>

              <div className="edit-listing-upload-card">
  <label>Property Photos</label>
  <p>
    Upload up to 20 photos for rentals: living room, kitchen,
    bedrooms, bathroom, exterior, parking, and more.
  </p>

  <input
    type="file"
    accept="image/*"
    multiple
    onChange={handlePropertyPhotosUpload}
  />

  {uploadingPropertyPhotos && (
    <p className="edit-listing-uploading">Uploading property photos...</p>
  )}

  {form.propertyImages?.length > 0 && (
    <div className="edit-listing-property-grid">
      {form.propertyImages.map((url, index) => (
        <div key={`${url}-${index}`} className="edit-listing-property-photo">
          <img src={url} alt={`Property photo ${index + 1}`} />

          <button type="button" onClick={() => removePropertyImage(index)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  )}
</div>
            </section>

            <div className="edit-listing-upload-card">
  <label>Property Video</label>
  <p>Upload one MP4 walkthrough video. Recommended length: 60–90 seconds.</p>

  <input
    type="file"
    accept="video/mp4"
    onChange={handlePropertyVideoUpload}
  />

  {uploadingPropertyVideo && (
    <p className="edit-listing-uploading">Uploading property video...</p>
  )}

  {form.propertyVideoUrl && (
    <div className="edit-listing-video-preview">
      <video src={form.propertyVideoUrl} controls />

      <button type="button" onClick={removePropertyVideo}>
        Remove Video
      </button>
    </div>
  )}
</div>

            <button
              type="submit"
              disabled={isBusy}
              className="edit-listing-submit"
            >
              {isBusy ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}