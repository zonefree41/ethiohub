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

export function trackEvent(eventName, params = {}) {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!id) return;

  ReactGA.event(eventName, {
    ...params,
    transport_type: "beacon",
  });

  console.log("GA event:", eventName, params);
}