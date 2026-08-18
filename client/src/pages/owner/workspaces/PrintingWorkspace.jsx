import React from "react";
import {
  apiGet,
  apiPatch,
} from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./PrintingWorkspace.css";

export default function PrintingWorkspace() {
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [
  printingRequests,
  setPrintingRequests,
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
      "Printing Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/printing";
      return;
    }

    async function loadPrintingListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const printingListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "printing-promotional-services"
        );

        setListings(printingListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Printing workspace.";

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
            "/owner/login?redirect=/owner/workspaces/printing";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    async function loadPrintingRequests() {
  try {
    setLoadingRequests(true);
    setRequestError("");

    const data = await apiGet(
      "/api/printing-service-requests/owner",
      token
    );

    setPrintingRequests(
      Array.isArray(data) ? data : []
    );
  } catch (err) {
    const message =
      err.message ||
      "Failed to load Printing service requests.";

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
        "/owner/login?redirect=/owner/workspaces/printing";

      return;
    }

    setRequestError(message);
  } finally {
    setLoadingRequests(false);
  }
}

    loadPrintingListings();
    loadPrintingRequests();
  }, [token]);

  async function updatePrintingRequestStatus(
  requestId,
  status,
  quoteAmount = null,
  quoteNotes = ""
) {
  try {
    setRequestError("");

    const data = await apiPatch(
      `/api/printing-service-requests/${requestId}/status`,
      {
        status,
        quoteAmount,
        quoteNotes,
      },
      token
    );

    setPrintingRequests((current) =>
      current.map((request) =>
        request._id === requestId
          ? data.request
          : request
      )
    );
  } catch (err) {
    console.error(
      "Printing service request update failed:",
      err
    );

    setRequestError(
      err.message ||
        "Failed to update Printing service request."
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

  const newRequestCount = printingRequests.filter(
  (request) => request.status === "New"
).length;

const quotedRequestCount = printingRequests.filter(
  (request) => request.status === "Quoted"
).length;

const approvedRequestCount = printingRequests.filter(
  (request) => request.status === "Approved"
).length;

const inProductionRequestCount = printingRequests.filter(
  (request) => request.status === "In Production"
).length;

const readyRequestCount = printingRequests.filter(
  (request) => request.status === "Ready"
).length;

const completedRequestCount = printingRequests.filter(
  (request) => request.status === "Completed"
).length;

  return (
    <WorkspaceLayout
      label="Printing Business Workspace"
      title="Printing & Promotional Services"
      icon="🖨️"
      description="Manage printing services, promotional products, customer contact options, and business activity."
    >
      {error && (
        <div className="printing-workspace-error">
          Error: {error}
        </div>
      )}

      {requestError && (
  <div className="printing-workspace-error">
    Error: {requestError}
  </div>
)}

      {loading && (
        <div className="printing-workspace-state">
          Loading Printing workspace...
        </div>
      )}

      {!loading &&
        listings.length === 0 && (
          <div className="printing-workspace-state">
            <h2>
              No Printing listings found
            </h2>

            <p>
              This workspace is available only
              to owners with a Printing &
              Promotional Services listing.
            </p>
          </div>
        )}

      {!loading &&
        listings.length > 0 && (
          <>
            <WorkspaceStats
              items={[
  {
    label: "New Requests",
    value: newRequestCount,
  },
  {
    label: "Quoted",
    value: quotedRequestCount,
  },
  {
    label: "Approved",
    value: approvedRequestCount,
  },
  {
    label: "In Production",
    value: inProductionRequestCount,
  },
  {
    label: "Ready",
    value: readyRequestCount,
  },
  {
    label: "Completed",
    value: completedRequestCount,
  },
]}
            />

            <section className="printing-workspace-grid">
              {listings.map(
                (listing) => (
                  <article
                    key={listing._id}
                    className="printing-workspace-card"
                  >
                    <div className="printing-workspace-card-header">
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

                      <span className="printing-workspace-status">
                        {listing.status ||
                          "pending"}
                      </span>
                    </div>

                    <div className="printing-workspace-info">
                      <div>
                        <strong>
                          Category
                        </strong>

                        <p>
                          {listing.categoryId
                            ?.name_en ||
                            "Printing & Promotional Services"}
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
                            "No printing service description added yet."}
                        </p>
                      </div>
                    </div>

                    <div className="printing-workspace-actions">
                      <a
                        href={`/owner/listings/edit/${listing._id}`}
                      >
                        Edit Printing Listing
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

            <section className="printing-request-section">
  <div className="printing-request-section-header">
    <div>
      <h2>Printing Service Requests</h2>

      <p>
        Review customer printing and promotional product
        requests.
      </p>
    </div>

    <span>
      {printingRequests.length} request
      {printingRequests.length !== 1 ? "s" : ""}
    </span>
  </div>

  {loadingRequests && (
    <div className="printing-workspace-state">
      Loading Printing service requests...
    </div>
  )}

  {!loadingRequests &&
    printingRequests.length === 0 && (
      <div className="printing-workspace-state">
        No Printing service requests yet.
      </div>
    )}

  {!loadingRequests &&
    printingRequests.length > 0 && (
      <div className="printing-request-grid">
        {printingRequests.map((request) => (
          <article
            key={request._id}
            className="printing-request-card"
          >
            <div className="printing-request-card-header">
              <div>
                <h3>
                  {request.customerName}
                </h3>

                <p>
                  {request.listingId?.title ||
                    "Printing Services"}
                </p>
              </div>

              <span className="printing-request-status">
                {request.status}
              </span>
            </div>

            <div className="printing-request-details">
              <div>
                <strong>Service Needed</strong>
                <p>
                  {request.serviceType ||
                    "Not specified"}
                </p>
              </div>

              <div>
                <strong>Product Type</strong>
                <p>
                  {request.productType ||
                    "Not specified"}
                </p>
              </div>

              <div>
                <strong>Quantity</strong>
                <p>
                  {request.quantity || 1}
                </p>
              </div>

              <div>
                <strong>Size / Specifications</strong>
                <p>
                  {request.sizeSpecifications ||
                    "Not specified"}
                </p>
              </div>

              <div>
                <strong>Color</strong>
                <p>
                  {request.colorOption ||
                    "Not specified"}
                </p>
              </div>

              <div>
                <strong>Finishing</strong>
                <p>
                  {request.finishingOptions ||
                    "Not specified"}
                </p>
              </div>

              <div>
                <strong>Needed By</strong>
                <p>
                  {request.neededByDate ||
                    "Not specified"}
                </p>
              </div>

              <div>
                <strong>Fulfillment</strong>
                <p>
                  {request.fulfillmentMethod ||
                    "Either"}
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

              <div className="printing-request-message">
                <strong>Project Details</strong>

                <p>
                  {request.message ||
                    "No additional project details provided."}
                </p>
              </div>
            </div>

            {request.status === "New" && (
  <div className="printing-request-actions">
    <button
      type="button"
      onClick={() => {
        setQuotingRequestId(request._id);
        setQuoteAmount("");
        setQuoteNotes("");
      }}
    >
      Create Quote
    </button>

    <button
      type="button"
      className="danger"
      onClick={() =>
        updatePrintingRequestStatus(
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
        updatePrintingRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
)}

{quotingRequestId === request._id && (
  <div className="printing-quote-panel">
    <div>
      <label>Quote Amount ($)</label>

      <input
        type="number"
        min="0"
        step="0.01"
        value={quoteAmount}
        onChange={(e) =>
          setQuoteAmount(e.target.value)
        }
        placeholder="Example: 125.00"
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
        placeholder="Add pricing details, turnaround time, artwork requirements, or other notes."
      />
    </div>

    <div className="printing-quote-actions">
      <button
        type="button"
        disabled={!quoteAmount}
        onClick={async () => {
          await updatePrintingRequestStatus(
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

 {request.status === "Approved" && (
  <div className="printing-request-actions">
    <button
      type="button"
      onClick={() =>
        updatePrintingRequestStatus(
          request._id,
          "In Production"
        )
      }
    >
      Start Production
    </button>

    <button
      type="button"
      className="secondary"
      onClick={() =>
        updatePrintingRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
)}

{request.status === "In Production" && (
  <div className="printing-request-actions">
    <button
      type="button"
      onClick={() =>
        updatePrintingRequestStatus(
          request._id,
          "Ready"
        )
      }
    >
      Mark Ready
    </button>

    <button
      type="button"
      className="secondary"
      onClick={() =>
        updatePrintingRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
)}

{request.status === "Ready" && (
  <div className="printing-request-actions">
    <button
      type="button"
      onClick={() =>
        updatePrintingRequestStatus(
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
        updatePrintingRequestStatus(
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
  <div className="printing-request-actions">
    <button
      type="button"
      className="secondary"
      onClick={() =>
        updatePrintingRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close Request
    </button>
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