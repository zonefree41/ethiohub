import React from "react";
import { apiGet, apiPost } from "../api/http.js";
import "./SubmitTravelRequest.css";

const CABIN_CLASSES = [
  "Economy",
  "Premium Economy",
  "Business",
  "First",
];

const initialForm = {
  listingId: "",

  customerName: "",
  customerEmail: "",
  customerPhone: "",

  tripType: "Round Trip",

  departureCity: "",
  destinationCity: "",

  departureDate: "",
  returnDate: "",

  adults: 1,
  children: 0,
  infants: 0,

  cabinClass: "Economy",

  directFlightPreferred: false,
  flexibleDates: false,

  hotelNeeded: false,
  visaAssistance: false,
  travelInsurance: false,

  budget: "",
  notes: "",
};

export default function SubmitTravelRequest() {
  const [travelAgencies, setTravelAgencies] =
    React.useState([]);

  const [form, setForm] =
    React.useState(initialForm);

  const [loadingAgencies, setLoadingAgencies] =
    React.useState(false);

  const [submitting, setSubmitting] =
    React.useState(false);

  const [error, setError] =
    React.useState("");

  const [message, setMessage] =
    React.useState("");

  React.useEffect(() => {
    document.title =
      "Submit Travel Request | HubEthio";

    loadTravelAgencies();
  }, []);

  async function loadTravelAgencies() {
    try {
      setLoadingAgencies(true);
      setError("");

      const categories =
        await apiGet("/api/categories");

      const travelCategory =
        Array.isArray(categories)
          ? categories.find(
              (category) =>
                category.slug === "travel-tours"
            )
          : null;

      if (!travelCategory?._id) {
        throw new Error(
          "Travel & Tours category was not found."
        );
      }

      const listings = await apiGet(
        `/api/listings?category=${travelCategory._id}`
      );

      const eligibleAgencies =
        Array.isArray(listings)
          ? listings.filter(
              (listing) =>
                listing.status === "approved" &&
                Boolean(listing.ownerId)
            )
          : [];

      setTravelAgencies(eligibleAgencies);

      const requestedListingId = getListingIdFromUrl();

const requestedAgency = eligibleAgencies.find(
  (agency) => agency._id === requestedListingId
);

if (requestedAgency) {
  setForm((current) => ({
    ...current,
    listingId: requestedAgency._id,
  }));
} else if (eligibleAgencies.length === 1) {
  setForm((current) => ({
    ...current,
    listingId: eligibleAgencies[0]._id,
  }));
}
    } catch (err) {
      console.error(
        "Failed to load travel agencies:",
        err
      );

      setError(
        err.message ||
          "Failed to load available travel agencies."
      );
    } finally {
      setLoadingAgencies(false);
    }
  }

  function getListingIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("listing") || "";
}

  function updateField(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  function updateTripType(event) {
    const tripType = event.target.value;

    setForm((current) => ({
      ...current,
      tripType,
      returnDate:
        tripType === "One Way"
          ? ""
          : current.returnDate,
    }));
  }

  async function submitTravelRequest(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.listingId) {
      setError(
        "Please select a travel agency."
      );
      return;
    }

    if (
      form.tripType === "Round Trip" &&
      !form.returnDate
    ) {
      setError(
        "Return date is required for a round trip."
      );
      return;
    }

    if (
      form.returnDate &&
      new Date(form.returnDate) <
        new Date(form.departureDate)
    ) {
      setError(
        "Return date cannot be before departure date."
      );
      return;
    }

    const adults = Number(form.adults);
    const children = Number(form.children);
    const infants = Number(form.infants);

    if (
      !Number.isFinite(adults) ||
      adults < 1
    ) {
      setError(
        "At least one adult traveler is required."
      );
      return;
    }

    if (
      adults + children + infants > 20
    ) {
      setError(
        "A maximum of 20 travelers is allowed."
      );
      return;
    }

    try {
      setSubmitting(true);

      const data = await apiPost(
        "/api/travel-requests",
        {
          listingId: form.listingId,

          customerName:
            form.customerName.trim(),

          customerEmail:
            form.customerEmail
              .trim()
              .toLowerCase(),

          customerPhone:
            form.customerPhone.trim(),

          tripType:
            form.tripType,

          departureCity:
            form.departureCity.trim(),

          destinationCity:
            form.destinationCity.trim(),

          departureDate:
            form.departureDate,

          returnDate:
            form.tripType === "Round Trip"
              ? form.returnDate
              : null,

          adults,
          children,
          infants,

          cabinClass:
            form.cabinClass,

          directFlightPreferred:
            form.directFlightPreferred,

          flexibleDates:
            form.flexibleDates,

          hotelNeeded:
            form.hotelNeeded,

          visaAssistance:
            form.visaAssistance,

          travelInsurance:
            form.travelInsurance,

          budget:
            form.budget === ""
              ? null
              : Number(form.budget),

          notes:
            form.notes.trim(),
        }
      );

      setMessage(
        data?.message ||
          "Your travel request was submitted successfully."
      );

      setForm((current) => ({
        ...initialForm,
        listingId:
          travelAgencies.length === 1
            ? travelAgencies[0]._id
            : "",
      }));

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(
        err.message ||
          "Failed to submit your travel request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="travel-request-page">
      <section className="travel-request-hero">
        <div className="travel-request-hero-content">
          <p className="travel-request-kicker">
            ✈️ HubEthio Travel Marketplace
          </p>

          <h1>Request a Travel Quote</h1>

          <p>
            Describe your trip and connect with an
            Ethiopian travel agency that can help with
            flights, hotels, visa assistance, travel
            insurance, and more.
          </p>
        </div>
      </section>

      <section className="travel-request-content">
        <form
          className="travel-request-form"
          onSubmit={submitTravelRequest}
        >
          {error && (
            <div className="travel-request-error">
              {error}
            </div>
          )}

          {message && (
            <div className="travel-request-success">
              {message}
            </div>
          )}

          <section className="travel-form-section">
            <h2>Travel Agency</h2>

            <label>
              Select Travel Agency *
              <select
                name="listingId"
                value={form.listingId}
                onChange={updateField}
                required
                disabled={loadingAgencies}
              >
                <option value="">
                  {loadingAgencies
                    ? "Loading travel agencies..."
                    : "Choose a travel agency"}
                </option>

                {travelAgencies.map(
                  (agency) => (
                    <option
                      key={agency._id}
                      value={agency._id}
                    >
                      {agency.title}
                      {agency.city
                        ? ` — ${agency.city}, ${agency.state}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </label>

            {!loadingAgencies &&
              travelAgencies.length === 0 && (
                <p className="travel-form-help">
                  No eligible travel agencies are
                  currently accepting requests.
                </p>
              )}
          </section>

          <section className="travel-form-section">
            <h2>Traveler Information</h2>

            <div className="travel-form-grid">
              <label>
                Full Name *
                <input
                  name="customerName"
                  value={form.customerName}
                  onChange={updateField}
                  required
                />
              </label>

              <label>
                Phone Number *
                <input
                  name="customerPhone"
                  value={form.customerPhone}
                  onChange={updateField}
                  required
                />
              </label>

              <label className="travel-form-wide">
                Email Address
                <input
                  type="email"
                  name="customerEmail"
                  value={form.customerEmail}
                  onChange={updateField}
                />
              </label>
            </div>
          </section>

          <section className="travel-form-section">
            <h2>Trip Information</h2>

            <div className="travel-form-grid">
              <label>
                Trip Type *
                <select
                  name="tripType"
                  value={form.tripType}
                  onChange={updateTripType}
                >
                  <option value="Round Trip">
                    Round Trip
                  </option>

                  <option value="One Way">
                    One Way
                  </option>
                </select>
              </label>

              <label>
                Cabin Class
                <select
                  name="cabinClass"
                  value={form.cabinClass}
                  onChange={updateField}
                >
                  {CABIN_CLASSES.map(
                    (cabinClass) => (
                      <option
                        key={cabinClass}
                        value={cabinClass}
                      >
                        {cabinClass}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                From City or Airport *
                <input
                  name="departureCity"
                  value={form.departureCity}
                  onChange={updateField}
                  placeholder="Washington Dulles (IAD)"
                  required
                />
              </label>

              <label>
                Destination City or Airport *
                <input
                  name="destinationCity"
                  value={form.destinationCity}
                  onChange={updateField}
                  placeholder="Addis Ababa (ADD)"
                  required
                />
              </label>

              <label>
                Departure Date *
                <input
                  type="date"
                  name="departureDate"
                  value={form.departureDate}
                  onChange={updateField}
                  required
                />
              </label>

              {form.tripType ===
                "Round Trip" && (
                <label>
                  Return Date *
                  <input
                    type="date"
                    name="returnDate"
                    value={form.returnDate}
                    onChange={updateField}
                    required
                  />
                </label>
              )}
            </div>
          </section>

          <section className="travel-form-section">
            <h2>Travelers</h2>

            <div className="travel-passenger-grid">
              <label>
                Adults
                <input
                  type="number"
                  name="adults"
                  min="1"
                  max="20"
                  value={form.adults}
                  onChange={updateField}
                />
              </label>

              <label>
                Children
                <input
                  type="number"
                  name="children"
                  min="0"
                  max="20"
                  value={form.children}
                  onChange={updateField}
                />
              </label>

              <label>
                Infants
                <input
                  type="number"
                  name="infants"
                  min="0"
                  max="20"
                  value={form.infants}
                  onChange={updateField}
                />
              </label>
            </div>
          </section>

          <section className="travel-form-section">
            <h2>Travel Preferences</h2>

            <div className="travel-checkbox-grid">
              <label>
                <input
                  type="checkbox"
                  name="directFlightPreferred"
                  checked={
                    form.directFlightPreferred
                  }
                  onChange={updateField}
                />
                Direct flight preferred
              </label>

              <label>
                <input
                  type="checkbox"
                  name="flexibleDates"
                  checked={
                    form.flexibleDates
                  }
                  onChange={updateField}
                />
                Flexible travel dates
              </label>

              <label>
                <input
                  type="checkbox"
                  name="hotelNeeded"
                  checked={form.hotelNeeded}
                  onChange={updateField}
                />
                Hotel assistance needed
              </label>

              <label>
                <input
                  type="checkbox"
                  name="visaAssistance"
                  checked={
                    form.visaAssistance
                  }
                  onChange={updateField}
                />
                Visa assistance needed
              </label>

              <label>
                <input
                  type="checkbox"
                  name="travelInsurance"
                  checked={
                    form.travelInsurance
                  }
                  onChange={updateField}
                />
                Travel insurance needed
              </label>
            </div>
          </section>

          <section className="travel-form-section">
            <h2>Budget and Notes</h2>

            <div className="travel-form-grid">
              <label>
                Estimated Budget
                <input
                  type="number"
                  name="budget"
                  min="0"
                  value={form.budget}
                  onChange={updateField}
                  placeholder="1800"
                />
              </label>
            </div>

            <label className="travel-notes-label">
              Additional Notes
              <textarea
                name="notes"
                value={form.notes}
                onChange={updateField}
                rows="6"
                maxLength="3000"
                placeholder="Preferred airline, baggage needs, flexible dates, hotel preferences, or other trip details."
              />
            </label>
          </section>

          <div className="travel-request-notice">
            Your request will be sent directly to the
            selected travel agency. HubEthio does not
            issue airline tickets or process the final
            booking.
          </div>

          <button
            type="submit"
            className="travel-submit-button"
            disabled={
              submitting ||
              loadingAgencies ||
              travelAgencies.length === 0
            }
          >
            {submitting
              ? "Submitting Travel Request..."
              : "Submit Travel Request"}
          </button>
        </form>
      </section>
    </main>
  );
}