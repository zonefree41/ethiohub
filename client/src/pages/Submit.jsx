import React from "react";
import { apiGet, apiPost } from "../api/http.js";

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
};

export default function Submit() {
  const [categories, setCategories] = React.useState([]);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [uploadingBanner, setUploadingBanner] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);

  React.useEffect(() => {
    apiGet("/api/categories")
      .then(setCategories)
      .catch((err) => setError(err.message));
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
      await apiPost("/api/submissions", {
        title: form.title,
        categoryId: form.categoryId,
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
      });

      setMessage("✅ Listing submitted successfully. Waiting for admin approval.");
      setForm(emptyForm);
    } catch (err) {
      setError(err.message || "Submit failed");
    }
  }

  const isUploading = uploadingLogo || uploadingBanner;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <a href="/">← Back Home</a>
      <h1>Submit Ethiopian Business / Service</h1>

      {message && (
        <div style={{ padding: 12, border: "1px solid green", marginBottom: 12 }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ padding: 12, border: "1px solid red", marginBottom: 12 }}>
          Error: {error}
        </div>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input
          name="title"
          value={form.title}
          onChange={update}
          placeholder="Business / Service Name *"
          required
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

        <input name="phone" value={form.phone} onChange={update} placeholder="Phone *" required />
        <input name="whatsapp" value={form.whatsapp} onChange={update} placeholder="WhatsApp optional" />
        <input name="website" value={form.website} onChange={update} placeholder="Website optional" />

        <input name="address" value={form.address} onChange={update} placeholder="Address" />
        <input name="city" value={form.city} onChange={update} placeholder="City *" required />
        <input name="state" value={form.state} onChange={update} placeholder="State * ex: VA, MD, DC" required />
        <input name="zip" value={form.zip} onChange={update} placeholder="ZIP" />

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
            Business Logo
          </label>

          <p style={{ marginTop: 0, color: "#666" }}>
            Recommended: square image, like 500x500.
          </p>

          <input type="file" accept="image/*" onChange={handleLogoUpload} />

          {uploadingLogo && <p>Uploading logo...</p>}

          {form.logoUrl && (
            <img
              src={form.logoUrl}
              alt="Business logo preview"
              style={{
                width: 110,
                height: 110,
                objectFit: "cover",
                marginTop: 12,
                borderRadius: "50%",
                border: "1px solid #ddd",
              }}
            />
          )}
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
            Business Banner Image
          </label>

          <p style={{ marginTop: 0, color: "#666" }}>
            Recommended: wide landscape image, like 1200x600.
          </p>

          <input type="file" accept="image/*" onChange={handleBannerUpload} />

          {uploadingBanner && <p>Uploading banner...</p>}

          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="Business banner preview"
              style={{
                width: "100%",
                maxWidth: 420,
                height: 180,
                objectFit: "cover",
                marginTop: 12,
                borderRadius: 12,
                border: "1px solid #ddd",
              }}
            />
          )}
        </div>

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

        <h3>Submitted By</h3>

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

        <button type="submit" style={{ padding: 12 }} disabled={isUploading}>
          {isUploading ? "Uploading..." : "Submit Listing"}
        </button>
      </form>
    </div>
  );
}