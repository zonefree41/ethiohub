import ReactGA from "react-ga4";

export function initAnalytics() {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!id) return;

  ReactGA.initialize(id);
}

export function trackPageView(path) {
  ReactGA.send({
    hitType: "pageview",
    page: path,
  });
}