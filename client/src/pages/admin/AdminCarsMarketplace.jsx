import React from "react";
import {
  apiGet,
  apiPatch,
} from "../../api/http.js";
import "./AdminCarsMarketplace.css";

const STATUS_OPTIONS = [
  "pending_review",
  "approved",
  "rejected",
  "sold",
  "expired",
];

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "$0";
  }

  return amount.toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }
  );
}

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

function getStatusLabel(status) {
  const labels = {
    pending_review: "Pending Review",
    approved: "Approved",
    rejected: "Rejected",
    sold: "Sold",
    expired: "Expired",
  };

  return labels[status] || status;
}

export default function AdminCarsMarketplace() {
  const token =
    localStorage.getItem("adminToken");

  const [vehicles, setVehicles] =
    React.useState([]);

  const [status, setStatus] =
    React.useState("pending_review");

  const [loading, setLoading] =
    React.useState(false);

  const [processingId, setProcessingId] =
    React.useState("");

  const [error, setError] =
    React.useState("");

  const [message, setMessage] =
    React.useState("");

  React.useEffect(() => {
    document.title =
      "Cars Marketplace Admin | HubEthio";

    if (!token) {
      window.location.href =
        "/admin/login";
    }
  }, [token]);

  async function loadVehicles(
    nextStatus = status
  ) {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet(
        `/api/admin/cars?status=${nextStatus}`,
        token
      );

      setVehicles(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to load vehicle listings."
      );
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (token) {
      loadVehicles(status);
    }
  }, [status]);

  async function approveVehicle(vehicleId) {
    const confirmed = window.confirm(
      "Approve this vehicle listing?"
    );

    if (!confirmed) return;

    try {
      setProcessingId(vehicleId);
      setError("");
      setMessage("");

      const result = await apiPatch(
        `/api/admin/cars/${vehicleId}/approve`,
        {},
        token
      );

      setMessage(
        result.message ||
          "Vehicle listing approved."
      );

      await loadVehicles();
    } catch (err) {
      setError(
        err.message ||
          "Failed to approve vehicle."
      );
    } finally {
      setProcessingId("");
    }
  }

  async function rejectVehicle(vehicleId) {
    const reason = window.prompt(
      "Enter the reason for rejection:"
    );

    if (reason === null) return;

    if (!reason.trim()) {
      setError(
        "Rejection reason is required."
      );
      return;
    }

    try {
      setProcessingId(vehicleId);
      setError("");
      setMessage("");

      const result = await apiPatch(
        `/api/admin/cars/${vehicleId}/reject`,
        {
          rejectionReason:
            reason.trim(),
        },
        token
      );

      setMessage(
        result.message ||
          "Vehicle listing rejected."
      );

      await loadVehicles();
    } catch (err) {
      setError(
        err.message ||
          "Failed to reject vehicle."
      );
    } finally {
      setProcessingId("");
    }
  }

  return (
    <main className="admin-cars-page">
      <div className="admin-cars-container">
        <header className="admin-cars-hero">
          <div>
            <a
              href="/admin/dashboard"
              className="admin-cars-back"
            >
              ← Back to Admin Dashboard
            </a>

            <p className="admin-cars-kicker">
              HubEthio Admin
            </p>

            <h1>Cars Marketplace</h1>

            <p>
              Review paid vehicle listings
              before they appear publicly.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadVehicles(status)
            }
          >
            Refresh
          </button>
        </header>

        <section className="admin-cars-tabs">
          {STATUS_OPTIONS.map(
            (statusOption) => (
              <button
                key={statusOption}
                type="button"
                className={
                  status === statusOption
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setMessage("");
                  setError("");
                  setStatus(statusOption);
                }}
              >
                {getStatusLabel(
                  statusOption
                )}
              </button>
            )
          )}
        </section>

        {message && (
          <div className="admin-cars-success">
            {message}
          </div>
        )}

        {error && (
          <div className="admin-cars-error">
            {error}
          </div>
        )}

        {loading && (
          <section className="admin-cars-state">
            <h2>
              Loading vehicle listings...
            </h2>
          </section>
        )}

        {!loading &&
          vehicles.length === 0 && (
            <section className="admin-cars-state">
              <h2>
                No {getStatusLabel(status)}
                {" "}vehicles
              </h2>

              <p>
                Vehicle listings in this
                status will appear here.
              </p>
            </section>
          )}

        {!loading &&
          vehicles.length > 0 && (
            <section className="admin-cars-grid">
              {vehicles.map((vehicle) => (
                <article
                  key={vehicle._id}
                  className="admin-car-card"
                >
                  {vehicle.photos?.[0] ? (
                    <img
                      src={vehicle.photos[0]}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      className="admin-car-image"
                    />
                  ) : (
                    <div className="admin-car-no-image">
                      🚗
                    </div>
                  )}

                  <div className="admin-car-body">
                    <div className="admin-car-heading">
                      <div>
                        <h2>
                          {vehicle.year}{" "}
                          {vehicle.make}{" "}
                          {vehicle.model}
                        </h2>

                        {vehicle.trim && (
                          <p>
                            {vehicle.trim}
                          </p>
                        )}
                      </div>

                      <span className="admin-car-status">
                        {getStatusLabel(
                          vehicle.status
                        )}
                      </span>
                    </div>

                    <strong className="admin-car-price">
                      {formatMoney(
                        vehicle.price
                      )}
                    </strong>

                    <div className="admin-car-details">
                      <p>
                        <strong>
                          Mileage:
                        </strong>{" "}
                        {Number(
                          vehicle.mileage || 0
                        ).toLocaleString()}{" "}
                        miles
                      </p>

                      <p>
                        <strong>
                          Location:
                        </strong>{" "}
                        {vehicle.city},{" "}
                        {vehicle.state}
                      </p>

                      <p>
                        <strong>
                          Seller:
                        </strong>{" "}
                        {vehicle.sellerName}
                      </p>

                      <p>
                        <strong>
                          Seller Type:
                        </strong>{" "}
                        {vehicle.sellerType}
                      </p>

                      <p>
                        <strong>
                          Email:
                        </strong>{" "}
                        {vehicle.sellerEmail}
                      </p>

                      <p>
                        <strong>
                          Phone:
                        </strong>{" "}
                        {vehicle.sellerPhone}
                      </p>

                      <p>
                        <strong>
                          Payment:
                        </strong>{" "}
                        {vehicle.paymentStatus}
                      </p>

                      <p>
                        <strong>
                          Paid:
                        </strong>{" "}
                        {formatDate(
                          vehicle.paidAt
                        )}
                      </p>

                      <p>
                        <strong>
                          Condition:
                        </strong>{" "}
                        {vehicle.condition ||
                          "N/A"}
                      </p>

                      <p>
                        <strong>
                          Title:
                        </strong>{" "}
                        {vehicle.titleStatus ||
                          "N/A"}
                      </p>

                      {vehicle.vin && (
                        <p>
                          <strong>
                            VIN:
                          </strong>{" "}
                          {vehicle.vin}
                        </p>
                      )}

                      {vehicle.description && (
                        <p>
                          <strong>
                            Description:
                          </strong>{" "}
                          {
                            vehicle.description
                          }
                        </p>
                      )}

                      {vehicle.rejectionReason && (
                        <p className="admin-car-rejection">
                          <strong>
                            Rejection Reason:
                          </strong>{" "}
                          {
                            vehicle.rejectionReason
                          }
                        </p>
                      )}
                    </div>

                    {status ===
                      "pending_review" && (
                      <div className="admin-car-actions">
                        <button
                          type="button"
                          className="admin-car-approve"
                          disabled={
                            processingId ===
                            vehicle._id
                          }
                          onClick={() =>
                            approveVehicle(
                              vehicle._id
                            )
                          }
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          className="admin-car-reject"
                          disabled={
                            processingId ===
                            vehicle._id
                          }
                          onClick={() =>
                            rejectVehicle(
                              vehicle._id
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}
      </div>
    </main>
  );
}