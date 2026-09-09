import React from "react";

import { apiGet } from "../../api/http.js";

import WorkspaceLayout from "../../components/owner/workspaces/WorkspaceLayout.jsx";

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
          <section>
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

          <section>
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
              <div>
                {drivers.map((driver) => (
                  <article key={driver._id}>
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
