import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./TranslatorWorkspace.css";

export default function TranslatorWorkspace() {
  const isIOSBuild = __IOS_BUILD__;
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title =
      "Translator Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/translator";
      return;
    }

    async function loadTranslatorListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const translatorListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "translator"
        );

        setListings(translatorListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Translator workspace.";

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
            "/owner/login?redirect=/owner/workspaces/translator";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadTranslatorListings();
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
      label="Translation Business Workspace"
      title="Translator"
      icon="🗣️"
      description="Manage translation service listings, customer contact options, business information, and activity."
    >
      {error && (
        <div className="translator-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="translator-workspace-state">
          Loading Translator workspace...
        </div>
      )}

      {!loading &&
        listings.length === 0 && (
          <div className="translator-workspace-state">
            <h2>
              No Translator listings found
            </h2>

            <p>
              This workspace is available only
              to owners with a Translator listing.
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
                    "Translator Listings",
                  value:
                    listings.length,
                },
                {
                  label:
                    "Approved Listings",
                  value:
                    approvedCount,
                },
                ...(!isIOSBuild
                  ? [
                      {
                        label:
                          "Featured Listings",
                        value:
                          featuredCount,
                      },
                    ]
                  : []),
                {
                  label:
                    "Total Views",
                  value:
                    totalViews,
                },
              ]}
            />

            <section className="translator-workspace-grid">
              {listings.map(
                (listing) => (
                  <article
                    key={listing._id}
                    className="translator-workspace-card"
                  >
                    <div className="translator-workspace-card-header">
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

                      <span className="translator-workspace-status">
                        {listing.status ||
                          "pending"}
                      </span>
                    </div>

                    <div className="translator-workspace-info">
                      <div>
                        <strong>
                          Category
                        </strong>

                        <p>
                          {listing.categoryId
                            ?.name_en ||
                            "Translator"}
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
                            "No translation service description added yet."}
                        </p>
                      </div>
                    </div>

                    <div className="translator-workspace-actions">
                      <a
                        href={`/owner/listings/edit/${listing._id}`}
                      >
                        Edit Translator Listing
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