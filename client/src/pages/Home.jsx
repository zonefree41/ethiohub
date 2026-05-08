import React from "react";
import { apiGet } from "../api/http.js";

export default function Home() {
  const [categories, setCategories] = React.useState([]);
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
    "Arlington"
  ];

  const suggestions = [
    ...categories.map((c) => c.name_en),
    ...categories.map((c) => c.name_am),
    ...keywordSuggestions
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

    async function loadCategories() {
      try {
        setLoading(true);
        setError("");
        const data = await apiGet("/api/categories");
        if (alive) setCategories(data);
      } catch (err) {
        if (alive) setError(err.message || "Failed to load categories");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadCategories();

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
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
      <h1>Ethiopian Community Services</h1>
      <p style={{ color: "#555" }}>
        Find Ethiopian businesses, professionals, and community services near you.
      </p>

      <form
        onSubmit={goSearch}
        style={{
          display: "grid",
          gap: 10,
          padding: 14,
          border: "1px solid #eee",
          borderRadius: 12,
          marginTop: 14
        }}
      >
        <div style={{ position: "relative" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search: tax, lawyer, mechanic, restaurant..."
            style={{ padding: 12, width: "100%", boxSizing: "border-box" }}
          />

          {suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 46,
                left: 0,
                right: 0,
                background: "white",
                border: "1px solid #ddd",
                borderRadius: 10,
                zIndex: 20,
                overflow: "hidden"
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
                    cursor: "pointer"
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
          style={{ padding: 12 }}
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
            style={{ padding: 12, flex: 1, minWidth: 220 }}
          />

          <input
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State (VA/MD/DC)"
            style={{ padding: 12, width: 180 }}
          />
        </div>

        <button type="submit" style={{ padding: "12px 16px" }}>
          Search Services
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        <a href="/submit">
          <button style={{ padding: "10px 16px" }}>Add Your Business</button>
        </a>
      </div>

      <h2 style={{ marginTop: 22 }}>Categories</h2>

      {loading && <p>Loading categories...</p>}

      {error && (
        <div style={{ padding: 12, border: "1px solid red", borderRadius: 10 }}>
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12
          }}
        >
          {categories.map((c) => (
            <a
              key={c._id}
              href={`/category/${c.slug}`}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 14,
                textDecoration: "none",
                color: "inherit"
              }}
            >
              <div style={{ fontSize: 24 }}>{c.icon || "📌"}</div>
              <div style={{ fontWeight: 800, marginTop: 6 }}>{c.name_en}</div>
              <div style={{ color: "#666", marginTop: 4 }}>{c.name_am}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}