import React from "react";

export const LangContext = React.createContext({ lang: "en", setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLang] = React.useState(() => localStorage.getItem("lang") || "en");

  React.useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}
