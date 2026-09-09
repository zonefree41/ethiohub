import React from "react";

import { apiGet, apiPost } from "../../api/http.js";

import WorkspaceLayout from "../../components/owner/workspaces/WorkspaceLayout.jsx";
import "./OwnerTransportationDrivers.css";

const DRIVER_SERVICE_TYPES = [
  "Furniture Delivery",
  "Package Delivery",
  "Moving Service",
  "Airport Transportation",
  "Freight Delivery",
  "Other",
];

export default function OwnerTransportationDrivers() {
  const token = localStorage.getItem("ownerToken");

  const [transportationListings, setTransportationListings] =
    React.useState([]);
  const [selectedListingId, setSelectedListingId] =
    React.useState("");
  const [drivers, setDrivers] = React.useState([]);

  const [loadingListings, setLoadingListings] =
    React.useState(true);
  const [loadingDrivers, setLoadingDrivers] =
    React.useState(false);

  const [error, setError] = React.useState("");
  const [driversError, setDriversError] =
    React.useState("");

  const [driverForm, setDriverForm] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    serviceTypes: [],
  });
  const [creatingDriver, setCreatingDriver] =
    React.useState(false);
  const [createDriverError, setCreateDriverError] =
    React.useState("");
  const [createDriverSuccess, setCreateDriverSuccess] =
    React.useState("");

  React.useEffect(() => {
    async function loadTransportationListings() {
      try {
        setLoadingListings(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const listings = Array.isArray(data)
          ? data.filter(
              (listing) =>
                listing.categoryId?.slug ===
                "transportation"
            )
          : [];

        setTransportationListings(listings);

        if (listings.length > 0) {
          setSelectedListingId(listings[0]._id);
        }
      } catch (err) {
        setError(
          err.message ||
            "Failed to load Transportation businesses."
        );
      } finally {
        setLoadingListings(false);
      }
    }

    loadTransportationListings();
  }, [token]);

  React.useEffect(() => {
    if (!selectedListingId) {
      setDrivers([]);
      return;
    }

    async function loadDrivers() {
      try {
        setLoadingDrivers(true);
        setDriversError("");

        const data = await apiGet(
          `/api/owner/transportation-drivers?businessListingId=${encodeURIComponent(
            selectedListingId
          )}`,
          token
        );

        setDrivers(Array.isArray(data) ? data : []);
      } catch (err) {
        setDrivers([]);
        setDriversError(
          err.message ||
            "Failed to load Transportation drivers."
        );
      } finally {
        setLoadingDrivers(false);
      }
    }

    loadDrivers();
  }, [selectedListingId, token]);

  function updateDriverField(field, value) {
    setDriverForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleDriverServiceType(serviceType) {
    setDriverForm((current) => ({
      ...current,
      serviceTypes: current.serviceTypes.includes(serviceType)
        ? current.serviceTypes.filter(
            (item) => item !== serviceType
          )
        : [...current.serviceTypes, serviceType],
    }));
  }

  async function createDriver(event) {
    event.preventDefault();

    const fullName = driverForm.fullName.trim();
    const phone = driverForm.phone.trim();
    const email = driverForm.email.trim();

    setCreateDriverError("");
    setCreateDriverSuccess("");

    if (!selectedListingId) {
      setCreateDriverError(
        "Please select a Transportation business."
      );
      return;
    }

    if (!fullName) {
      setCreateDriverError("Driver name is required.");
      return;
    }

    if (!phone) {
      setCreateDriverError(
        "Driver phone number is required."
      );
      return;
    }

    try {
      setCreatingDriver(true);

      const createdDriver = await apiPost(
        "/api/owner/transportation-drivers",
        {
          businessListingId: selectedListingId,
          fullName,
          email,
          phone,
          serviceTypes: driverForm.serviceTypes,
        },
        token
      );

      setDrivers((current) => [
        createdDriver,
        ...current,
      ]);

      setDriverForm({
        fullName: "",
        email: "",
        phone: "",
        serviceTypes: [],
      });

      setCreateDriverSuccess(
        "Driver added successfully. Verification is required before the driver can become active."
      );
    } catch (err) {
      setCreateDriverError(
        err.message || "Failed to add Transportation driver."
      );
    } finally {
      setCreatingDriver(false);
    }
  }

  return (
    <WorkspaceLayout
      label="Transportation Workspace"
      title="Manage Drivers"
      icon="👤"
      description="Manage registered drivers for your Transportation businesses."
      actions={
        <a href="/owner/transportation">
          Transportation Requests →
        </a>
      }
    >
      {error && <p>{error}</p>}

      {loadingListings ? (
        <p>Loading Transportation businesses...</p>
      ) : transportationListings.length === 0 ? (
        <p>
          You do not currently have a Transportation
          business listing.
        </p>
      ) : (
        <>
          <section className="owner-driver-business-card">
            <label htmlFor="transportation-driver-listing">
              Transportation Business
            </label>

            <select
              id="transportation-driver-listing"
              value={selectedListingId}
              onChange={(event) =>
                setSelectedListingId(event.target.value)
              }
            >
              {transportationListings.map((listing) => (
                <option
                  key={listing._id}
                  value={listing._id}
                >
                  {listing.title || "Transportation Business"}
                  {[listing.city, listing.state]
                    .filter(Boolean)
                    .length > 0
                    ? ` — ${[listing.city, listing.state]
                        .filter(Boolean)
                        .join(", ")}`
                    : ""}
                </option>
              ))}
            </select>
          </section>

          <section className="owner-driver-form-card">
            <h2>Add Driver</h2>

            <form className="owner-driver-form" onSubmit={createDriver}>
              <div>
                <label htmlFor="driver-full-name">
                  Full Name
                </label>
                <input
                  id="driver-full-name"
                  type="text"
                  value={driverForm.fullName}
                  onChange={(event) =>
                    updateDriverField(
                      "fullName",
                      event.target.value
                    )
                  }
                  maxLength={120}
                  required
                />
              </div>

              <div>
                <label htmlFor="driver-phone">
                  Phone
                </label>
                <input
                  id="driver-phone"
                  type="tel"
                  value={driverForm.phone}
                  onChange={(event) =>
                    updateDriverField(
                      "phone",
                      event.target.value
                    )
                  }
                  maxLength={40}
                  required
                />
              </div>

              <div>
                <label htmlFor="driver-email">
                  Email
                </label>
                <input
                  id="driver-email"
                  type="email"
                  value={driverForm.email}
                  onChange={(event) =>
                    updateDriverField(
                      "email",
                      event.target.value
                    )
                  }
                  maxLength={160}
                />
              </div>

              <fieldset className="owner-driver-service-types">
                <legend>Service Types</legend>

                {DRIVER_SERVICE_TYPES.map((serviceType) => (
                  <label key={serviceType}>
                    <input
                      type="checkbox"
                      checked={driverForm.serviceTypes.includes(
                        serviceType
                      )}
                      onChange={() =>
                        toggleDriverServiceType(serviceType)
                      }
                    />
                    {" "}
                    {serviceType}
                  </label>
                ))}
              </fieldset>

              {createDriverError && (
                <p>{createDriverError}</p>
              )}

              {createDriverSuccess && (
                <p>{createDriverSuccess}</p>
              )}

              <button
                type="submit"
                disabled={creatingDriver}
              >
                {creatingDriver
                  ? "Adding Driver..."
                  : "Add Driver"}
              </button>
            </form>
          </section>

          <section className="owner-driver-list-card">
            <h2>Registered Drivers</h2>

            {driversError && <p>{driversError}</p>}

            {loadingDrivers ? (
              <p>Loading drivers...</p>
            ) : drivers.length === 0 ? (
              <p>
                No registered drivers for this Transportation
                business yet.
              </p>
            ) : (
              <div className="owner-driver-grid">
                {drivers.map((driver) => (
                  <article className="owner-driver-card" key={driver._id}>
                    <h3>{driver.fullName}</h3>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {driver.phone || "Not provided"}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {driver.email || "Not provided"}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {driver.status}
                    </p>
                    <p>
                      <strong>Verification:</strong>{" "}
                      {driver.verificationStatus}
                    </p>
                    <p>
                      <strong>Availability:</strong>{" "}
                      {driver.availabilityStatus}
                    </p>
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
