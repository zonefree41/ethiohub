import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./BeautyWorkspace.css";

export default function BeautyWorkspace() {
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title = "Beauty Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/beauty";
      return;
    }

    async function loadBeautyListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const beautyListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "beauty-wellness"
        );

        setListings(beautyListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Beauty workspace.";

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
            "/owner/login?redirect=/owner/workspaces/beauty";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadBeautyListings();
  }, [token]);

  const totalServices = listings.reduce(
    (total, listing) =>
      total +
      (
        Array.isArray(
          listing.beautyServices
        )
          ? listing.beautyServices.length
          : 0
      ),
    0
  );

  const onlineBookingCount =
    listings.filter(
      (listing) =>
        Boolean(
          listing.beautyBookingUrl
        )
    ).length;

  const totalGalleryPhotos =
    listings.reduce(
      (total, listing) =>
        total +
        (
          Array.isArray(
            listing.beautyPhotos
          )
            ? listing.beautyPhotos.length
            : 0
        ),
      0
    );

  return (
    <WorkspaceLayout
      label="Beauty Business Workspace"
      title="Beauty & Wellness"
      icon="💄"
      description="Manage services, booking options, gallery, and customer engagement."
    >
      {error && (
        <div className="beauty-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="beauty-workspace-state">
          Loading Beauty workspace...
        </div>
      )}

      {!loading &&
        listings.length === 0 && (
          <div className="beauty-workspace-state">
            <h2>
              No Beauty listings found
            </h2>

            <p>
              This workspace is available
              only to owners with a Beauty
              & Wellness listing.
            </p>
          </div>
        )}

      {!loading &&
        listings.length > 0 && (
          <>

            <WorkspaceStats
  items={[
    {
      label: "Beauty Businesses",
      value: listings.length,
    },
    {
      label: "Total Services",
      value: totalServices,
    },
    {
      label: "Online Booking Enabled",
      value: onlineBookingCount,
    },
    {
      label: "Gallery Photos",
      value: totalGalleryPhotos,
    },
  ]}
/>

            <section className="beauty-workspace-grid">
              {listings.map(
                (listing) => (
                  <article
                    key={listing._id}
                    className="beauty-workspace-card"
                  >
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

                    <div>
                      <strong>
                        Services
                      </strong>

                      <p>
                        {Array.isArray(
                          listing.beautyServices
                        ) &&
                        listing.beautyServices
                          .length > 0
                          ? listing.beautyServices.join(
                              ", "
                            )
                          : "No services added yet"}
                      </p>
                    </div>

                    <div>
                      <strong>
                        Starting Price
                      </strong>

                      <p>
                        {listing.beautyStartingPrice
                          ? `$${listing.beautyStartingPrice}`
                          : "Not provided"}
                      </p>
                    </div>

                    <div>
                      <strong>
                        Booking
                      </strong>

                      <p>
                        {listing.beautyBookingUrl
                          ? "Online booking enabled"
                          : "No booking link"}
                      </p>
                    </div>

                    <div className="beauty-workspace-actions">
                      <a
                        href={`/owner/listings/edit/${listing._id}`}
                      >
                        Edit Beauty Settings
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