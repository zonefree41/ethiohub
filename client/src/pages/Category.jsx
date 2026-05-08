import React from "react";
import { apiGet } from "../api/http.js";

function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name) || "";
}

export default function Category() {
  const slug = window.location.pathname.split("/").pop();
  const search = getParam("search");
  const city = getParam("city");
  const state = getParam("state");

  const [categories, setCategories] = React.useState([]);
  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const cats = await apiGet("/api/categories");
        if (!alive) return;
        setCategories(cats);

        let categoryId = "";
        if (slug !== "all") {
          const found = cats.find((c) => c.slug === slug);
          categoryId = found?._id || "";
        }

        const qs = new URLSearchParams();
        if (search) qs.set("search", search);
        if (city) qs.set("city", city);
        if (state) qs.set("state", state);
        if (categoryId) qs.set("category", categoryId);

        const data = await apiGet(`/api/listings?${qs.toString()}`);
        if (!alive) return;
        setListings(data);
      } catch (err) {
        if (alive) setError(err.message || "Failed to load listings");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [slug, search, city, state]);

  const title =
    slug === "all"
      ? "Search Results"
      : categories.find((c) => c.slug === slug)?.name_en || "Category";

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
      <a href="/">← Back Home</a>

      <h1 style={{ marginTop: 10 }}>{title}</h1>

      {(search || city || state) && (
        <p style={{ color: "#555" }}>
          {search && `Search: "${search}"`}{" "}
          {city && `| City: ${city}`}{" "}
          {state && `| State: ${state}`}
        </p>
      )}

      {loading && <p>Loading...</p>}

      {error && (
        <div style={{ border: "1px solid red", padding: 10 }}>
          Error: {error}
        </div>
      )}

      {!loading && !error && listings.length === 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>No results found</h3>
          <p>Try a different search or city.</p>
        </div>
      )}

      {!loading && !error && listings.length > 0 && (
        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          {listings.map((l) => (
            <div
              key={l._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 16
              }}
            >
              <h2>
                {l.title}{" "}
                {l.isFeatured && <span>⭐</span>}{" "}
                {l.isVerified && <span>✅</span>}
              </h2>

              <p style={{ color: "#666" }}>
                {l.city}, {l.state}
              </p>

              <p style={{ marginTop: 6 }}>
                {l.description_en || "No description available."}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 10
                }}
              >
                <a href={`tel:${l.phone}`}>
                  <button>Call</button>
                </a>

                {l.whatsapp && (
                  <a
                    href={`https://wa.me/${String(l.whatsapp).replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button>WhatsApp</button>
                  </a>
                )}

                <a href={`/listing/${l._id}`}>
                  <button>View Details</button>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}