import React from "react";

export default function TransportationWorkspaceSummary({
  transportationRequests,
  loadingRequests,
  formatDate,
}) {
  return (
    <section className="owner-transport-requests-section">
      <div className="owner-travel-summary-header">
        <div>
          <h2>🚚 Transportation Requests</h2>

          <p>
            Review customer transportation requests and job progress.
          </p>
        </div>

        <a
          href="/owner/transportation"
          className="owner-travel-manage-link"
        >
          Manage Transportation Requests →
        </a>
      </div>

      {loadingRequests ? (
        <p>Loading transportation requests...</p>
      ) : transportationRequests.length === 0 ? (
        <div className="owner-travel-empty-summary">
          <p>No transportation requests yet.</p>

          <a href="/owner/transportation">
            Open Transportation Dashboard
          </a>
        </div>
      ) : (
        <>
          <div className="owner-travel-summary-stats">
            <div>
              <span>📋</span>
              <strong>{transportationRequests.length}</strong>
              <p>Total Requests</p>
            </div>

            <div>
              <span>🟢</span>
              <strong>
                {
                  transportationRequests.filter(
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
                  transportationRequests.filter(
                    (request) =>
                      request.status === "Quoted"
                  ).length
                }
              </strong>
              <p>Quoted</p>
            </div>

            <div>
              <span>🚚</span>
              <strong>
                {
                  transportationRequests.filter(
                    (request) =>
                      request.status === "In Progress"
                  ).length
                }
              </strong>
              <p>In Progress</p>
            </div>
          </div>

          <div className="owner-travel-recent-list">
            {transportationRequests
              .slice(0, 3)
              .map((request) => (
                <article
                  key={request._id}
                  className="owner-travel-recent-card"
                >
                  <div>
                    <h3>
                      {request.customerName ||
                        "Unknown Customer"}
                    </h3>

                    <p>
                      {request.pickupAddress ||
                        "Pickup not provided"}
                      {" → "}
                      {request.deliveryAddress ||
                        "Delivery not provided"}
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
                        request.requestedDate
                      )}
                    </small>
                  </div>
                </article>
              ))}
          </div>

          <a
            href="/owner/transportation"
            className="owner-travel-view-all"
          >
            View All Transportation Requests
          </a>
        </>
      )}
    </section>
  );
}