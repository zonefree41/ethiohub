import React from "react";
import { LangContext } from "../context/LangContext.jsx";

const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.hubethio.app";

export default function Navbar() {
  const { lang, setLang } = React.useContext(LangContext);

  return (
    <header
      style={{
        padding: "12px 20px",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "#ffffff",
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 22 }}>
        Hub<span style={{ color: "#f59e0b" }}>Ethio</span>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
        <a
          href={GOOGLE_PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "#16a34a",
            color: "#fff",
            padding: "9px 14px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: 800,
          }}
        >
          📱 Download App
        </a>

        <button onClick={() => setLang(lang === "en" ? "am" : "en")}>
          {lang === "en" ? "English → አማርኛ" : "አማርኛ → English"}
        </button>
      </div>
    </header>
  );
}