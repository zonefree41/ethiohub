import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./CargoShippingWorkspace.css";

export default function CargoShippingWorkspace() {
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title =
      "Cargo & Shipping Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/cargo-shipping";
      return;
    }

    async function loadCargoListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const cargoListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "cargo-shipping-to-ethiopia"
        );

        setListings(cargoListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Cargo & Shipping workspace.";

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
            "/owner/login?redirect=/owner/workspaces/cargo-shipping";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadCargoListings();
  }, [token]);

  const approvedCount = listings.filter(
    (listing) =>
      listing.status === "approved"
  ).length;

  const featuredCount = listings.filter(
    (listing) =>
      listing.isFeatured
  ).length;

  const totalViews = listings.reduce(
    (total, listing) =>
      total +
      Number(
        listing.clicks?.views || 0
      ),
    0
  );

  return (
    <WorkspaceLayout
      label="Cargo & Shipping Workspace"
      title="Cargo & Shipping to Ethiopia"
      icon="📦"
      description="Manage cargo and shipping service listings, customer contact options, business information, and activity."
    >
      {error && (
        <div className="cargo-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="cargo-workspace-state">
          Loading Cargo & Shipping workspace...
        </div>
      )}

      {!loading &&
        listings.length === 0 && (
          <div className="cargo-workspace-state">
            <h2>
              No Cargo & Shipping listings found
            </h2>

            <p>
              This workspace is available only
              to owners with a Cargo & Shipping
              to Ethiopia listing.
            </p>
          </div>
        )}

      {!loading &&
        listings.length > 0 && (
          <>
            <WorkspaceStats
              items={[
                {
                  label:
                    "Cargo Listings",
                  value:
                    listings.length,
                },
                {
                  label:
                    "Approved Listings",
                  value:
                    approvedCount,
                },
                {
                  label:
                    "Featured Listings",
                  value:
                    featuredCount,
                },
                {
                  label:
                    "Total Views",
                  value:
                    totalViews,
                },
              ]}
            />

            <section className="cargo-workspace-grid">
              {listings.map(
                (listing) => (
                  <article
                    key={listing._id}
                    className="cargo-workspace-card"
                  >
                    <div className="cargo-workspace-card-header">
                      <div>
                        <h2>
                          {listing.title}
                        </h2>

                        <p>
                          {[
                            listing.city,
                            listing.state,
                          ]
                            .filter(Boolean)
                            .join(", ") ||
                            "Location unavailable"}
                        </p>
                      </div>

                      <span className="cargo-workspace-status">
                        {listing.status ||
                          "pending"}
                      </span>
                    </div>

                    <div className="cargo-workspace-info">
                      <div>
                        <strong>
                          Category
                        </strong>

                        <p>
                          {listing.categoryId
                            ?.name_en ||
                            "Cargo & Shipping to Ethiopia"}
                        </p>
                      </div>

                      <div>
                        <strong>
                          Phone
                        </strong>

                        <p>
                          {listing.phone ||
                            "Not provided"}
                        </p>
                      </div>

                      <div>
                        <strong>
                          Website
                        </strong>

                        <p>
                          {listing.website ||
                            "Not provided"}
                        </p>
                      </div>

                      <div>
                        <strong>
                          Description
                        </strong>

                        <p>
                          {listing.description_en ||
                            "No cargo or shipping description added yet."}
                        </p>
                      </div>
                    </div>

                    <div className="cargo-workspace-actions">
                      <a
                        href={`/owner/listings/edit/${listing._id}`}
                      >
                        Edit Cargo Listing
                      </a>

                      {listing.status ===
                        "approved" && (
                        <a
                          href={`/listing/${listing._id}`}
                        >
                          View Public Listing
                        </a>
                      )}
                    </div>
                  </article>
                )
              )}
            </section>
          </>
        )}
    </WorkspaceLayout>
  );
}