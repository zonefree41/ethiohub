import React from "react";
import { apiGet, apiPatch } from "../../api/http.js";

export default function EditListing() {
  const token = localStorage.getItem("ownerToken");

  const id = window.location.pathname.split("/").pop();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [uploadingLogo, setUploadingLogo] = React.useState(false);
const [uploadingBanner, setUploadingBanner] = React.useState(false);

  const [form, setForm] = React.useState({
    title: "",
    phone: "",
    whatsapp: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    description_en: "",
    description_am: "",
    logoUrl: "",
    imageUrl: "",
  });

  function update(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
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

  async function loadListing() {
  try {
    setLoading(true);
    setError("");

    const data = await apiGet(`/api/listings/${id}`);

    setForm({
      title: data.title || "",
      phone: data.phone || "",
      whatsapp: data.whatsapp || "",
      website: data.website || "",
      address: data.address || "",
      city: data.city || "",
      state: data.state || "",
      zip: data.zip || "",
      description_en: data.description_en || "",
      description_am: data.description_am || "",
      logoUrl: data.logoUrl || "",
      imageUrl: data.imageUrl || "",
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
    setError("");
    setMessage("");

    await apiPatch(
      `/api/owner/listings/${id}`,
      form,
      token
    );

    setMessage(
      "✅ Listing updated successfully and sent for admin review."
    );
  } catch (err) {
    setError(err.message || "Failed to update listing");
  }
}

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
      <a href="/owner/dashboard">← Back to Dashboard</a>

      <h1>Edit Listing</h1>

      {loading && <p>Loading listing...</p>}

{error && (
  <div
    style={{
      border: "1px solid red",
      padding: 12,
      marginBottom: 16,
    }}
  >
    Error: {error}
  </div>
)}

{message && (
  <div
    style={{
      border: "1px solid green",
      padding: 12,
      marginBottom: 16,
    }}
  >
    {message}
  </div>
)}

<form
  onSubmit={submit}
  style={{
    display: "grid",
    gap: 14,
    marginTop: 20,
  }}
>
  <input
    name="title"
    placeholder="Business title"
    value={form.title}
    onChange={update}
    required
    style={{ padding: 12 }}
  />

  <input
    name="phone"
    placeholder="Phone"
    value={form.phone}
    onChange={update}
    required
    style={{ padding: 12 }}
  />

  <input
    name="whatsapp"
    placeholder="WhatsApp"
    value={form.whatsapp}
    onChange={update}
    style={{ padding: 12 }}
  />

  <input
    name="website"
    placeholder="Website"
    value={form.website}
    onChange={update}
    style={{ padding: 12 }}
  />

  <input
    name="address"
    placeholder="Address"
    value={form.address}
    onChange={update}
    style={{ padding: 12 }}
  />

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 10,
    }}
  >
    <input
      name="city"
      placeholder="City"
      value={form.city}
      onChange={update}
      style={{ padding: 12 }}
    />

    <input
      name="state"
      placeholder="State"
      value={form.state}
      onChange={update}
      style={{ padding: 12 }}
    />

    <input
      name="zip"
      placeholder="ZIP"
      value={form.zip}
      onChange={update}
      style={{ padding: 12 }}
    />
  </div>

  <textarea
    name="description_en"
    placeholder="English description"
    rows="5"
    value={form.description_en}
    onChange={update}
    style={{ padding: 12 }}
  />

  <textarea
    name="description_am"
    placeholder="Amharic description"
    rows="5"
    value={form.description_am}
    onChange={update}
    style={{ padding: 12 }}
  />

  <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
  <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
    Upload Business Logo
  </label>

  <input type="file" accept="image/*" onChange={handleLogoUpload} />

  {uploadingLogo && <p>Uploading logo...</p>}

  {form.logoUrl && (
    <img
      src={form.logoUrl}
      alt="Logo preview"
      style={{
        width: 90,
        height: 90,
        borderRadius: "50%",
        objectFit: "cover",
        marginTop: 12,
      }}
    />
  )}
</div>

<div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
  <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
    Upload Banner Image
  </label>

  <input type="file" accept="image/*" onChange={handleBannerUpload} />

  {uploadingBanner && <p>Uploading banner...</p>}

  {form.imageUrl && (
    <img
      src={form.imageUrl}
      alt="Banner preview"
      style={{
        width: "100%",
        maxHeight: 240,
        objectFit: "cover",
        borderRadius: 14,
        marginTop: 12,
      }}
    />
  )}
</div>

  {form.logoUrl && (
    <img
      src={form.logoUrl}
      alt="Logo preview"
      style={{
        width: 90,
        height: 90,
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  )}

  {form.imageUrl && (
    <img
      src={form.imageUrl}
      alt="Banner preview"
      style={{
        width: "100%",
        maxHeight: 240,
        objectFit: "cover",
        borderRadius: 14,
      }}
    />
  )}

  <button
  type="submit"
  disabled={uploadingLogo || uploadingBanner}
  style={{
    padding: 14,
    border: "none",
    borderRadius: 12,
    background: "#111827",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    opacity: uploadingLogo || uploadingBanner ? 0.7 : 1,
  }}
>
  {uploadingLogo || uploadingBanner
    ? "Uploading..."
    : "Save Changes"}
</button>
</form>
    </main>
  );
}