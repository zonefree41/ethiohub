import React from "react";

export default function TravelWorkspaceSummary({
  travelRequests,
  loadingTravelRequests,
  formatDate,
}) {
  return (
    <section className="owner-transport-requests-section owner-travel-requests-section">
      <div className="owner-travel-summary-header">
        <div>
          <h2>✈️ Travel Requests</h2>

          <p>
            Review traveler requests, quotes, and booking progress.
          </p>
        </div>

        <a
          href="/owner/travel-requests"
          className="owner-travel-manage-link"
        >
          Manage Travel Requests →
        </a>
      </div>

      {loadingTravelRequests ? (
        <p>Loading travel requests...</p>
      ) : travelRequests.length === 0 ? (
        <div className="owner-travel-empty-summary">
          <p>No travel requests yet.</p>

          <a href="/owner/travel-requests">
            Open Travel Dashboard
          </a>
        </div>
      ) : (
        <>
          <div className="owner-travel-summary-stats">
            <div>
              <span>📋</span>
              <strong>{travelRequests.length}</strong>
              <p>Total Requests</p>
            </div>

            <div>
              <span>🟢</span>
              <strong>
                {
                  travelRequests.filter(
                    (request) =>
                      request.status === "New"
                  ).length
                }
              </strong>
              <p>New</p>
            </div>

            <div>
              <span>💰</span>
              <strong>
                {
                  travelRequests.filter(
                    (request) =>
                      request.status === "Quoted"
                  ).length
                }
              </strong>
              <p>Quoted</p>
            </div>

            <div>
              <span>🎫</span>
              <strong>
                {
                  travelRequests.filter(
                    (request) =>
                      request.status === "Booked"
                  ).length
                }
              </strong>
              <p>Booked</p>
            </div>
          </div>

          <div className="owner-travel-recent-list">
            {travelRequests
              .slice(0, 3)
              .map((request) => (
                <article
                  key={request._id}
                  className="owner-travel-recent-card"
                >
                  <div>
                    <h3>
                      {request.customerName ||
                        "Unknown Traveler"}
                    </h3>

                    <p>
                      {request.departureCity ||
                        "Departure not provided"}
                      {" → "}
                      {request.destinationCity ||
                        "Destination not provided"}
                    </p>
                  </div>

                  <div className="owner-travel-recent-meta">
                    <span
                      className={`owner-travel-recent-status status-${String(
                        request.status || "New"
                      )
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {request.status || "New"}
                    </span>

                    <small>
                      {formatDate(
                        request.departureDate
                      )}
                    </small>
                  </div>
                </article>
              ))}
          </div>

          <a
            href="/owner/travel-requests"
            className="owner-travel-view-all"
          >
            View All Travel Requests
          </a>
        </>
      )}
    </section>
  );
}