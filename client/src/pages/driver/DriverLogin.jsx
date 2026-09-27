import React from "react";

import { apiPost } from "../../api/http.js";

import "./DriverAuth.css";

export default function DriverLogin() {
  const [form, setForm] = React.useState({
    email: "",
    password: "",
  });

  const [error, setError] =
    React.useState("");

  const [message, setMessage] =
    React.useState("");

  const [acceptedTerms, setAcceptedTerms] =
    React.useState(false);

  React.useEffect(() => {
    document.title = "Driver Login | HubEthio";
  }, []);

  function update(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function submit(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    try {
      const data = await apiPost(
        "/api/driver/auth/login",
        form
      );

      localStorage.setItem(
        "driverToken",
        data.token
      );

      localStorage.setItem(
        "driverUser",
        JSON.stringify(data.driver)
      );

      setMessage("Login successful");

      window.location.href =
        "/driver/dashboard";
    } catch (err) {
      const message = String(
        err?.message || ""
      ).toLowerCase();

      if (
        message.includes("invalid email or password") ||
        message.includes("incorrect email or password")
      ) {
        setError(
          "Incorrect email or password. Please try again."
        );
      } else {
        setError(
          "We couldn’t sign you in right now. Please check your connection and try again."
        );
      }
    }
  }

  return (
    <main className="driver-auth-page">
      <div className="driver-auth-card">
        <a
          href="/"
          className="driver-auth-back"
        >
          ‹ Back to HubEthio
        </a>

        <div className="driver-auth-header">
          <p className="driver-auth-label">
            Driver Portal
          </p>

          <h1>HubEthio Driver Login</h1>

          <p>
            Sign in to access your HubEthio
            Driver account.
          </p>
        </div>

        {message && (
          <div className="driver-auth-success">
            {message}
          </div>
        )}

        {error && (
          <div className="driver-auth-error">
            {error}
          </div>
        )}

        <form
          onSubmit={submit}
          className="driver-auth-form"
        >
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={update}
            placeholder="Email"
            required
            autoComplete="email"
          />

          <input
            name="password"
            type="password"
            value={form.password}
            onChange={update}
            placeholder="Password"
            required
            autoComplete="current-password"
          />

          <div className="driver-auth-links">
            <a href="/driver/forgot-password">
              Forgot Password?
            </a>
          </div>

          <label className="driver-auth-terms">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              required
            />
            <span>
              I agree to the{" "}
              <a href="/terms" target="_blank" rel="noreferrer">
                Terms of Service
              </a>{" "}
              and acknowledge HubEthio’s zero-tolerance policy for
              objectionable content and abusive users.
            </span>
          </label>

          <button type="submit" disabled={!acceptedTerms}>
            Driver Login
          </button>
        </form>
      </div>
    </main>
  );
}
