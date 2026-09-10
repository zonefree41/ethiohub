import React from "react";

import { apiGet } from "../../api/http.js";

import "./DriverDashboard.css";

export default function DriverDashboard() {
  const token = localStorage.getItem("driverToken");

  const [driver, setDriver] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

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

        const data = await apiGet(
          "/api/driver/me",
          token
        );

        setDriver(data?.driver || null);
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

              <p className="driver-empty-state">
                Your assigned transportation jobs will
                appear here.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
