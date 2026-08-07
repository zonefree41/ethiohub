import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./HousingWorkspace.css";

export default function HousingWorkspace() {
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title = "Housing Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/housing";
      return;
    }

    async function loadHousingListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const housingListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "housing-rentals"
        );

        setListings(housingListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Housing workspace.";

        const normalizedMessage =
          message.toLowerCase();

        const unauthorized =
          normalizedMessage.includes(
            "invalid or expired token"
          ) ||
          normalizedMessage.includes(
            "unauthorized"
          ) ||
          message.includes("401");

        if (unauthorized) {
          localStorage.removeItem("ownerToken");
          localStorage.removeItem("ownerUser");

          window.location.href =
            "/owner/login?redirect=/owner/workspaces/housing";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadHousingListings();
  }, [token]);

  const approvedCount = listings.filter(
    (listing) => listing.status === "approved"
  ).length;

  const featuredCount = listings.filter(
    (listing) => listing.isFeatured
  ).length;

  const totalViews = listings.reduce(
    (total, listing) =>
      total + Number(listing.clicks?.views || 0),
    0
  );

  return (
    <WorkspaceLayout
      label="Housing Business Workspace"
      title="Housing & Rentals"
      icon="🏠"
      description="Manage rental listings, housing details, availability, and customer interest."
    >
      {error && (
        <div className="housing-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="housing-workspace-state">
          Loading Housing workspace...
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="housing-workspace-state">
          <h2>No Housing listings found</h2>

          <p>
            This workspace is available only to owners
            with a Housing & Rentals listing.
          </p>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <>
          <WorkspaceStats
            items={[
              {
                label: "Housing Listings",
                value: listings.length,
              },
              {
                label: "Approved Listings",
                value: approvedCount,
              },
              {
                label: "Featured Listings",
                value: featuredCount,
              },
              {
                label: "Total Views",
                value: totalViews,
              },
            ]}
          />

          <section className="housing-workspace-grid">
            {listings.map((listing) => (
              <article
                key={listing._id}
                className="housing-workspace-card"
              >
                <div className="housing-workspace-card-header">
                  <div>
                    <h2>{listing.title}</h2>

                    <p>
                      {[listing.city, listing.state]
                        .filter(Boolean)
                        .join(", ") ||
                        "Location unavailable"}
                    </p>
                  </div>

                  <span className="housing-workspace-status">
                    {listing.status || "pending"}
                  </span>
                </div>

                <div className="housing-workspace-info">
                  <div>
                    <strong>Category</strong>
                    <p>
                      {listing.categoryId?.name_en ||
                        "Housing & Rentals"}
                    </p>
                  </div>

                  <div>
                    <strong>Featured</strong>
                    <p>
                      {listing.isFeatured ? "Yes" : "No"}
                    </p>
                  </div>

                  <div>
                    <strong>Views</strong>
                    <p>{listing.clicks?.views || 0}</p>
                  </div>

                  <div>
                    <strong>Description</strong>
                    <p>
                      {listing.description_en ||
                        "No housing description added yet."}
                    </p>
                  </div>
                </div>

                <div className="housing-workspace-actions">
                  <a
                    href={`/owner/listings/edit/${listing._id}`}
                  >
                    Edit Housing Listing
                  </a>

                  {listing.status === "approved" && (
                    <a href={`/listing/${listing._id}`}>
                      View Public Listing
                    </a>
                  )}
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </WorkspaceLayout>
  );
}