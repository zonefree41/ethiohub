import React from "react";
import { apiPost } from "../../api/http.js";

export default function OwnerRegister() {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

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
      const data = await apiPost("/api/owner/auth/register", form);

      localStorage.setItem("ownerToken", data.token);
      localStorage.setItem("ownerUser", JSON.stringify(data.user));

      setMessage("✅ Account created successfully");
      window.location.href = "/owner/dashboard";
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  }

  return (
    <main style={{ maxWidth: 460, margin: "60px auto", padding: 16 }}>
      <a href="/">← Back Home</a>

      <h1>Create Business Owner Account</h1>
      <p>Create an account to manage your HubEthio business listing.</p>

      {message && (
        <div style={{ border: "1px solid green", padding: 12, marginBottom: 12 }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ border: "1px solid red", padding: 12, marginBottom: 12 }}>
          Error: {error}
        </div>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input
          name="name"
          value={form.name}
          onChange={update}
          placeholder="Full name"
          required
          style={{ padding: 12 }}
        />

        <input
          name="email"
          type="email"
          value={form.email}
          onChange={update}
          placeholder="Email"
          required
          style={{ padding: 12 }}
        />

        <input
          name="password"
          type="password"
          value={form.password}
          onChange={update}
          placeholder="Password, minimum 6 characters"
          required
          style={{ padding: 12 }}
        />

        <button type="submit" style={{ padding: 12 }}>
          Create Account
        </button>
      </form>

      <p>
        Already have an account? <a href="/owner/login">Login</a>
      </p>
    </main>
  );
}