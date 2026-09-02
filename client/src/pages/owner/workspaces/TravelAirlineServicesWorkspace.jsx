import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./TravelAirlineServicesWorkspace.css";

export default function TravelAirlineServicesWorkspace() {
  const isIOSBuild = __IOS_BUILD__;
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title =
      "Travel & Airline Services Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/travel-airline-services";
      return;
    }

    async function loadTravelAirlineListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const travelAirlineListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "travel-airline-services"
        );

        setListings(travelAirlineListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Travel & Airline Services workspace.";

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
            "/owner/login?redirect=/owner/workspaces/travel-airline-services";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadTravelAirlineListings();
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
      label="Travel & Airline Services Workspace"
      title="Travel & Airline Services"
      icon="✈️"
      description="Manage airline and travel service listings, customer contact options, business information, and activity."
    >
      {error && (
        <div className="travel-airline-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="travel-airline-workspace-state">
          Loading Travel & Airline Services workspace...
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="travel-airline-workspace-state">
          <h2>
            No Travel & Airline Services listings found
          </h2>

          <p>
            This workspace is available only to owners
            with a Travel & Airline Services listing.
          </p>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <>
          <WorkspaceStats
            items={[
              {
                label: "Travel Listings",
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

          <section className="travel-airline-workspace-grid">
            {listings.map((listing) => (
              <article
                key={listing._id}
                className="travel-airline-workspace-card"
              >
                <div className="travel-airline-workspace-card-header">
                  <div>
                    <h2>{listing.title}</h2>

                    <p>
                      {[listing.city, listing.state]
                        .filter(Boolean)
                        .join(", ") ||
                        "Location unavailable"}
                    </p>
                  </div>

                  <span className="travel-airline-workspace-status">
                    {listing.status || "pending"}
                  </span>
                </div>

                <div className="travel-airline-workspace-info">
                  <div>
                    <strong>Category</strong>

                    <p>
                      {listing.categoryId?.name_en ||
                        "Travel & Airline Services"}
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
                        "No travel or airline service description added yet."}
                    </p>
                  </div>
                </div>

                <div className="travel-airline-workspace-actions">
                  <a
                    href={`/owner/listings/edit/${listing._id}`}
                  >
                    Edit Travel Listing
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