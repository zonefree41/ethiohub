import React from "react";
import { LangContext } from "../context/LangContext.jsx";

export default function Navbar() {
  const { lang, setLang } = React.useContext(LangContext);

  return (
    <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ fontWeight: 800 }}>Ethiopian Services Finder</div>

      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button onClick={() => setLang(lang === "en" ? "am" : "en")}>
          {lang === "en" ? "ቋንቋ: English → አማርኛ" : "Language: አማርኛ → English"}
        </button>
      </div>
    </div>
  );
}
