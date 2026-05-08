import React from "react";
import { LangContext } from "../context/LangContext.jsx";

export default function CategoryCard({ category }) {
  const { lang } = React.useContext(LangContext);
  const name = lang === "am" ? category.name_am : category.name_en;

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 22 }}>{category.icon || "📌"}</div>
      <div style={{ fontWeight: 800, marginTop: 6 }}>{name}</div>
    </div>
  );
}
