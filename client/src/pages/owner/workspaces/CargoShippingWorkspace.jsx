import React from "react";
import {
  apiGet,
  apiPatch,
} from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./CargoShippingWorkspace.css";

export default function CargoShippingWorkspace() {
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [
  cargoRequests,
  setCargoRequests,
] = React.useState([]);

const [
  loadingRequests,
  setLoadingRequests,
] = React.useState(true);

const [
  requestError,
  setRequestError,
] = React.useState("");

const [
  quotingRequestId,
  setQuotingRequestId,
] = React.useState(null);

const [
  quoteAmount,
  setQuoteAmount,
] = React.useState("");

const [
  quoteNotes,
  setQuoteNotes,
] = React.useState("");

  React.useEffect(() => {
    document.title =
      "Cargo & Shipping Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/cargo-shipping";
      return;
    }

    async function loadCargoRequests() {
  try {
    setLoadingRequests(true);
    setRequestError("");

    const data = await apiGet(
      "/api/cargo-shipping-requests/owner",
      token
    );

    setCargoRequests(
      Array.isArray(data) ? data : []
    );
  } catch (err) {
    const message =
      err.message ||
      "Failed to load Cargo & Shipping requests.";

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

    setRequestError(message);
  } finally {
    setLoadingRequests(false);
  }
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
loadCargoRequests();
  }, [token]);

  async function updateCargoRequestStatus(
  requestId,
  status,
  quoteAmount = null,
  quoteNotes = ""
) {
  try {
    setRequestError("");

    const data = await apiPatch(
      `/api/cargo-shipping-requests/${requestId}/status`,
      {
        status,
        quoteAmount,
        quoteNotes,
      },
      token
    );

    setCargoRequests((current) =>
      current.map((request) =>
        request._id === requestId
          ? data.request
          : request
      )
    );
  } catch (err) {
    console.error(
      "Cargo & Shipping request update failed:",
      err
    );

    setRequestError(
      err.message ||
        "Failed to update Cargo & Shipping request."
    );
  }
}

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

  const newRequestCount = cargoRequests.filter(
  (request) => request.status === "New"
).length;

const reviewingRequestCount = cargoRequests.filter(
  (request) => request.status === "Reviewing"
).length;

const quotedRequestCount = cargoRequests.filter(
  (request) => request.status === "Quoted"
).length;

const acceptedRequestCount = cargoRequests.filter(
  (request) => request.status === "Accepted"
).length;

const cargoReceivedRequestCount = cargoRequests.filter(
  (request) => request.status === "Cargo Received"
).length;

const inTransitRequestCount = cargoRequests.filter(
  (request) => request.status === "In Transit"
).length;

const arrivedRequestCount = cargoRequests.filter(
  (request) => request.status === "Arrived"
).length;

const completedRequestCount = cargoRequests.filter(
  (request) => request.status === "Completed"
).length;

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

      {requestError && (
  <div className="cargo-workspace-error">
    Error: {requestError}
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
    label: "New",
    value: newRequestCount,
  },
  {
    label: "Reviewing",
    value: reviewingRequestCount,
  },
  {
    label: "Quoted",
    value: quotedRequestCount,
  },
  {
    label: "Accepted",
    value: acceptedRequestCount,
  },
  {
    label: "Cargo Received",
    value: cargoReceivedRequestCount,
  },
  {
    label: "In Transit",
    value: inTransitRequestCount,
  },
  {
    label: "Arrived",
    value: arrivedRequestCount,
  },
  {
    label: "Completed",
    value: completedRequestCount,
  },
]}
> 
</WorkspaceStats>

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

            <section className="cargo-request-section">
  <div className="cargo-request-section-header">
    <div>
      <h2>Cargo & Shipping Requests</h2>

      <p>
        Review customer shipment requests,
        package details, destinations, and delivery needs.
      </p>
    </div>

    <span>
      {cargoRequests.length} request
      {cargoRequests.length !== 1 ? "s" : ""}
    </span>
  </div>

  {loadingRequests && (
    <div className="cargo-workspace-state">
      Loading Cargo & Shipping requests...
    </div>
  )}

  {!loadingRequests &&
    cargoRequests.length === 0 && (
      <div className="cargo-workspace-state">
        No Cargo & Shipping requests yet.
      </div>
    )}

  {!loadingRequests &&
    cargoRequests.length > 0 && (
      <div className="cargo-request-grid">
        {cargoRequests.map((request) => (
          <article
            key={request._id}
            className="cargo-request-card"
          >
            <div className="cargo-request-card-header">
              <div>
                <h3>{request.customerName}</h3>

                <p>
                  {request.listingId?.title ||
                    "Cargo & Shipping Provider"}
                </p>
              </div>

              <span className="cargo-request-status">
                {request.status}
              </span>
            </div>

            <div className="cargo-request-details">
              <div>
                <strong>Service Type</strong>
                <p>
                  {request.serviceType ||
                    "Not specified"}
                </p>
              </div>

              <div>
                <strong>Shipment</strong>
                <p>
                  {request.itemDescription ||
                    "Not specified"}
                </p>
              </div>

              <div>
                <strong>Origin</strong>
                <p>
                  {[
                    request.originCity,
                    request.originState,
                    request.originCountry,
                  ]
                    .filter(Boolean)
                    .join(", ") ||
                    "Not specified"}
                </p>
              </div>

              <div>
                <strong>Destination</strong>
                <p>
                  {[
                    request.destinationCity,
                    request.destinationCountry,
                  ]
                    .filter(Boolean)
                    .join(", ") ||
                    "Not specified"}
                </p>
              </div>

              <div>
                <strong>Packages</strong>
                <p>
                  {request.packageCount || 1}
                </p>
              </div>

              <div>
                <strong>Estimated Weight</strong>
                <p>
                  {request.estimatedWeight != null
                    ? `${request.estimatedWeight} ${
                        request.weightUnit || "lb"
                      }`
                    : "Not specified"}
                </p>
              </div>

              <div>
                <strong>Dimensions</strong>
                <p>
                  {request.dimensions ||
                    "Not specified"}
                </p>
              </div>

              <div>
                <strong>Desired Shipping Date</strong>
                <p>
                  {request.desiredShippingDate ||
                    "Not specified"}
                </p>
              </div>

              <div>
                <strong>Pickup Required</strong>
                <p>
                  {request.pickupRequired
                    ? "Yes"
                    : "No"}
                </p>
              </div>

              <div>
                <strong>Customs Assistance</strong>
                <p>
                  {request.customsAssistanceNeeded
                    ? "Yes"
                    : "No"}
                </p>
              </div>

              <div>
                <strong>Email</strong>
                <p>
                  <a
                    href={`mailto:${request.customerEmail}`}
                  >
                    {request.customerEmail}
                  </a>
                </p>
              </div>

              <div>
                <strong>Phone</strong>
                <p>
                  <a
                    href={`tel:${request.customerPhone}`}
                  >
                    {request.customerPhone}
                  </a>
                </p>
              </div>

              <div>
                <strong>Preferred Contact</strong>
                <p>
                  {request.preferredContactMethod ||
                    "Either"}
                </p>
              </div>

              <div className="cargo-request-message">
                <strong>Additional Message</strong>
                <p>
                  {request.message ||
                    "No additional message provided."}
                </p>
              </div>
            </div>

            {request.status === "New" && (
  <div className="cargo-request-actions">
    <button
      type="button"
      onClick={() =>
        updateCargoRequestStatus(
          request._id,
          "Reviewing"
        )
      }
    >
      Start Review
    </button>

    <button
      type="button"
      className="danger"
      onClick={() =>
        updateCargoRequestStatus(
          request._id,
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
        updateCargoRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
)}

{request.status === "Reviewing" && (
  <div className="cargo-request-actions">
    <button
      type="button"
      onClick={() => {
        setQuotingRequestId(request._id);
        setQuoteAmount("");
        setQuoteNotes("");
      }}
    >
      Send Quote
    </button>

    <button
      type="button"
      className="danger"
      onClick={() =>
        updateCargoRequestStatus(
          request._id,
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
        updateCargoRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
)}

{request.status === "Accepted" && (
  <div className="cargo-request-actions">
    <button
      type="button"
      onClick={() =>
        updateCargoRequestStatus(
          request._id,
          "Cargo Received"
        )
      }
    >
      Mark Cargo Received
    </button>

    <button
      type="button"
      className="secondary"
      onClick={() =>
        updateCargoRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
)}

{request.status === "Cargo Received" && (
  <div className="cargo-request-actions">
    <button
      type="button"
      onClick={() =>
        updateCargoRequestStatus(
          request._id,
          "In Transit"
        )
      }
    >
      Mark In Transit
    </button>

    <button
      type="button"
      className="secondary"
      onClick={() =>
        updateCargoRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
)}

{request.status === "In Transit" && (
  <div className="cargo-request-actions">
    <button
      type="button"
      onClick={() =>
        updateCargoRequestStatus(
          request._id,
          "Arrived"
        )
      }
    >
      Mark Arrived
    </button>

    <button
      type="button"
      className="secondary"
      onClick={() =>
        updateCargoRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
)}

{request.status === "Arrived" && (
  <div className="cargo-request-actions">
    <button
      type="button"
      onClick={() =>
        updateCargoRequestStatus(
          request._id,
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
        updateCargoRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
)}

{request.status === "Completed" && (
  <div className="cargo-request-actions">
    <button
      type="button"
      className="secondary"
      onClick={() =>
        updateCargoRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close Request
    </button>
  </div>
)}

{quotingRequestId === request._id && (
  <div className="cargo-quote-panel">
    <div>
      <label>Shipping Quote ($)</label>

      <input
        type="number"
        min="0"
        step="0.01"
        value={quoteAmount}
        onChange={(e) =>
          setQuoteAmount(e.target.value)
        }
        placeholder="Example: 250.00"
      />
    </div>

    <div>
      <label>Quote Notes</label>

      <textarea
        rows="3"
        value={quoteNotes}
        onChange={(e) =>
          setQuoteNotes(e.target.value)
        }
        placeholder="Add shipping method, estimated transit time, pickup information, customs requirements, or other quote details."
      />
    </div>

    <div className="cargo-quote-actions">
      <button
        type="button"
        disabled={!quoteAmount}
        onClick={async () => {
          await updateCargoRequestStatus(
            request._id,
            "Quoted",
            quoteAmount,
            quoteNotes
          );

          setQuotingRequestId(null);
          setQuoteAmount("");
          setQuoteNotes("");
        }}
      >
        Send Quote
      </button>

      <button
        type="button"
        className="secondary"
        onClick={() => {
          setQuotingRequestId(null);
          setQuoteAmount("");
          setQuoteNotes("");
        }}
      >
        Cancel
      </button>
    </div>
  </div>
)}
          </article>
        ))}
      </div>
    )}
</section>
          </>
        )}
    </WorkspaceLayout>
  );
}