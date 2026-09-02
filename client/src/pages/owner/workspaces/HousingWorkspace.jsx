import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./HousingWorkspace.css";

export default function HousingWorkspace() {
  const isIOSBuild = __IOS_BUILD__;
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [housingInquiries, setHousingInquiries] =
  React.useState([]);

const [loadingInquiries, setLoadingInquiries] =
  React.useState(true);

const [inquiryError, setInquiryError] =
  React.useState("");

  React.useEffect(() => {
    document.title = "Housing Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/housing";
      return;
    }

    async function loadHousingInquiries() {
  try {
    setLoadingInquiries(true);
    setInquiryError("");

    const data = await apiGet(
      "/api/housing-inquiries/owner",
      token
    );

    setHousingInquiries(
      Array.isArray(data) ? data : []
    );
  } catch (err) {
    console.error(
      "Failed to load Housing inquiries:",
      err
    );

    setInquiryError(
      err.message ||
        "Failed to load Housing inquiries."
    );

    setHousingInquiries([]);
  } finally {
    setLoadingInquiries(false);
  }
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

    Promise.all([
  loadHousingListings(),
  loadHousingInquiries(),
]);
   
  }, [token]);

  async function updateHousingInquiryStatus(
  inquiryId,
  status
) {
  try {
    setInquiryError("");

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL ||
        "http://localhost:5001"
      }/api/housing-inquiries/${inquiryId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to update Housing inquiry."
      );
    }

    setHousingInquiries((current) =>
      current.map((inquiry) =>
        inquiry._id === inquiryId
          ? data.inquiry
          : inquiry
      )
    );
  } catch (err) {
    console.error(
      "Housing inquiry update failed:",
      err
    );

    setInquiryError(
      err.message ||
        "Failed to update Housing inquiry."
    );
  }
}

async function updateHousingAvailability(
  listingId,
  availabilityStatus
) {
  try {
    setError("");

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL ||
        "http://localhost:5001"
      }/api/owner/listings/${listingId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          availabilityStatus,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to update Housing availability."
      );
    }

    setListings((current) =>
      current.map((listing) =>
        listing._id === listingId
          ? {
              ...listing,
              availabilityStatus:
                data.listing?.availabilityStatus ||
                availabilityStatus,
            }
          : listing
      )
    );
  } catch (err) {
    console.error(
      "Housing availability update failed:",
      err
    );

    setError(
      err.message ||
        "Failed to update Housing availability."
    );
  }
}

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


  const totalInquiries =
  housingInquiries.length;

const newInquiries =
  housingInquiries.filter(
    (item) => item.status === "New"
  ).length;

const contactedInquiries =
  housingInquiries.filter(
    (item) => item.status === "Contacted"
  ).length;

const viewingScheduledInquiries =
  housingInquiries.filter(
    (item) =>
      item.status === "Viewing Scheduled"
  ).length;

const applicationInquiries =
  housingInquiries.filter(
    (item) => item.status === "Application"
  ).length;

const approvedInquiries =
  housingInquiries.filter(
    (item) => item.status === "Approved"
  ).length;

const moveInScheduledInquiries =
  housingInquiries.filter(
    (item) =>
      item.status === "Move-In Scheduled"
  ).length;

const completedInquiries =
  housingInquiries.filter(
    (item) => item.status === "Completed"
  ).length;

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

          <WorkspaceStats
  items={[
  {
    label: "Total Inquiries",
    value: totalInquiries,
  },
  {
    label: "New",
    value: newInquiries,
  },
  {
    label: "Contacted",
    value: contactedInquiries,
  },
  {
    label: "Viewing",
    value: viewingScheduledInquiries,
  },
  {
    label: "Application",
    value: applicationInquiries,
  },
  {
    label: "Approved",
    value: approvedInquiries,
  },
  {
    label: "Move-In Scheduled",
    value: moveInScheduledInquiries,
  },
  {
    label: "Completed",
    value: completedInquiries,
  },
]}
/>

<section className="housing-inquiries-section">
  <div className="housing-inquiries-header">
    <div>
      <h2>Recent Housing Inquiries</h2>
      <p>
        Review renter inquiries and track their status.
      </p>
    </div>
  </div>

  {inquiryError && (
    <div className="housing-workspace-error">
      Error: {inquiryError}
    </div>
  )}

  {loadingInquiries ? (
    <div className="housing-workspace-state">
      Loading Housing inquiries...
    </div>
  ) : housingInquiries.length === 0 ? (
    <div className="housing-workspace-state">
      <h3>No Housing inquiries yet</h3>
      <p>
        New renter inquiries will appear here.
      </p>
    </div>
  ) : (
    <div className="housing-inquiries-list">
      {housingInquiries
        .slice(0, 5)
        .map((inquiry) => (
          <article
            key={inquiry._id}
            className="housing-inquiry-card"
          >
            <div className="housing-inquiry-card-top">
              <div>
                <h3>
                  {inquiry.customerName ||
                    "Unknown Renter"}
                </h3>

                <p>
                  {inquiry.listingId?.title ||
                    "Housing Listing"}
                </p>
              </div>

              <span
                className={`housing-inquiry-status status-${String(
                  inquiry.status || "New"
                )
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {inquiry.status || "New"}
              </span>
            </div>

            <div className="housing-inquiry-details">
              <div>
                <strong>Move-In Date</strong>
                <span>
                  {inquiry.desiredMoveInDate
                    ? new Date(
                        inquiry.desiredMoveInDate
                      ).toLocaleDateString(
                        undefined,
                        { timeZone: "UTC" }
                      )
                    : "Not provided"}
                </span>
              </div>

              <div>
                <strong>Occupants</strong>
                <span>
                  {inquiry.occupants || 1}
                </span>
              </div>

              <div>
  <strong>Monthly Budget</strong>
  <span>
    {inquiry.monthlyBudget != null
      ? `$${Number(
          inquiry.monthlyBudget
        ).toLocaleString()}`
      : "Not provided"}
  </span>
</div>

<div>
  <strong>Bedrooms Needed</strong>
  <span>
    {inquiry.bedroomsNeeded != null
      ? inquiry.bedroomsNeeded
      : "Not provided"}
  </span>
</div>

              <div>
                <strong>Phone</strong>
                <span>
                  {inquiry.customerPhone ||
                    "Not provided"}
                </span>
              </div>

              <div>
                <strong>Email</strong>
                <span>
                  {inquiry.customerEmail ||
                    "Not provided"}
                </span>
              </div>
            </div>

                               <div className="housing-v2-owner-preferences">
  <div>
    <strong>Pets</strong>
    <span>
      {inquiry.hasPets ? "Yes" : "No"}
    </span>
    <small>
      {inquiry.hasPets
        ? "Renter indicated that a pet will be part of the household."
        : "No pet indicated."}
    </small>
  </div>

  <div>
    <strong>Pet-Friendly Required</strong>
    <span>
      {inquiry.petFriendlyRequired
        ? "Yes"
        : "No"}
    </span>
    <small>
      {inquiry.petFriendlyRequired
        ? "Renter needs housing where pets are allowed."
        : "Pet-friendly housing was not marked as required."}
    </small>
  </div>

  <div>
    <strong>Open to Nearby Areas</strong>
    <span>
      {inquiry.openToNearbyAreas
        ? "Yes"
        : "No"}
    </span>
    <small>
      {inquiry.openToNearbyAreas
        ? "Renter is willing to consider nearby locations."
        : "Renter did not indicate flexibility for nearby areas."}
    </small>
  </div>

  <div>
    <strong>Urgent Housing</strong>
    <span>
      {inquiry.urgentHousingNeeded
        ? "Yes"
        : "No"}
    </span>
    <small>
      {inquiry.urgentHousingNeeded
        ? "Renter indicated an urgent housing need."
        : "Housing was not marked urgent."}
    </small>
  </div>

  <div>
    <strong>
      Security Deposit Assistance
    </strong>
    <span>
      {inquiry.securityDepositAssistanceNeeded
        ? "Needed"
        : "Not requested"}
    </span>
    <small>
      {inquiry.securityDepositAssistanceNeeded
        ? "Renter may need information about legitimate deposit-assistance resources."
        : "No deposit assistance requested."}
    </small>
  </div>

  <div>
    <strong>Moving Assistance</strong>
    <span>
      {inquiry.movingAssistanceNeeded
        ? "Needed"
        : "Not requested"}
    </span>
    <small>
      {inquiry.movingAssistanceNeeded
        ? "Renter may need help coordinating or paying for moving services."
        : "No moving assistance requested."}
    </small>
  </div>
</div>

            {inquiry.message && (
              <div className="housing-inquiry-notes">
                <strong>Renter Message</strong>
                <p>{inquiry.message}</p>
              </div>
            )}

            {inquiry.ownerNotes && (
              <div className="housing-inquiry-notes">
                <strong>Owner Notes</strong>
                <p>{inquiry.ownerNotes}</p>
              </div>
            )}

            <div className="housing-inquiry-actions">
  {inquiry.status === "New" && (
    <>
      <button
        type="button"
        onClick={() =>
          updateHousingInquiryStatus(
            inquiry._id,
            "Contacted"
          )
        }
      >
        Mark Contacted
      </button>

      <button
        type="button"
        className="danger"
        onClick={() =>
          updateHousingInquiryStatus(
            inquiry._id,
            "Declined"
          )
        }
      >
        Decline
      </button>
    </>
  )}

  {inquiry.status === "Contacted" && (
    <>
      <button
        type="button"
        onClick={() =>
          updateHousingInquiryStatus(
            inquiry._id,
            "Viewing Scheduled"
          )
        }
      >
        Schedule Viewing
      </button>

      <button
        type="button"
        className="danger"
        onClick={() =>
          updateHousingInquiryStatus(
            inquiry._id,
            "Declined"
          )
        }
      >
        Decline
      </button>

      <button
        type="button"
        className="secondary"
        onClick={() =>
          updateHousingInquiryStatus(
            inquiry._id,
            "Closed"
          )
        }
      >
        Close
      </button>
    </>
  )}

  {inquiry.status === "Viewing Scheduled" && (
    <>
      <button
        type="button"
        onClick={() =>
          updateHousingInquiryStatus(
            inquiry._id,
            "Application"
          )
        }
      >
        Move to Application
      </button>

      <button
        type="button"
        className="danger"
        onClick={() =>
          updateHousingInquiryStatus(
            inquiry._id,
            "Declined"
          )
        }
      >
        Decline
      </button>

      <button
        type="button"
        className="secondary"
        onClick={() =>
          updateHousingInquiryStatus(
            inquiry._id,
            "Closed"
          )
        }
      >
        Close
      </button>
    </>
  )}

  {inquiry.status === "Application" && (
    <>
      <button
        type="button"
        onClick={() =>
          updateHousingInquiryStatus(
            inquiry._id,
            "Approved"
          )
        }
      >
        Approve
      </button>

      <button
        type="button"
        className="danger"
        onClick={() =>
          updateHousingInquiryStatus(
            inquiry._id,
            "Declined"
          )
        }
      >
        Decline
      </button>

      <button
        type="button"
        className="secondary"
        onClick={() =>
          updateHousingInquiryStatus(
            inquiry._id,
            "Closed"
          )
        }
      >
        Close
      </button>
    </>
  )}

  {inquiry.status === "Approved" && (
    <>
      <button
        type="button"
        onClick={() =>
          updateHousingInquiryStatus(
            inquiry._id,
            "Move-In Scheduled"
          )
        }
      >
        Schedule Move-In
      </button>

      <button
        type="button"
        className="secondary"
        onClick={() =>
          updateHousingInquiryStatus(
            inquiry._id,
            "Closed"
          )
        }
      >
        Close
      </button>
    </>
  )}

  {inquiry.status === "Move-In Scheduled" && (
    <>
      <button
        type="button"
        onClick={() =>
          updateHousingInquiryStatus(
            inquiry._id,
            "Completed"
          )
        }
      >
        Mark Completed
      </button>

      <button
        type="button"
        className="secondary"
        onClick={() =>
          updateHousingInquiryStatus(
            inquiry._id,
            "Closed"
          )
        }
      >
        Close
      </button>
    </>
  )}

  {inquiry.status === "Completed" && (
    <button
      type="button"
      className="secondary"
      onClick={() =>
        updateHousingInquiryStatus(
          inquiry._id,
          "Closed"
        )
      }
    >
      Close Inquiry
    </button>
  )}

  {inquiry.status === "Declined" && (
    <span className="housing-inquiry-final-state">
      Inquiry declined
    </span>
  )}

  {inquiry.status === "Closed" && (
    <span className="housing-inquiry-final-state">
      Inquiry closed
    </span>
  )}
</div>
          </article>
        ))}
    </div>
  )}
</section>

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

                  {!isIOSBuild && (
                    <div>
                      <strong>Featured</strong>
                      <p>
                        {listing.isFeatured ? "Yes" : "No"}
                      </p>
                    </div>
                  )}

                  <div>
  <strong>Availability</strong>
  <p>
    {listing.availabilityStatus === "rented"
      ? "Rented"
      : "Available"}
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