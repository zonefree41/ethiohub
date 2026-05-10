import React from "react";
import { apiGet, apiPatch } from "../../api/http.js";
import { apiPost } from "../../api/http.js";

export default function AdminDashboard() {
  const token = localStorage.getItem("adminToken");
  const [status, setStatus] = React.useState("pending");
  const [items, setItems] = React.useState([]);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  async function load(nextStatus = status) {
    try {
      setError("");
      const data = await apiGet(`/api/admin/submissions?status=${nextStatus}`, token);
      setItems(data);
    } catch (err) {
      setError(err.message || "Failed to load listings");
    }
  }

  async function payFeatured(id) {
  try {
    const res = await apiPost("/api/payments/create-checkout-session", {
      listingId: id
    });
    window.location.assign(res.url);
  } catch {
  alert("Payment failed");
}
}

  React.useEffect(() => {
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }
    load(status);
  }, [status]);

  async function updateListing(id, patch) {
    try {
      setMessage("");
      setError("");
      await apiPatch(`/api/admin/listings/${id}`, patch, token);
      setMessage("✅ Listing updated");
      await load();
    } catch (err) {
      setError(err.message || "Update failed");
    }
  }

  function logout() {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login";
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/">← Home</a>
        <h1 style={{ flex: 1 }}>Admin Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </div>

      <div style={{ display: "flex", gap: 8, margin: "16px 0", flexWrap: "wrap" }}>
        {["pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setMessage("");
              setStatus(s);
            }}
            style={{
              padding: "10px 14px",
              fontWeight: status === s ? 800 : 400,
              border: status === s ? "2px solid black" : "1px solid #ccc"
            }}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      <h2>{status.toUpperCase()} Listings</h2>

      {message && <div style={{ border: "1px solid green", padding: 10, marginBottom: 10 }}>{message}</div>}
      {error && <div style={{ border: "1px solid red", padding: 10, marginBottom: 10 }}>Error: {error}</div>}

      {items.length === 0 && <p>No {status} listings.</p>}

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((item) => (
          <div key={item._id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
            <h3>
              {item.title}{" "}
              {item.isFeatured && <span>⭐</span>}{" "}
              {item.isVerified && <span>✅</span>}
            </h3>

            <p><b>Category:</b> {item.categoryId?.name_en}</p>
            <p><b>Status:</b> {item.status}</p>
            <p><b>Phone:</b> {item.phone}</p>
            <p><b>WhatsApp:</b> {item.whatsapp || "N/A"}</p>
            <p><b>Location:</b> {item.city}, {item.state} {item.zip}</p>
            <p><b>Description:</b> {item.description_en || "N/A"}</p>
            <p><b>Submitted by:</b> {item.submittedBy?.name || "N/A"} — {item.submittedBy?.contact || "N/A"}</p>
            <p>
  <b>Clicks:</b> 
  📞 {item.clicks?.call || 0} | 
  💬 {item.clicks?.whatsapp || 0} | 
  🌐 {item.clicks?.website || 0} | 
  📍 {item.clicks?.directions || 0}
</p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {item.status !== "approved" && (
                <button onClick={() => updateListing(item._id, { status: "approved" })} style={{ padding: 10 }}>
                  Approve
                </button>
              )}

              <button onClick={() => payFeatured(item._id)} style={{ padding: 10 }}>
  Pay to Feature ⭐
</button>

              {item.status !== "rejected" && (
                <button onClick={() => updateListing(item._id, { status: "rejected" })} style={{ padding: 10 }}>
                  Reject
                </button>
              )}

              {item.status !== "pending" && (
                <button onClick={() => updateListing(item._id, { status: "pending" })} style={{ padding: 10 }}>
                  Move to Pending
                </button>
              )}

              <button onClick={() => updateListing(item._id, { isFeatured: !item.isFeatured })} style={{ padding: 10 }}>
                {item.isFeatured ? "Remove Featured" : "Make Featured ⭐"}
              </button>

              <button onClick={() => updateListing(item._id, { isVerified: !item.isVerified })} style={{ padding: 10 }}>
                {item.isVerified ? "Remove Verified" : "Make Verified ✅"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}