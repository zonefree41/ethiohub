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
  imageUrl: "",
};

export default function Submit() {
  const [categories, setCategories] = React.useState([]);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);

  React.useEffect(() => {
    apiGet("/api/categories")
      .then(setCategories)
      .catch((err) => setError(err.message));
  }, []);

  function update(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    setError("");

    try {
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
        imageUrl: data.url,
      }));
    } catch (err) {
      console.error(err);
      setError(err.message || "Image upload failed");
    } finally {
      setUploading(false);
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

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>
            Business Image / Logo
          </label>

          <input type="file" accept="image/*" onChange={handleImageUpload} />

          {uploading && <p>Uploading image...</p>}

          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="Business preview"
              style={{
                width: "100%",
                maxWidth: 250,
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

        <button type="submit" style={{ padding: 12 }} disabled={uploading}>
          {uploading ? "Uploading..." : "Submit Listing"}
        </button>
      </form>
    </div>
  );
}