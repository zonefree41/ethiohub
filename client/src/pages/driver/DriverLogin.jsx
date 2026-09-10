import React from "react";

import { apiPost } from "../../api/http.js";

import "../owner/OwnerAuth.css";

export default function DriverLogin() {
  const [form, setForm] = React.useState({
    email: "",
    password: "",
  });

  const [error, setError] =
    React.useState("");

  const [message, setMessage] =
    React.useState("");

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
      setError(
        err.message || "Driver login failed"
      );
    }
  }

  return (
    <main className="owner-auth-page">
      <div className="owner-auth-card">
        <a
          href="/"
          className="owner-auth-back"
        >
          ‹ Back to HubEthio
        </a>

        <div className="owner-auth-header">
          <p className="owner-auth-label">
            Driver Portal
          </p>

          <h1>HubEthio Driver Login</h1>

          <p>
            Sign in to access your HubEthio
            Driver account.
          </p>
        </div>

        {message && (
          <div className="owner-auth-success">
            {message}
          </div>
        )}

        {error && (
          <div className="owner-auth-error">
            Error: {error}
          </div>
        )}

        <form
          onSubmit={submit}
          className="owner-auth-form"
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

          <button type="submit">
            Driver Login
          </button>
        </form>
      </div>
    </main>
  );
}
