import React from "react";

import { apiGet, apiPatch } from "../../api/http.js";

import "./DriverDashboard.css";

export default function DriverDashboard() {
  const token = localStorage.getItem("driverToken");

  const [driver, setDriver] = React.useState(null);
  const [jobs, setJobs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [
    availabilityUpdating,
    setAvailabilityUpdating,
  ] = React.useState(false);

  const [completingJobId, setCompletingJobId] =
    React.useState("");

  React.useEffect(() => {
    document.title = "Driver Dashboard | HubEthio";
  }, []);

  React.useEffect(() => {
    async function loadDriver() {
      if (!token) {
        window.location.href = "/driver/login";
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [data, jobsData] = await Promise.all([
          apiGet("/api/driver/me", token),
          apiGet("/api/driver/jobs", token),
        ]);

        setDriver(data?.driver || null);
        setJobs(
          Array.isArray(jobsData) ? jobsData : []
        );
      } catch (err) {
        if (err?.status === 401 || err?.status === 403) {
          localStorage.removeItem("driverToken");
          localStorage.removeItem("driverUser");
          window.location.href = "/driver/login";
          return;
        }

        setError(
          err.message ||
            "Failed to load Driver account."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDriver();
  }, [token]);

  function logout() {
    localStorage.removeItem("driverToken");
    localStorage.removeItem("driverUser");
    window.location.href = "/";
  }

  async function toggleAvailability() {
    if (!driver || availabilityUpdating) return;

    const nextStatus =
      driver.availabilityStatus === "available"
        ? "offline"
        : "available";

    try {
      setAvailabilityUpdating(true);
      setError("");

      const data = await apiPatch(
        "/api/driver/availability",
        { availabilityStatus: nextStatus },
        token
      );

      setDriver(data?.driver || driver);
    } catch (err) {
      if (err?.status === 401) {
        localStorage.removeItem("driverToken");
        localStorage.removeItem("driverUser");
        window.location.href = "/driver/login";
        return;
      }

      setError(
        err.message ||
          "Failed to update Driver availability."
      );
    } finally {
      setAvailabilityUpdating(false);
    }
  }

  async function completeJob(jobId) {
    if (!jobId || completingJobId) return;

    try {
      setCompletingJobId(jobId);
      setError("");

      const data = await apiPatch(
        `/api/driver/jobs/${jobId}/complete`,
        {},
        token
      );

      if (data?.request) {
        setJobs((currentJobs) =>
          currentJobs.map((job) =>
            job._id === data.request._id
              ? { ...job, ...data.request }
              : job
          )
        );
      }
    } catch (err) {
      if (err?.status === 401) {
        localStorage.removeItem("driverToken");
        localStorage.removeItem("driverUser");
        window.location.href = "/driver/login";
        return;
      }

      setError(
        err.message ||
          "Failed to complete Transportation job."
      );
    } finally {
      setCompletingJobId("");
    }
  }

  function formatStatus(value) {
    if (!value) return "Not available";

    return value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  if (loading) {
    return (
      <main className="driver-dashboard-page">
        <div className="driver-dashboard-shell">
          <p>Loading Driver Dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="driver-dashboard-page">
      <div className="driver-dashboard-shell">
        <header className="driver-dashboard-header">
          <div>
            <p className="driver-dashboard-label">
              Driver Portal
            </p>

            <h1>Driver Dashboard</h1>

            <p>
              Welcome
              {driver?.fullName
                ? `, ${driver.fullName}`
                : ""}.
            </p>
          </div>

          <button
            type="button"
            className="driver-logout-button"
            onClick={logout}
          >
            Logout
          </button>
        </header>

        {error && (
          <div className="driver-dashboard-error">
            Error: {error}
          </div>
        )}

        {driver && (
          <>
            <section className="driver-status-grid">
              <article className="driver-status-card">
                <span>Account</span>
                <strong>
                  {formatStatus(
                    driver.driverAccountStatus
                  )}
                </strong>
              </article>

              <article className="driver-status-card">
                <span>Driver Status</span>
                <strong>
                  {formatStatus(driver.status)}
                </strong>
              </article>

              <article className="driver-status-card">
                <span>Verification</span>
                <strong>
                  {formatStatus(
                    driver.verificationStatus
                  )}
                </strong>
              </article>

              <article className="driver-status-card">
                <span>Availability</span>
                <strong>
                  {formatStatus(
                    driver.availabilityStatus
                  )}
                </strong>

                <button
                  type="button"
                  className="driver-availability-button"
                  onClick={toggleAvailability}
                  disabled={
                    availabilityUpdating ||
                    (
                      driver.availabilityStatus !==
                        "available" &&
                      (
                        driver.status !== "active" ||
                        driver.verificationStatus !==
                          "approved"
                      )
                    )
                  }
                >
                  {availabilityUpdating
                    ? "Updating..."
                    : driver.availabilityStatus ===
                        "available"
                      ? "Go Offline"
                      : "Go Available"}
                </button>
              </article>
            </section>

            <section className="driver-dashboard-card">
              <h2>Driver Profile</h2>

              <div className="driver-profile-grid">
                <div>
                  <span>Name</span>
                  <strong>
                    {driver.fullName || "Not provided"}
                  </strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>
                    {driver.email || "Not provided"}
                  </strong>
                </div>

                <div>
                  <span>Phone</span>
                  <strong>
                    {driver.phone || "Not provided"}
                  </strong>
                </div>

                <div>
                  <span>Services</span>
                  <strong>
                    {driver.serviceTypes?.length
                      ? driver.serviceTypes.join(", ")
                      : "Not provided"}
                  </strong>
                </div>
              </div>
            </section>

            <section className="driver-dashboard-card">
              <h2>Assigned Jobs</h2>

              {jobs.length === 0 ? (
                <p className="driver-empty-state">
                  You do not have any assigned
                  transportation jobs yet.
                </p>
              ) : (
                <div className="driver-jobs-list">
                  {jobs.map((job) => (
                    <article
                      key={job._id}
                      className="driver-job-card"
                    >
                      <div className="driver-job-header">
                        <div>
                          <span className="driver-job-label">
                            {job.serviceType ||
                              "Transportation"}
                          </span>
                          <h3>
                            {job.listingId?.title ||
                              "Assigned Job"}
                          </h3>
                        </div>

                        <strong className="driver-job-status">
                          {formatStatus(job.status)}
                        </strong>
                      </div>

                      <div className="driver-job-grid">
                        <div>
                          <span>Customer</span>
                          <strong>
                            {job.customerName ||
                              "Not provided"}
                          </strong>
                        </div>

                        <div>
                          <span>Phone</span>
                          <strong>
                            {job.customerPhone ||
                              "Not provided"}
                          </strong>
                        </div>

                        <div>
                          <span>Pickup</span>
                          <strong>
                            {job.pickupAddress ||
                              "Not provided"}
                          </strong>
                        </div>

                        <div>
                          <span>Delivery</span>
                          <strong>
                            {job.deliveryAddress ||
                              "Not provided"}
                          </strong>
                        </div>

                        <div>
                          <span>Requested Date</span>
                          <strong>
                            {job.requestedDate
                              ? new Date(
                                  job.requestedDate
                                ).toLocaleDateString(
                                  undefined,
                                  { timeZone: "UTC" }
                                )
                              : "Not provided"}
                          </strong>
                        </div>

                        <div>
                          <span>Requested Time</span>
                          <strong>
                            {job.requestedTime ||
                              "Not provided"}
                          </strong>
                        </div>

                        <div>
                          <span>Vehicle</span>
                          <strong>
                            {job.vehicleDescription ||
                              "Not provided"}
                          </strong>
                        </div>

                        <div>
                          <span>Plate</span>
                          <strong>
                            {job.licensePlate ||
                              "Not provided"}
                          </strong>
                        </div>
                      </div>

                      {job.cargoDetails && (
                        <div className="driver-job-details">
                          <span>Cargo Details</span>
                          <p>{job.cargoDetails}</p>
                        </div>
                      )}

                      {job.status === "In Progress" && (
                        <button
                          type="button"
                          className="driver-job-complete-button"
                          onClick={() => completeJob(job._id)}
                          disabled={completingJobId === job._id}
                        >
                          {completingJobId === job._id
                            ? "Completing..."
                            : "Mark Completed"}
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
