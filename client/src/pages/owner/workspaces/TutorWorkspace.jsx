import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./TutorWorkspace.css";

export default function TutorWorkspace() {
  const isIOSBuild = __IOS_BUILD__;
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title = "Tutor Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/tutor";
      return;
    }

    async function loadTutorListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const tutorListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug === "tutor"
        );

        setListings(tutorListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Tutor workspace.";

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
            "/owner/login?redirect=/owner/workspaces/tutor";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadTutorListings();
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
      label="Tutoring Business Workspace"
      title="Tutor"
      icon="👨‍🏫"
      description="Manage tutoring service listings, student contact options, business information, and activity."
    >
      {error && (
        <div className="tutor-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="tutor-workspace-state">
          Loading Tutor workspace...
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="tutor-workspace-state">
          <h2>No Tutor listings found</h2>

          <p>
            This workspace is available only to owners
            with a Tutor listing.
          </p>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <>
          <WorkspaceStats
            items={[
              {
                label: "Tutor Listings",
                value: listings.length,
              },
              {
                label: "Approved Listings",
                value: approvedCount,
              },
              ...(!isIOSBuild
                ? [
                    {
                      label: "Featured Listings",
                      value: featuredCount,
                    },
                  ]
                : []),
              {
                label: "Total Views",
                value: totalViews,
              },
            ]}
          />

          <section className="tutor-workspace-grid">
            {listings.map((listing) => (
              <article
                key={listing._id}
                className="tutor-workspace-card"
              >
                <div className="tutor-workspace-card-header">
                  <div>
                    <h2>{listing.title}</h2>

                    <p>
                      {[listing.city, listing.state]
                        .filter(Boolean)
                        .join(", ") ||
                        "Location unavailable"}
                    </p>
                  </div>

                  <span className="tutor-workspace-status">
                    {listing.status || "pending"}
                  </span>
                </div>

                <div className="tutor-workspace-info">
                  <div>
                    <strong>Category</strong>

                    <p>
                      {listing.categoryId?.name_en ||
                        "Tutor"}
                    </p>
                  </div>

                  <div>
                    <strong>Phone</strong>

                    <p>
                      {listing.phone || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <strong>Website</strong>

                    <p>
                      {listing.website || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <strong>Description</strong>

                    <p>
                      {listing.description_en ||
                        "No tutoring service description added yet."}
                    </p>
                  </div>
                </div>

                <div className="tutor-workspace-actions">
                  <a
                    href={`/owner/listings/edit/${listing._id}`}
                  >
                    Edit Tutor Listing
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