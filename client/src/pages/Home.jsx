import React from "react";
import { apiGet } from "../api/http.js";

export default function Home() {
  const [categories, setCategories] = React.useState([]);
  const [featuredListings, setFeaturedListings] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [categorySlug, setCategorySlug] = React.useState("all");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const keywordSuggestions = [
    "tax",
    "tax preparer",
    "lawyer",
    "immigration",
    "mechanic",
    "auto repair",
    "restaurant",
    "translator",
    "notary",
    "tutor",
    "insurance",
    "real estate",
    "Silver Spring",
    "Alexandria",
    "Falls Church",
    "Washington DC",
    "Arlington",
  ];

  const suggestions = [
    ...categories.map((c) => c.name_en),
    ...categories.map((c) => c.name_am),
    ...keywordSuggestions,
  ]
    .filter(
      (item) =>
        item &&
        search.trim().length > 0 &&
        item.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 8);

  React.useEffect(() => {
    let alive = true;

    async function loadHomeData() {
      try {
        setLoading(true);
        setError("");

        const [categoryData, listingData] = await Promise.all([
          apiGet("/api/categories"),
          apiGet("/api/listings?featured=true"),
        ]);

        if (!alive) return;

        setCategories(categoryData || []);
        setFeaturedListings(Array.isArray(listingData) ? listingData : []);
      } catch (err) {
        if (alive) setError(err.message || "Failed to load homepage");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadHomeData();

    return () => {
      alive = false;
    };
  }, []);

  function goSearch(e) {
    e.preventDefault();

    const url =
      `/category/${categorySlug || "all"}` +
      `?search=${encodeURIComponent(search)}` +
      `&city=${encodeURIComponent(city)}` +
      `&state=${encodeURIComponent(state)}`;

    window.location.href = url;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <section
        style={{
          padding: "34px 0 20px",
        }}
      >
        <h1 style={{ fontSize: 38, marginBottom: 8 }}>
          Ethiopian Community Services
        </h1>

        <p style={{ color: "#555", fontSize: 18 }}>
          Find Ethiopian businesses, professionals, and community services near you.
        </p>

        <form
          onSubmit={goSearch}
          style={{
            display: "grid",
            gap: 10,
            padding: 16,
            border: "1px solid #eee",
            borderRadius: 16,
            marginTop: 18,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            background: "#fff",
          }}
        >
          <div style={{ position: "relative" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search: tax, lawyer, mechanic, restaurant..."
              style={{
                padding: 14,
                width: "100%",
                boxSizing: "border-box",
                borderRadius: 10,
                border: "1px solid #ccc",
              }}
            />

            {suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 50,
                  left: 0,
                  right: 0,
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  zIndex: 20,
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                }}
              >
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSearch(s)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: 10,
                      border: "none",
                      background: "white",
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            style={{
              padding: 14,
              borderRadius: 10,
              border: "1px solid #ccc",
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.icon} {c.name_en}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City (ex: Silver Spring)"
              style={{
                padding: 14,
                flex: 1,
                minWidth: 220,
                borderRadius: 10,
                border: "1px solid #ccc",
              }}
            />

            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State (VA/MD/DC)"
              style={{
                padding: 14,
                width: 180,
                borderRadius: 10,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "14px 16px",
              borderRadius: 10,
              border: "none",
              background: "#111827",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Search Services
          </button>
        </form>

        <div style={{ marginTop: 14 }}>
          <a href="/submit">
            <button
              style={{
                padding: "12px 18px",
                borderRadius: 10,
                border: "1px solid #111827",
                background: "white",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Add Your Business
            </button>
          </a>
        </div>
      </section>

      {loading && <p>Loading...</p>}

      {error && (
        <div style={{ padding: 12, border: "1px solid red", borderRadius: 10 }}>
          Error: {error}
        </div>
      )}

      {!loading && !error && featuredListings.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <h2>⭐ Featured Businesses</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 18,
            }}
          >
            {featuredListings.slice(0, 6).map((l) => (
              <a
                key={l._id}
                href={`/listing/${l._id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <article
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 18,
                    overflow: "hidden",
                    background: "#fff",
                    boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                  }}
                >
                  {l.imageUrl ? (
                    <img
                      src={l.imageUrl}
                      alt={l.title}
                      style={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 180,
                        display: "grid",
                        placeItems: "center",
                        background: "#f3f4f6",
                        color: "#777",
                      }}
                    >
                      No image
                    </div>
                  )}

                  <div style={{ padding: 16 }}>
                    <div style={{ marginBottom: 10 }}>
                      <span
                        style={{
                          background: "#ffe082",
                          padding: "5px 10px",
                          borderRadius: 999,
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        ⭐ Featured
                      </span>
                    </div>

                    <h3 style={{ margin: "0 0 8px" }}>{l.title}</h3>

                    <p style={{ margin: "6px 0", color: "#555" }}>
                      {l.categoryId?.name_en || "Business"}
                    </p>

                    <p style={{ margin: "6px 0", color: "#555" }}>
                      {l.city}
                      {l.state ? `, ${l.state}` : ""}
                    </p>

                    <p style={{ color: "#444", marginTop: 10 }}>
                      {l.description_en?.slice(0, 100)}
                      {l.description_en?.length > 100 ? "..." : ""}
                    </p>
                  </div>
                </article>
              </a>
            ))}
          </div>
        </section>
      )}

      {!loading && !error && (
        <section style={{ marginTop: 30 }}>
          <h2>Categories</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {categories.map((c) => (
              <a
                key={c._id}
                href={`/category/${c.slug}`}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 14,
                  padding: 16,
                  textDecoration: "none",
                  color: "inherit",
                  background: "#fff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ fontSize: 26 }}>{c.icon || "📌"}</div>
                <div style={{ fontWeight: 800, marginTop: 6 }}>{c.name_en}</div>
                <div style={{ color: "#666", marginTop: 4 }}>{c.name_am}</div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}