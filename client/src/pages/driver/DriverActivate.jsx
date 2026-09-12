import React from "react";

import { apiPost } from "../../api/http.js";

import "./DriverAuth.css";

export default function DriverActivate() {
  const token =
    new URLSearchParams(window.location.search).get("token") || "";

  const [password, setPassword] =
    React.useState("");

  const [confirmPassword, setConfirmPassword] =
    React.useState("");

  const [message, setMessage] =
    React.useState("");

  const [error, setError] =
    React.useState("");

  React.useEffect(() => {
    document.title =
      "Activate Driver Account | HubEthio";
  }, []);

  async function submit(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!token) {
      setError(
        "Driver activation link is missing or invalid."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const data = await apiPost(
        "/api/driver/auth/activate",
        {
          token,
          password,
        }
      );

      setMessage(
        data.message ||
          "Driver account activated successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to activate Driver account"
      );
    }
  }

  return (
    <main className="driver-auth-page">
      <div className="driver-auth-card">
        <a
          href="/driver/login"
          className="driver-auth-back"
        >
          ← Back to Driver Login
        </a>

        <div className="driver-auth-header">
          <p className="driver-auth-label">
            Driver Invitation
          </p>

          <h1>Activate Your Driver Account</h1>

          <p>
            Create your password to activate your
            HubEthio Driver account.
          </p>
        </div>

        {message && (
          <div className="driver-auth-success">
            {message}
          </div>
        )}

        {error && (
          <div className="driver-auth-error">
            Error: {error}
          </div>
        )}

        {!message && (
          <form
            onSubmit={submit}
            className="driver-auth-form"
          >
            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Create password"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              placeholder="Confirm password"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <button type="submit">
              Activate Driver Account
            </button>
          </form>
        )}

        {message && (
          <div className="driver-auth-links">
            <a href="/driver/login">
              Continue to Driver Login
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
