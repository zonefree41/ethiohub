import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./NotaryWorkspace.css";

export default function NotaryWorkspace() {
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title = "Notary Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/notary";
      return;
    }

    async function loadNotaryListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const notaryListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug === "notary"
        );

        setListings(notaryListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Notary workspace.";

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
            "/owner/login?redirect=/owner/workspaces/notary";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadNotaryListings();
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
      label="Notary Business Workspace"
      title="Notary"
      icon="🖋️"
      description="Manage notary service listings, customer contact options, business information, and activity."
    >
      {error && (
        <div className="notary-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="notary-workspace-state">
          Loading Notary workspace...
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="notary-workspace-state">
          <h2>No Notary listings found</h2>

          <p>
            This workspace is available only to owners
            with a Notary listing.
          </p>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <>
          <WorkspaceStats
            items={[
              {
                label: "Notary Listings",
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

          <section className="notary-workspace-grid">
            {listings.map((listing) => (
              <article
                key={listing._id}
                className="notary-workspace-card"
              >
                <div className="notary-workspace-card-header">
                  <div>
                    <h2>{listing.title}</h2>

                    <p>
                      {[listing.city, listing.state]
                        .filter(Boolean)
                        .join(", ") ||
                        "Location unavailable"}
                    </p>
                  </div>

                  <span className="notary-workspace-status">
                    {listing.status || "pending"}
                  </span>
                </div>

                <div className="notary-workspace-info">
                  <div>
                    <strong>Category</strong>

                    <p>
                      {listing.categoryId?.name_en ||
                        "Notary"}
                    </p>
                  </div>

                  <div>
                    <strong>Phone</strong>

                    <p>
                      {listing.phone ||
                        "Not provided"}
                    </p>
                  </div>

                  <div>
                    <strong>Website</strong>

                    <p>
                      {listing.website ||
                        "Not provided"}
                    </p>
                  </div>

                  <div>
                    <strong>Description</strong>

                    <p>
                      {listing.description_en ||
                        "No notary service description added yet."}
                    </p>
                  </div>
                </div>

                <div className="notary-workspace-actions">
                  <a
                    href={`/owner/listings/edit/${listing._id}`}
                  >
                    Edit Notary Listing
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