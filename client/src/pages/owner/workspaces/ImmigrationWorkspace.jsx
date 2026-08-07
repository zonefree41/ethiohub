import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./ImmigrationWorkspace.css";

export default function ImmigrationWorkspace() {
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title =
      "Immigration Lawyer Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/immigration";
      return;
    }

    async function loadImmigrationListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const immigrationListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "immigration-lawyer"
        );

        setListings(immigrationListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Immigration workspace.";

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
          localStorage.removeItem(
            "ownerToken"
          );

          localStorage.removeItem(
            "ownerUser"
          );

          window.location.href =
            "/owner/login?redirect=/owner/workspaces/immigration";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadImmigrationListings();
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
      label="Immigration Legal Workspace"
      title="Immigration Lawyer"
      icon="⚖️"
      description="Manage legal service listings, consultation information, client contact options, and business activity."
    >
      {error && (
        <div className="immigration-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="immigration-workspace-state">
          Loading Immigration workspace...
        </div>
      )}

      {!loading &&
        listings.length === 0 && (
          <div className="immigration-workspace-state">
            <h2>
              No Immigration Lawyer listings found
            </h2>

            <p>
              This workspace is available only
              to owners with an Immigration
              Lawyer listing.
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
                    "Immigration Listings",
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

            <section className="immigration-workspace-grid">
              {listings.map(
                (listing) => (
                  <article
                    key={listing._id}
                    className="immigration-workspace-card"
                  >
                    <div className="immigration-workspace-card-header">
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

                      <span className="immigration-workspace-status">
                        {listing.status ||
                          "pending"}
                      </span>
                    </div>

                    <div className="immigration-workspace-info">
                      <div>
                        <strong>
                          Category
                        </strong>

                        <p>
                          {listing.categoryId
                            ?.name_en ||
                            "Immigration Lawyer"}
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
                            "No legal service description added yet."}
                        </p>
                      </div>
                    </div>

                    <div className="immigration-workspace-actions">
                      <a
                        href={`/owner/listings/edit/${listing._id}`}
                      >
                        Edit Legal Listing
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