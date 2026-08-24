import React from "react";
import { apiGet } from "../api/http.js";
import "./CarsMarketplace.css";

export default function CarsMarketplace() {
  const [vehicles, setVehicles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title = "Cars for Sale | HubEthio";

    async function loadCars() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet("/api/cars");

        setVehicles(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to load vehicle listings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCars();
  }, []);

  return (
    <main className="cars-page">
      <div className="cars-container">
        <header className="cars-hero">
          <div>
            <p className="cars-kicker">
              HubEthio Cars Marketplace
            </p>

            <h1>Buy & Sell Cars</h1>

            <p>
              Browse vehicles listed by private sellers
              and local dealerships.
            </p>
          </div>

          <a
            href="/sell-car"
            className="cars-sell-button"
          >
            🚗 Sell Your Car
          </a>
        </header>

        {loading && (
          <section className="cars-state">
            <h2>Loading vehicles...</h2>
          </section>
        )}

        {!loading && error && (
          <section className="cars-state cars-error">
            <h2>Unable to load vehicles</h2>
            <p>{error}</p>
          </section>
        )}

        {!loading &&
          !error &&
          vehicles.length === 0 && (
            <section className="cars-state">
              <h2>No cars listed yet</h2>

              <p>
                Be one of the first sellers to list a
                vehicle on HubEthio.
              </p>

              <a href="/sell-car">
                Sell Your Car
              </a>
            </section>
          )}

        {!loading &&
          !error &&
          vehicles.length > 0 && (
            <section className="cars-grid">
              {vehicles.map((vehicle) => (
                <a
                  key={vehicle._id}
                  href={`/cars/${vehicle._id}`}
                  className="cars-card-link"
                >
                  <article className="cars-card">
                    {vehicle.photos?.[0] ? (
                      <img
                        src={vehicle.photos[0]}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="cars-card-image"
                      />
                    ) : (
                      <div className="cars-card-no-image">
                        🚗
                      </div>
                    )}

                    <div className="cars-card-body">
                      <div className="cars-card-top">
                        <h2>
                          {vehicle.year}{" "}
                          {vehicle.make}{" "}
                          {vehicle.model}
                        </h2>

                        {vehicle.isFeatured && (
                          <span className="cars-featured">
                            ⭐ Featured
                          </span>
                        )}
                      </div>

                      {vehicle.trim && (
                        <p className="cars-trim">
                          {vehicle.trim}
                        </p>
                      )}

                      <strong className="cars-price">
                        ${Number(
                          vehicle.price || 0
                        ).toLocaleString()}
                      </strong>

                      <div className="cars-meta">
                        <span>
                          {Number(
                            vehicle.mileage || 0
                          ).toLocaleString()}{" "}
                          miles
                        </span>

                        <span>
                          {vehicle.city},{" "}
                          {vehicle.state}
                        </span>
                      </div>

                      <div className="cars-details">
                        {vehicle.transmission && (
                          <span>
                            {vehicle.transmission}
                          </span>
                        )}

                        {vehicle.drivetrain && (
                          <span>
                            {vehicle.drivetrain}
                          </span>
                        )}

                        {vehicle.fuelType && (
                          <span>
                            {vehicle.fuelType}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </a>
              ))}
            </section>
          )}
      </div>
    </main>
  );
}