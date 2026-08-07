import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./EventsEntertainmentWorkspace.css";

export default function EventsEntertainmentWorkspace() {
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title =
      "Events & Entertainment Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/events-entertainment";
      return;
    }

    async function loadEventsListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const eventListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "events-entertainment"
        );

        setListings(eventListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Events & Entertainment workspace.";

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
            "/owner/login?redirect=/owner/workspaces/events-entertainment";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadEventsListings();
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
      label="Events Business Workspace"
      title="Events & Entertainment"
      icon="🎉"
      description="Manage event and entertainment service listings, customer contact options, business information, and activity."
    >
      {error && (
        <div className="events-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="events-workspace-state">
          Loading Events & Entertainment workspace...
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="events-workspace-state">
          <h2>No Events & Entertainment listings found</h2>

          <p>
            This workspace is available only to owners
            with an Events & Entertainment listing.
          </p>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <>
          <WorkspaceStats
            items={[
              {
                label: "Event Listings",
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

          <section className="events-workspace-grid">
            {listings.map((listing) => (
              <article
                key={listing._id}
                className="events-workspace-card"
              >
                <div className="events-workspace-card-header">
                  <div>
                    <h2>{listing.title}</h2>

                    <p>
                      {[listing.city, listing.state]
                        .filter(Boolean)
                        .join(", ") ||
                        "Location unavailable"}
                    </p>
                  </div>

                  <span className="events-workspace-status">
                    {listing.status || "pending"}
                  </span>
                </div>

                <div className="events-workspace-info">
                  <div>
                    <strong>Category</strong>
                    <p>
                      {listing.categoryId?.name_en ||
                        "Events & Entertainment"}
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
                        "No event or entertainment description added yet."}
                    </p>
                  </div>
                </div>

                <div className="events-workspace-actions">
                  <a
                    href={`/owner/listings/edit/${listing._id}`}
                  >
                    Edit Events Listing
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