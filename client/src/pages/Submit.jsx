import React from "react";
import { apiGet, apiPost } from "../api/http.js";
import "./Submit.css";

const emptyForm = {
  title: "",
  categoryId: "",
  phone: "",
  whatsapp: "",
  website: "",
  address: "", 
  city: "",
  state: "",
  zip: "",
  description_en: "",
  description_am: "",
  submittedByName: "",
  submittedByContact: "",
  logoUrl: "",
  imageUrl: "",
  businessHours: "",
};

export default function Submit() {
  const [categories, setCategories] = React.useState([]);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [uploadingBanner, setUploadingBanner] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);

  React.useEffect(() => {
    document.title = "Submit Business | HubEthio";

    apiGet("/api/categories")
      .then((data) => setCategories(data || []))
      .catch((err) => setError(err.message || "Failed to load categories"));
  }, []);

  function update(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

    try {
      await uploadImage(file, "imageUrl");
    } catch (err) {
      setError(err.message || "Banner upload failed");
    } finally {
      setUploadingBanner(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const ownerToken = localStorage.getItem("ownerToken");

      await apiPost(
        "/api/submissions",
        {
          title: form.title,
          categoryId: form.categoryId,
          businessHours: form.businessHours,
          phone: form.phone,
          whatsapp: form.whatsapp,
          website: form.website,
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          description_en: form.description_en,
          description_am: form.description_am,
          logoUrl: form.logoUrl,
          imageUrl: form.imageUrl,
          submittedBy: {
            name: form.submittedByName,
            contact: form.submittedByContact,
          },
        },
        ownerToken
      );

      setMessage("✅ Listing submitted successfully. Waiting for admin approval.");
      setForm(emptyForm);
    } catch (err) {
      setError(err.message || "Submit failed");
    }
  }

  const isUploading = uploadingLogo || uploadingBanner;

  return (
    <main className="submit-page">
      <div className="submit-container">
        <a href="/" className="submit-back-btn">
  ← Back Home
</a>

        <section className="submit-hero">
  <p className="submit-label">Business Submission</p>
  <h1>Submit Ethiopian Business / Service</h1>
  <p>
    Add your Ethiopian business or community service to HubEthio. After
    submission, your listing will be reviewed before it appears publicly.
  </p>
</section>

<div className="submit-benefits">
  <div className="submit-benefit">✅ Free Business Listing</div>
  <div className="submit-benefit">📍 Reach Ethiopian Customers</div>
  <div className="submit-benefit">📱 Mobile App Coming Soon</div>
  <div className="submit-benefit">⭐ Featured Listings Available</div>
</div>

<div className="submit-stats">
  <div className="submit-stat">
    <strong>7+</strong>
    <span>Businesses Listed</span>
  </div>

  <div className="submit-stat">
    <strong>10+</strong>
    <span>Business Owners</span>
  </div>

  <div className="submit-stat">
    <strong>30K+</strong>
    <span>People Reached</span>
  </div>
</div>

<div className="submit-trust">
  <h3>Why List on HubEthio?</h3>

  <ul>
    <li>✓ Free business listing</li>
    <li>✓ Reach Ethiopian customers across the USA</li>
    <li>✓ Google Maps directions included</li>
    <li>✓ WhatsApp contact support</li>
    <li>✓ Featured listing upgrades available</li>
  </ul>
</div>

{message && <div className="submit-success">{message}</div>}
        {error && <div className="submit-error">Error: {error}</div>}

        <form onSubmit={submit} className="submit-form">
          <section className="submit-section">
            <h2>Business Information</h2>

            <input
              name="title"
              value={form.title}
              onChange={update}
              placeholder="Business / Service Name *"
              required
            />

               <textarea
      name="businessHours"
      value={form.businessHours}
      onChange={update}
      placeholder="Business Hours: Mon–Fri 9AM–5PM, Sat 10AM–3PM"
    />

            <select
              name="categoryId"
              value={form.categoryId}
              onChange={update}
              required
            >
              <option value="">Select Category *</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.icon} {c.name_en}
                </option>
              ))}
            </select>

            <div className="submit-two-col">
              <input
                name="phone"
                value={form.phone}
                onChange={update}
                placeholder="Phone *"
                required
              />

              <input
                name="whatsapp"
                value={form.whatsapp}
                onChange={update}
                placeholder="WhatsApp optional"
              />
            </div>

            <input
              name="website"
              value={form.website}
              onChange={update}
              placeholder="Website optional"
            />
          </section>

          <section className="submit-section">
            <h2>Location</h2>

            <input
              name="address"
              value={form.address}
              onChange={update}
              placeholder="Address"
            />

            <div className="submit-three-col">
              <input
                name="city"
                value={form.city}
                onChange={update}
                placeholder="City *"
                required
              />

              <input
  type="text"
  placeholder="State * ex: VA"
  value={form.state}
  maxLength={2}
  onChange={(e) =>
    setForm({
      ...form,
      state: e.target.value.toUpperCase(),
    })
  }
  required
/>

              <input
                name="zip"
                value={form.zip}
                onChange={update}
                placeholder="ZIP"
              />
            </div>
          </section>

          <section className="submit-section">
            <h2>Images</h2>

            <div className="submit-upload-card">
              <label>Business Logo</label>
              <p>Recommended: square image, like 500x500.</p>

              <input type="file" accept="image/*" onChange={handleLogoUpload} />

              {uploadingLogo && <p className="submit-uploading">Uploading logo...</p>}

              {form.logoUrl && (
                <img
                  src={form.logoUrl}
                  alt="Business logo preview"
                  className="submit-logo-preview"
                />
              )}
            </div>

            <div className="submit-upload-card">
              <label>Business Banner Image</label>
              <p>Recommended: wide landscape image, like 1200x600.</p>

              <input type="file" accept="image/*" onChange={handleBannerUpload} />

              {uploadingBanner && (
                <p className="submit-uploading">Uploading banner...</p>
              )}

              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="Business banner preview"
                  className="submit-banner-preview"
                />
              )}
            </div>
          </section>

          <section className="submit-section">
            <h2>Description</h2>

            <textarea
              name="description_en"
              value={form.description_en}
              onChange={update}
              placeholder="Description English"
              rows="4"
            />

            <textarea
              name="description_am"
              value={form.description_am}
              onChange={update}
              placeholder="Description Amharic"
              rows="4"
            />
          </section>

          <section className="submit-section">
            <h2>Submitted By</h2>

            <div className="submit-two-col">
              <input
                name="submittedByName"
                value={form.submittedByName}
                onChange={update}
                placeholder="Your name"
              />

              <input
                name="submittedByContact"
                value={form.submittedByContact}
                onChange={update}
                placeholder="Your email or phone"
              />
            </div>
          </section>

          <button type="submit" className="submit-button" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Submit Listing"}
          </button>
        </form>
      </div>
    </main>
  );
}