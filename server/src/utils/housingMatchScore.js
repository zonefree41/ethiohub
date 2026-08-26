function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function scoreHousingMatch(
  request,
  listing
) {
  let score = 0;
  const reasons = [];

  /*
    BUDGET — 30 points
  */
  const rent = Number(listing.monthlyRent);

  const budgetMin = Number(
    request.budgetMin
  );

  const budgetMax = Number(
    request.budgetMax
  );

  if (
    Number.isFinite(rent) &&
    Number.isFinite(budgetMin) &&
    Number.isFinite(budgetMax)
  ) {
    if (
      rent >= budgetMin &&
      rent <= budgetMax
    ) {
      score += 30;

      reasons.push(
        "Monthly rent is within the requested budget."
      );
    } else if (
      rent < budgetMin
    ) {
      score += 25;

      reasons.push(
        "Monthly rent is below the requested budget."
      );
    } else {
      const overBudget =
        rent - budgetMax;

      const tolerance =
        budgetMax * 0.1;

      if (
        tolerance > 0 &&
        overBudget <= tolerance
      ) {
        score += 10;

        reasons.push(
          "Monthly rent is slightly above the requested budget."
        );
      }
    }
  }

  /*
    BEDROOMS — 20 points
  */
  const bedroomsNeeded = Number(
    request.bedroomsNeeded
  );

  const listingBedrooms = Number(
    listing.bedrooms
  );

  if (
    Number.isFinite(bedroomsNeeded) &&
    Number.isFinite(listingBedrooms)
  ) {
    if (
      listingBedrooms >=
      bedroomsNeeded
    ) {
      score += 20;

      reasons.push(
        "The property meets the requested bedroom count."
      );
    }
  }

  /*
    LOCATION — 20 points
  */
  const preferredState =
    normalize(request.preferredState);

  const listingState =
    normalize(listing.state);

  const preferredCities =
    Array.isArray(
      request.preferredCities
    )
      ? request.preferredCities.map(
          normalize
        )
      : [];

  const listingCity =
    normalize(listing.city);

  if (
    preferredState &&
    listingState === preferredState
  ) {
    score += 8;

    reasons.push(
      "The property is in the requested state."
    );
  }

  if (
    listingCity &&
    preferredCities.includes(
      listingCity
    )
  ) {
    score += 12;

    reasons.push(
      "The property is in a preferred city."
    );
  } else if (
    request.openToNearbyAreas &&
    listingState === preferredState
  ) {
    score += 6;

    reasons.push(
      "The requester is open to nearby areas in the same state."
    );
  }

  if (
  preferredState &&
  listingState &&
  listingState !== preferredState
) {
  score -= 25;

  reasons.push(
    "The property is outside the requested state."
  );
}

  /*
    PETS — 10 points
  */
  if (
    request.hasPets ||
    request.petFriendlyRequired
  ) {
    if (listing.petsAllowed) {
      score += 10;

      reasons.push(
        "The property allows pets."
      );
    }
  } else {
    score += 10;
  }

  /*
    PARKING — 5 points
  */
  if (request.needsParking) {
    if (listing.parking) {
      score += 5;

      reasons.push(
        "Parking is available."
      );
    }
  } else {
    score += 5;
  }

  /*
    UTILITIES — 5 points
  */
  if (
    request.utilitiesPreferred
  ) {
    if (
      listing.utilitiesIncluded
    ) {
      score += 5;

      reasons.push(
        "Utilities are included."
      );
    }
  } else {
    score += 5;
  }

  /*
    FURNISHED — 5 points
  */
  if (
    request.furnishedPreferred
  ) {
    if (listing.furnished) {
      score += 5;

      reasons.push(
        "The property is furnished."
      );
    }
  } else {
    score += 5;
  }

  /*
    LEASE — 5 points
  */
  const leasePreference =
    normalize(
      request.leasePreference
    );

  const listingLease =
    normalize(listing.leaseTerm);

  if (
    leasePreference ===
      "flexible" ||
    !leasePreference
  ) {
    score += 5;
  } else if (
    listingLease ===
    leasePreference
  ) {
    score += 5;

    reasons.push(
      "The lease term matches the request."
    );
  }

  return {
    score: Math.max(
  0,
  Math.min(
    Math.round(score),
    100
  )
),

    reasons,
  };
}