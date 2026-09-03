import React from "react";
import { Preferences } from "@capacitor/preferences";
import { apiGet } from "../api/http.js";
import "./Saved.css";

export default function Saved() {
  const [savedListings, setSavedListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    document.title = "Saved Businesses | HubEthio";

    async function loadSaved() {
  try {
    let savedIds = [];

    try {
      const result = await Preferences.get({
        key: "hubethioFavorites",
      });

      savedIds = result.value
        ? JSON.parse(result.value)
        : [];
    } catch {
      savedIds = JSON.parse(
        localStorage.getItem("hubethioFavorites") || "[]"
      );
    }

    if (savedIds.length === 0) {
      setSavedListings([]);
      return;
    }

    const results = await Promise.all(
      savedIds.map((id) =>
        apiGet(`/api/listings/${id}`).catch(() => null)
      )
    );

    setSavedListings(results.filter(Boolean));
  } finally {
    setLoading(false);
  }
}

    loadSaved();
  }, []);

  async function removeSaved(id) {
  let savedIds = [];

  try {
    const result = await Preferences.get({
      key: "hubethioFavorites",
    });

    savedIds = result.value
      ? JSON.parse(result.value)
      : [];

    const updated = savedIds.filter(
      (itemId) => itemId !== id
    );

    await Preferences.set({
      key: "hubethioFavorites",
      value: JSON.stringify(updated),
    });

    localStorage.setItem(
      "hubethioFavorites",
      JSON.stringify(updated)
    );

    setSavedListings((prev) =>
      prev.filter((item) => item._id !== id)
    );
  } catch (err) {
    console.error("Failed to remove saved business:", err);
  }
}

  return (
    <main className="saved-page">
      <div className="saved-container">
        <a href="/" className="saved-back">‹ Back to HubEthio</a>

        <header className="saved-header">
          <h1>Saved Businesses ❤️</h1>
          <p>Your favorite Ethiopian businesses saved on this device.</p>
        </header>

        {loading && <p>Loading saved businesses...</p>}

        {!loading && savedListings.length === 0 && (
          <div className="saved-empty">
            <h2>No saved businesses yet</h2>
            <p>Open a business listing and click “Save Business 🤍”.</p>
            <a href="/category/all">Browse Businesses</a>
          </div>
        )}

        {!loading && savedListings.length > 0 && (
          <section className="saved-grid">
            {savedListings.map((listing) => (
              <article key={listing._id} className="saved-card">
                {listing.imageUrl ? (
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="saved-card-img"
                  />
                ) : (
                  <div className="saved-card-placeholder">No image</div>
                )}

                <div className="saved-card-body">
                  <h2>{listing.title}</h2>
                  <p>{listing.categoryId?.name_en || "Business"}</p>
                  <p>
                    {[listing.city, listing.state].filter(Boolean).join(", ")}
                  </p>

                  <div className="saved-actions">
                    <a href={`/listing/${listing._id}`}>View</a>
                    <button
                      type="button"
                      onClick={() => removeSaved(listing._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}