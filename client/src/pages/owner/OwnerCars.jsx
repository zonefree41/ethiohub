import React from "react";
import { apiGet, apiPatch, apiPost } from "../../api/http.js";
import "./OwnerCars.css";

function statusLabel(status) {
  const labels = {
    payment_pending: "Payment Pending",
    pending_review: "Pending Review",
    approved: "Live",
    rejected: "Rejected",
    sold: "Sold",
    expired: "Expired",
    draft: "Draft",
  };

  return labels[status] || status;
}

function money(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function OwnerCars() {
  const isIOSBuild = __IOS_BUILD__;
  const token = localStorage.getItem("ownerToken");

    const [vehicles, setVehicles] = React.useState([]);

  const [inquiries, setInquiries] =
    React.useState([]);

  const [inquiriesLoading, setInquiriesLoading] =
    React.useState(true);

  const [
    inquiryProcessingId,
    setInquiryProcessingId,
  ] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [processingId, setProcessingId] =
    React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    document.title = "My Cars | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/my-cars";
      return;
    }

        loadCars();
    loadInquiries();
  }, []);

  async function loadInquiries() {
    try {
      setInquiriesLoading(true);

      const data = await apiGet(
        "/api/cars/mine/inquiries",
        token
      );

      setInquiries(
        Array.isArray(data?.inquiries)
          ? data.inquiries
          : []
      );
    } catch (err) {
      console.error(
        "Load vehicle inquiries failed:",
        err
      );

      const text =
        err.message ||
        "Unable to load buyer inquiries.";

      if (
        text.toLowerCase().includes("login") ||
        text.toLowerCase().includes("token") ||
        text.includes("401")
      ) {
        localStorage.removeItem("ownerToken");
        localStorage.removeItem("ownerUser");

        window.location.href =
          "/owner/login?redirect=/owner/my-cars";

        return;
      }

      setError(text);
    } finally {
      setInquiriesLoading(false);
    }
  }

    async function updateInquiryStatus(
    inquiryId,
    status
  ) {
    try {
      setInquiryProcessingId(inquiryId);
      setError("");
      setMessage("");

      const result = await apiPatch(
        `/api/cars/mine/inquiries/${inquiryId}/status`,
        {
          status,
        },
        token
      );

      setMessage(
        result?.message ||
          "Buyer inquiry updated."
      );

      await loadInquiries();
    } catch (err) {
      console.error(
        "Update vehicle inquiry failed:",
        err
      );

      setError(
        err.message ||
          "Unable to update buyer inquiry."
      );
    } finally {
      setInquiryProcessingId("");
    }
  }

  async function loadCars() {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet(
        "/api/cars/mine",
        token
      );

      setVehicles(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      const text =
        err.message ||
        "Unable to load your vehicle listings.";

      if (
        text.toLowerCase().includes("login") ||
        text.toLowerCase().includes("token") ||
        text.includes("401")
      ) {
        localStorage.removeItem("ownerToken");
        localStorage.removeItem("ownerUser");

        window.location.href =
          "/owner/login?redirect=/owner/my-cars";
        return;
      }

      setError(text);
    } finally {
      setLoading(false);
    }
  }

  async function retryPayment(vehicleId) {
    try {
      setProcessingId(vehicleId);
      setError("");
      setMessage("");

      const result = await apiPost(
        `/api/cars/${vehicleId}/create-checkout-session`,
        {}
      );

      if (!result?.url) {
        throw new Error(
          "Unable to start secure payment."
        );
      }

      window.location.href = result.url;
    } catch (err) {
      setError(
        err.message ||
          "Unable to start payment."
      );
      setProcessingId("");
    }
  }

  async function renewVehicle(vehicleId) {
  try {
    setProcessingId(vehicleId);
    setError("");
    setMessage("");

    const result = await apiPost(
      `/api/cars/mine/${vehicleId}/renew-checkout-session`,
      {},
      token
    );

    if (!result?.url) {
      throw new Error(
        "Unable to start vehicle renewal."
      );
    }

    window.location.href = result.url;
  } catch (err) {
    console.error(
      "Vehicle renewal failed:",
      err
    );

    setError(
      err.message ||
        "Unable to start vehicle renewal."
    );

    setProcessingId("");
  }
}

  async function markSold(vehicleId) {
    const confirmed = window.confirm(
      "Mark this vehicle as sold? It will be removed from the public marketplace."
    );

    if (!confirmed) return;

    try {
      setProcessingId(vehicleId);
      setError("");
      setMessage("");

      const result = await apiPatch(
        `/api/cars/mine/${vehicleId}/sold`,
        {},
        token
      );

      setMessage(
        result?.message ||
          "Vehicle marked as sold."
      );

      await loadCars();
    } catch (err) {
      setError(
        err.message ||
          "Unable to mark vehicle as sold."
      );
    } finally {
      setProcessingId("");
    }
  }

  return (
    <main className="owner-cars-page">
      <div className="owner-cars-container">

        <header className="owner-cars-header">
          <div>
            <a
              href="/owner/dashboard"
              className="owner-cars-back"
            >
              ← Owner Dashboard
            </a>

            <p className="owner-cars-kicker">
              HubEthio Cars Marketplace
            </p>

            <h1>My Cars</h1>

            <p>
              Manage vehicles you have listed
              for sale on HubEthio.
            </p>
          </div>

          <a
            href="/sell-car"
            className="owner-cars-new"
          >
            + Sell Another Car
          </a>
        </header>

        {message && (
          <div className="owner-cars-success">
            {message}
          </div>
        )}

        {error && (
          <div className="owner-cars-error">
            {error}
          </div>
        )}

        <section className="owner-car-inquiries">
  <div className="owner-car-inquiries-header">
    <div>
      <p className="owner-cars-kicker">
        Buyer Leads
      </p>

      <h2>Buyer Inquiries</h2>

      <p>
        Review messages from people interested
        in your vehicles and keep track of
        your follow-up.
      </p>
    </div>

    {!inquiriesLoading && (
      <span className="owner-car-inquiry-count">
        {inquiries.length}{" "}
        {inquiries.length === 1
          ? "Inquiry"
          : "Inquiries"}
      </span>
    )}
  </div>

  {inquiriesLoading ? (
    <div className="owner-car-inquiries-state">
      Loading buyer inquiries...
    </div>
  ) : inquiries.length === 0 ? (
    <div className="owner-car-inquiries-empty">
      <span>💬</span>

      <div>
        <strong>No buyer inquiries yet</strong>

        <p>
          New buyer messages will appear here
          when someone contacts you through
          a HubEthio vehicle listing.
        </p>
      </div>
    </div>
  ) : (
    <div className="owner-car-inquiry-list">
      {inquiries.map((inquiry) => {
        const inquiryVehicle =
          inquiry.vehicleId;

        const vehicleName =
          inquiryVehicle &&
          typeof inquiryVehicle === "object"
            ? [
                inquiryVehicle.year,
                inquiryVehicle.make,
                inquiryVehicle.model,
                inquiryVehicle.trim,
              ]
                .filter(Boolean)
                .join(" ")
            : "Vehicle Listing";

        return (
          <article
            key={inquiry._id}
            className="owner-car-inquiry-card"
          >
            <div className="owner-car-inquiry-top">
              <div>
                <span className="owner-car-inquiry-vehicle">
                  {vehicleName}
                </span>

                <h3>{inquiry.buyerName}</h3>
              </div>

              <span
                className={`owner-car-inquiry-status status-${String(
                  inquiry.status
                ).toLowerCase()}`}
              >
                {inquiry.status}
              </span>
            </div>

            <div className="owner-car-inquiry-contact">
              <a
                href={`mailto:${inquiry.buyerEmail}`}
              >
                ✉️ {inquiry.buyerEmail}
              </a>

              {inquiry.buyerPhone ? (
                <a
                  href={`tel:${String(
                    inquiry.buyerPhone
                  ).replace(/[^\d+]/g, "")}`}
                >
                  📞 {inquiry.buyerPhone}
                </a>
              ) : null}
            </div>

            <div className="owner-car-inquiry-message">
              <strong>Buyer Message</strong>

              <p>{inquiry.message}</p>
            </div>

            <div className="owner-car-inquiry-footer">
              <span>
                Received{" "}
                {new Date(
                  inquiry.createdAt
                ).toLocaleString()}
              </span>

              <div className="owner-car-inquiry-actions">
                {inquiry.status === "New" && (
                  <button
                    type="button"
                    disabled={
                      inquiryProcessingId ===
                      inquiry._id
                    }
                    onClick={() =>
                      updateInquiryStatus(
                        inquiry._id,
                        "Contacted"
                      )
                    }
                  >
                    {inquiryProcessingId ===
                    inquiry._id
                      ? "Updating..."
                      : "Mark Contacted"}
                  </button>
                )}

                {inquiry.status ===
                  "Contacted" && (
                  <button
                    type="button"
                    disabled={
                      inquiryProcessingId ===
                      inquiry._id
                    }
                    onClick={() =>
                      updateInquiryStatus(
                        inquiry._id,
                        "Closed"
                      )
                    }
                  >
                    {inquiryProcessingId ===
                    inquiry._id
                      ? "Updating..."
                      : "Close Inquiry"}
                  </button>
                )}

                {inquiry.status === "Closed" && (
                  <span className="owner-car-inquiry-done">
                    ✓ Follow-up complete
                  </span>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  )}
</section>

        {loading && (
          <div className="owner-cars-state">
            Loading your cars...
          </div>
        )}

        {!loading &&
          !error &&
          vehicles.length === 0 && (
            <section className="owner-cars-empty">
              <div className="owner-cars-empty-icon">
                🚗
              </div>

              <h2>You haven't listed a car yet</h2>

              <p>
                Create your first vehicle listing
                on HubEthio Cars Marketplace.
              </p>

              <a href="/sell-car">
                Sell Your Car
              </a>
            </section>
          )}

        {!loading && vehicles.length > 0 && (
          <section className="owner-cars-grid">
            {vehicles.map((vehicle) => (
              <article
                key={vehicle._id}
                className="owner-car-card"
              >
                {vehicle.photos?.[0] ? (
                  <img
                    src={vehicle.photos[0]}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="owner-car-image"
                  />
                ) : (
                  <div className="owner-car-no-image">
                    🚗
                  </div>
                )}

                <div className="owner-car-body">
                  <div className="owner-car-heading">
                    <div>
                      <h2>
                        {vehicle.year}{" "}
                        {vehicle.make}{" "}
                        {vehicle.model}
                      </h2>

                      {vehicle.trim && (
                        <p>{vehicle.trim}</p>
                      )}
                    </div>

                    <span
                      className={`owner-car-status status-${vehicle.status}`}
                    >
                      {statusLabel(
                        vehicle.status
                      )}
                    </span>
                  </div>

                  <strong className="owner-car-price">
                    {money(vehicle.price)}
                  </strong>

                  <div className="owner-car-meta">
                    <span>
                      {Number(
                        vehicle.mileage || 0
                      ).toLocaleString()}{" "}
                      miles
                    </span>

                    <span>
                      {vehicle.city},{" "}
                      {vehicle.state}
                    </span>
                  </div>

                  <div className="owner-car-payment">
                    Payment:{" "}
                    <strong>
                      {vehicle.paymentStatus}
                    </strong>
                  </div>

                  {vehicle.rejectionReason && (
                    <div className="owner-car-rejection">
                      <strong>
                        Rejection reason:
                      </strong>{" "}
                      {vehicle.rejectionReason}
                    </div>
                  )}

                  <div className="owner-car-actions">

                    {vehicle.status !== "sold" &&
  vehicle.status !== "expired" && (
    <a
      href={`/owner/my-cars/${vehicle._id}/edit`}
    >
      Edit Listing
    </a>
  )}

                    {!isIOSBuild &&
  vehicle.status === "payment_pending" &&
  vehicle.paymentStatus !== "paid" && (
    <button
      type="button"
      disabled={
        processingId === vehicle._id
      }
      onClick={() =>
        retryPayment(vehicle._id)
      }
    >
      Retry Payment — $7.00
    </button>
  )}

                    {vehicle.status ===
                      "approved" && (
                        <>
                          <a
                            href={`/cars/${vehicle._id}`}
                          >
                            View Listing
                          </a>

                          <button
                            type="button"
                            className="owner-car-sold"
                            disabled={
                              processingId ===
                              vehicle._id
                            }
                            onClick={() =>
                              markSold(
                                vehicle._id
                              )
                            }
                          >
                            Mark as Sold
                          </button>
                        </>
                      )}

                    {vehicle.status ===
                      "pending_review" && (
                        <span className="owner-car-note">
                          Waiting for HubEthio
                          admin review.
                        </span>
                      )}

                    {vehicle.status ===
                      "sold" && (
                        <span className="owner-car-note">
                          This vehicle has been
                          marked sold.
                        </span>
                      )}

                      {vehicle.status ===
  "expired" && (
    <div className="owner-car-expired-actions">
      <span className="owner-car-note">
        This listing has expired after its
        30-day marketplace period.
      </span>

      {!isIOSBuild && (
        <button
  type="button"
  className="owner-car-renew"
  onClick={() =>
    renewVehicle(vehicle._id)
  }
  disabled={
    processingId === vehicle._id
  }
>
  {processingId === vehicle._id
    ? "Opening Checkout..."
    : "Renew Listing — $7.00"}
</button>
      )}
    </div>
  )}

                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

      </div>
    </main>
  );
}