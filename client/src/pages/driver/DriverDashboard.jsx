import React from "react";

import { apiGet, apiPatch, apiUpload } from "../../api/http.js";

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

  const [jobFilter, setJobFilter] =
    React.useState("active");

  const [verificationForm, setVerificationForm] =
    React.useState({
      driverLicenseNumber: "",
      driverLicenseState: "",
      driverLicenseExpirationDate: "",
      driverLicenseFrontPublicId: "",
      driverLicenseBackPublicId: "",
    });

  const [verificationUploading, setVerificationUploading] =
    React.useState("");

  const [verificationSubmitting, setVerificationSubmitting] =
    React.useState(false);

  const [verificationMessage, setVerificationMessage] =
    React.useState("");

  const activeJobs = jobs.filter(
    (job) => job.status === "In Progress"
  );

  const completedJobs = jobs.filter(
    (job) => job.status === "Completed"
  );

  const filteredJobs =
    jobFilter === "completed"
      ? completedJobs
      : activeJobs;

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

        const loadedDriver = data?.driver || null;

        setDriver(loadedDriver);

        if (loadedDriver) {
          setVerificationForm({
            driverLicenseNumber:
              loadedDriver.driverLicenseNumber || "",
            driverLicenseState:
              loadedDriver.driverLicenseState || "",
            driverLicenseExpirationDate:
              loadedDriver.driverLicenseExpirationDate
                ? loadedDriver.driverLicenseExpirationDate.slice(0, 10)
                : "",
            driverLicenseFrontPublicId:
              loadedDriver.driverLicenseFrontPublicId || "",
            driverLicenseBackPublicId:
              loadedDriver.driverLicenseBackPublicId || "",
          });
        }
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
    window.location.href = "/driver/login";
  }

  function updateVerificationField(event) {
    const { name, value } = event.target;

    setVerificationForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function uploadVerificationImage(event, side) {
    const file = event.target.files?.[0];

    if (!file || verificationUploading) return;

    try {
      setVerificationUploading(side);
      setError("");
      setVerificationMessage("");

      const data = await apiUpload(
        "/api/driver/verification/document",
        file,
        token
      );

      if (!data?.publicId) {
        throw new Error(
          "Verification document upload did not return an asset ID."
        );
      }

      setVerificationForm((current) => ({
        ...current,
        [side === "front"
          ? "driverLicenseFrontPublicId"
          : "driverLicenseBackPublicId"]: data.publicId,
      }));
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        localStorage.removeItem("driverToken");
        localStorage.removeItem("driverUser");
        window.location.href = "/driver/login";
        return;
      }

      setError(
        err.message ||
          "Failed to upload verification document."
      );
    } finally {
      setVerificationUploading("");
      event.target.value = "";
    }
  }

  async function submitVerification(event) {
    event.preventDefault();

    if (verificationSubmitting) return;

    try {
      setVerificationSubmitting(true);
      setError("");
      setVerificationMessage("");

      const data = await apiPatch(
        "/api/driver/verification",
        verificationForm,
        token
      );

      if (data?.driver) {
        setDriver((current) => ({
          ...current,
          ...data.driver,
        }));

        setVerificationForm({
          driverLicenseNumber:
            data.driver.driverLicenseNumber || "",
          driverLicenseState:
            data.driver.driverLicenseState || "",
          driverLicenseExpirationDate:
            data.driver.driverLicenseExpirationDate
              ? data.driver.driverLicenseExpirationDate.slice(
                  0,
                  10
                )
              : "",
          driverLicenseFrontPublicId:
            data.driver.driverLicenseFrontPublicId || "",
          driverLicenseBackPublicId:
            data.driver.driverLicenseBackPublicId || "",
        });
      }

      setVerificationMessage(
        data?.message ||
          "Driver verification submitted for review."
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
          "Failed to submit driver verification."
      );
    } finally {
      setVerificationSubmitting(false);
    }
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
                    driver.availabilityStatus === "busy" ||
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
                        "busy"
                      ? "Busy"
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
              <h2>Driver Verification</h2>

              <p className="driver-verification-description">
                Submit your driver license information for review.
                You must be approved before you can become
                available for transportation jobs.
              </p>

              {driver.verificationStatus === "rejected" &&
                driver.verificationRejectionReason && (
                  <div className="driver-verification-rejection">
                    <strong>Verification rejected</strong>
                    <p>
                      {driver.verificationRejectionReason}
                    </p>
                  </div>
                )}

              {driver.verificationStatus === "pending" && (
                <div className="driver-verification-notice">
                  Your verification has been submitted and is
                  waiting for review.
                </div>
              )}

              {driver.verificationStatus === "approved" && (
                <div className="driver-verification-success">
                  Your driver verification has been approved.
                </div>
              )}

              {verificationMessage && (
                <div className="driver-verification-success">
                  {verificationMessage}
                </div>
              )}

              <form
                className="driver-verification-form"
                onSubmit={submitVerification}
              >
                <div className="driver-verification-grid">
                  <label>
                    Driver License Number
                    <input
                      type="text"
                      name="driverLicenseNumber"
                      value={
                        verificationForm.driverLicenseNumber
                      }
                      onChange={updateVerificationField}
                      maxLength={80}
                      required
                      disabled={
                        driver.verificationStatus ===
                          "pending" ||
                        driver.verificationStatus ===
                          "approved"
                      }
                    />
                  </label>

                  <label>
                    License State
                    <input
                      type="text"
                      name="driverLicenseState"
                      value={
                        verificationForm.driverLicenseState
                      }
                      onChange={updateVerificationField}
                      maxLength={40}
                      required
                      disabled={
                        driver.verificationStatus ===
                          "pending" ||
                        driver.verificationStatus ===
                          "approved"
                      }
                    />
                  </label>

                  <label>
                    License Expiration Date
                    <input
                      type="date"
                      name="driverLicenseExpirationDate"
                      value={
                        verificationForm.driverLicenseExpirationDate
                      }
                      onChange={updateVerificationField}
                      required
                      disabled={
                        driver.verificationStatus ===
                          "pending" ||
                        driver.verificationStatus ===
                          "approved"
                      }
                    />
                  </label>
                </div>

                <div className="driver-verification-documents">
                  <label>
                    Driver License Front
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      onChange={(event) =>
                        uploadVerificationImage(
                          event,
                          "front"
                        )
                      }
                      disabled={
                        verificationUploading !== "" ||
                        driver.verificationStatus ===
                          "pending" ||
                        driver.verificationStatus ===
                          "approved"
                      }
                    />
                    {verificationUploading === "front" ? (
                      <span>Uploading...</span>
                    ) : verificationForm.driverLicenseFrontPublicId ? (
                      <span>Front image uploaded</span>
                    ) : (
                      <span>Front image required</span>
                    )}
                  </label>

                  <label>
                    Driver License Back
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      onChange={(event) =>
                        uploadVerificationImage(
                          event,
                          "back"
                        )
                      }
                      disabled={
                        verificationUploading !== "" ||
                        driver.verificationStatus ===
                          "pending" ||
                        driver.verificationStatus ===
                          "approved"
                      }
                    />
                    {verificationUploading === "back" ? (
                      <span>Uploading...</span>
                    ) : verificationForm.driverLicenseBackPublicId ? (
                      <span>Back image uploaded</span>
                    ) : (
                      <span>Back image required</span>
                    )}
                  </label>
                </div>

                {driver.verificationStatus !== "pending" &&
                  driver.verificationStatus !== "approved" && (
                    <button
                      type="submit"
                      className="driver-verification-submit"
                      disabled={
                        verificationSubmitting ||
                        verificationUploading !== ""
                      }
                    >
                      {verificationSubmitting
                        ? "Submitting..."
                        : driver.verificationStatus ===
                            "rejected"
                          ? "Resubmit for Review"
                          : "Submit for Review"}
                    </button>
                  )}
              </form>
            </section>

            <section className="driver-dashboard-card">
              <h2>Assigned Jobs</h2>

              <div
                className="driver-job-filters"
                role="group"
                aria-label="Filter assigned jobs"
              >
                <button
                  type="button"
                  className={
                    jobFilter === "active"
                      ? "driver-job-filter-button active"
                      : "driver-job-filter-button"
                  }
                  onClick={() => setJobFilter("active")}
                >
                  Active ({activeJobs.length})
                </button>

                <button
                  type="button"
                  className={
                    jobFilter === "completed"
                      ? "driver-job-filter-button active"
                      : "driver-job-filter-button"
                  }
                  onClick={() => setJobFilter("completed")}
                >
                  Completed ({completedJobs.length})
                </button>
              </div>

              {jobs.length === 0 ? (
                <p className="driver-empty-state">
                  You do not have any assigned
                  transportation jobs yet.
                </p>
              ) : filteredJobs.length === 0 ? (
                <p className="driver-empty-state">
                  {jobFilter === "completed"
                    ? "You do not have any completed jobs yet."
                    : "You do not have any active jobs right now."}
                </p>
              ) : (
                <div className="driver-jobs-list">
                  {filteredJobs.map((job) => (
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
