import React from "react";
import { apiGet } from "../api/http.js";
import "./CarDetail.css";

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "$0";
  }

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatMileage(value) {
  const mileage = Number(value);

  if (!Number.isFinite(mileage)) {
    return "0 miles";
  }

  return `${mileage.toLocaleString()} miles`;
}

export default function CarDetail() {
  const vehicleId =
    window.location.pathname.split("/").pop();

  const [vehicle, setVehicle] =
    React.useState(null);

  const [selectedPhoto, setSelectedPhoto] =
    React.useState("");

  const [loading, setLoading] =
    React.useState(true);

  const [error, setError] =
    React.useState("");

  React.useEffect(() => {
    async function loadVehicle() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          `/api/cars/${vehicleId}`
        );

        setVehicle(data);

        const firstPhoto =
          Array.isArray(data?.photos) &&
          data.photos.length > 0
            ? data.photos[0]
            : "";

        setSelectedPhoto(firstPhoto);

        document.title = data
          ? `${data.year} ${data.make} ${data.model} | HubEthio Cars`
          : "Car Details | HubEthio";
      } catch (err) {
        setError(
          err.message ||
            "Unable to load this vehicle."
        );
      } finally {
        setLoading(false);
      }
    }

    if (vehicleId) {
      loadVehicle();
    }
  }, [vehicleId]);

  const phoneHref = vehicle?.sellerPhone
    ? `tel:${String(vehicle.sellerPhone).replace(
        /[^\d+]/g,
        ""
      )}`
    : "";

  const sellerPhone = vehicle?.sellerPhone
  ? String(vehicle.sellerPhone).replace(/[^\d+]/g, "")
  : "";

const carUrl = vehicle
  ? `${window.location.origin}/cars/${vehicle._id}`
  : "";

const carMessage = vehicle
  ? `Hi, I'm interested in your ${vehicle.year} ${vehicle.make} ${vehicle.model}${
      vehicle.trim ? ` ${vehicle.trim}` : ""
    } listed on HubEthio for ${formatMoney(vehicle.price)}.

Vehicle: ${carUrl}`
  : "";

const smsHref = sellerPhone
  ? `sms:${sellerPhone}?&body=${encodeURIComponent(carMessage)}`
  : "";

  if (loading) {
    return (
      <main className="car-detail-page">
        <section className="car-detail-state">
          <h1>Loading vehicle...</h1>
        </section>
      </main>
    );
  }

  if (error || !vehicle) {
    return (
      <main className="car-detail-page">
        <section className="car-detail-state">
          <h1>Vehicle not found</h1>
          <p>
            {error ||
              "This vehicle is not currently available."}
          </p>

          <a href="/cars">
            Back to Cars Marketplace
          </a>
        </section>
      </main>
    );
  }

  const photos = Array.isArray(vehicle.photos)
    ? vehicle.photos
    : [];

  return (
    <main className="car-detail-page">
      <div className="car-detail-container">
        <a
          href="/cars"
          className="car-detail-back"
        >
          ← Back to Cars Marketplace
        </a>

        <section className="car-detail-layout">
          <div className="car-detail-gallery">
            <div className="car-detail-main-image">
              {selectedPhoto ? (
                <img
                  src={selectedPhoto}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                />
              ) : (
                <div className="car-detail-no-image">
                  🚗
                </div>
              )}
            </div>

            {photos.length > 1 && (
              <div className="car-detail-thumbnails">
                {photos.map((photo, index) => (
                  <button
                    type="button"
                    key={`${photo}-${index}`}
                    className={
                      selectedPhoto === photo
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setSelectedPhoto(photo)
                    }
                  >
                    <img
                      src={photo}
                      alt={`Vehicle photo ${index + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="car-detail-summary">
            <p className="car-detail-kicker">
              HubEthio Cars Marketplace
            </p>

            <h1>
              {vehicle.year} {vehicle.make}{" "}
              {vehicle.model}
            </h1>

            {vehicle.trim && (
              <p className="car-detail-trim">
                {vehicle.trim}
              </p>
            )}

            <strong className="car-detail-price">
              {formatMoney(vehicle.price)}
            </strong>

            <div className="car-detail-highlight-grid">
              <div>
                <span>Mileage</span>
                <strong>
                  {formatMileage(
                    vehicle.mileage
                  )}
                </strong>
              </div>

              <div>
                <span>Condition</span>
                <strong>
                  {vehicle.condition ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <span>Location</span>
                <strong>
                  {vehicle.city},{" "}
                  {vehicle.state}
                </strong>
              </div>

              <div>
                <span>Seller</span>
                <strong>
                  {vehicle.sellerType ===
                  "dealer"
                    ? "Dealer"
                    : "Private Seller"}
                </strong>
              </div>
            </div>

            <div className="car-detail-contact">
              <h2>Contact Seller</h2>

              <p>
                Contact the seller directly for
                questions, inspection, or purchase
                arrangements.
              </p>

              {vehicle.sellerPhone ? (
                <div className="car-detail-contact-actions">
                  <a
                    href={phoneHref}
                    className="car-detail-call"
                  >
                    📞 Call Seller
                  </a>

                  <a
                    href={smsHref}
                    className="car-detail-message"
                  >
                    💬 Message Seller
                  </a>
                </div>
              ) : (
                <p>
                  Seller phone number is not available.
                </p>
              )}
            </div>
          </aside>
        </section>

        <section className="car-detail-spec-section">
          <h2>Vehicle Details</h2>

          <div className="car-detail-spec-grid">
            <div>
              <span>Year</span>
              <strong>{vehicle.year}</strong>
            </div>

            <div>
              <span>Make</span>
              <strong>{vehicle.make}</strong>
            </div>

            <div>
              <span>Model</span>
              <strong>{vehicle.model}</strong>
            </div>

            <div>
              <span>Trim</span>
              <strong>
                {vehicle.trim || "N/A"}
              </strong>
            </div>

            <div>
              <span>Transmission</span>
              <strong>
                {vehicle.transmission ||
                  "N/A"}
              </strong>
            </div>

            <div>
              <span>Drivetrain</span>
              <strong>
                {vehicle.drivetrain ||
                  "N/A"}
              </strong>
            </div>

            <div>
              <span>Fuel Type</span>
              <strong>
                {vehicle.fuelType || "N/A"}
              </strong>
            </div>

            <div>
              <span>Title Status</span>
              <strong>
                {vehicle.titleStatus ||
                  "N/A"}
              </strong>
            </div>

            <div>
              <span>Exterior Color</span>
              <strong>
                {vehicle.exteriorColor ||
                  "N/A"}
              </strong>
            </div>

            <div>
              <span>Interior Color</span>
              <strong>
                {vehicle.interiorColor ||
                  "N/A"}
              </strong>
            </div>
          </div>
        </section>

        <section className="car-detail-description">
          <h2>Seller Description</h2>

          <p>
            {vehicle.description ||
              "The seller has not added a description yet."}
          </p>
        </section>

        <section className="car-detail-safety">
          <h2>Buying Safely</h2>

          <p>
            HubEthio provides the marketplace
            connection only. Buyers should inspect
            the vehicle, verify title and ownership,
            confirm the VIN, and complete payment
            and title transfer directly with the
            seller.
          </p>
        </section>
      </div>
    </main>
  );
}