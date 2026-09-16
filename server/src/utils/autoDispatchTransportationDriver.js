import { randomUUID } from "node:crypto";

import TransportationDriver from "../models/TransportationDriver.js";
import TransportationRequest from "../models/TransportationRequest.js";

export async function autoDispatchTransportationDriver(
  request,
  { excludeDriverIds = [] } = {}
) {
  if (
    !request ||
    !request._id ||
    !request.ownerId ||
    !request.listingId ||
    !request.serviceType ||
    request.driverId
  ) {
    return null;
  }

  const excludedDriverIds = [
    ...(request.declinedDriverIds || []).map(String),
    ...excludeDriverIds.map(String),
  ];

  const eligibleDrivers = await TransportationDriver.find({
    ownerId: request.ownerId,
    businessListingId: request.listingId,
    status: "active",
    verificationStatus: "approved",
    availabilityStatus: "available",
    serviceTypes: request.serviceType,
    ...(excludedDriverIds.length > 0
      ? { _id: { $nin: excludedDriverIds } }
      : {}),
  }).lean();

  if (eligibleDrivers.length === 0) {
    return null;
  }

  const driverIds = eligibleDrivers.map(
    (driver) => driver._id
  );

  const workloadCounts =
    await TransportationRequest.aggregate([
      {
        $match: {
          driverId: { $in: driverIds },
          status: {
            $in: ["Accepted", "In Progress"],
          },
        },
      },
      {
        $group: {
          _id: "$driverId",
          activeJobCount: { $sum: 1 },
        },
      },
    ]);

  const workloadByDriverId = new Map(
    workloadCounts.map((item) => [
      String(item._id),
      item.activeJobCount,
    ])
  );

  eligibleDrivers.sort((a, b) => {
    const workloadDifference =
      (workloadByDriverId.get(String(a._id)) || 0) -
      (workloadByDriverId.get(String(b._id)) || 0);

    if (workloadDifference !== 0) {
      return workloadDifference;
    }

    return String(a._id).localeCompare(String(b._id));
  });

  const dispatchLockToken = randomUUID();
  const dispatchLockExpiresAt = new Date(
    Date.now() + 30_000
  );

  let selectedDriver = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {

    for (const candidate of eligibleDrivers) {

      selectedDriver =
        await TransportationDriver.findOneAndUpdate(
          {
            _id: candidate._id,
            ownerId: request.ownerId,
            businessListingId: request.listingId,
            status: "active",
            verificationStatus: "approved",
            availabilityStatus: "available",
            serviceTypes: request.serviceType,
            $or: [
              { dispatchLockExpiresAt: null },
              {
                dispatchLockExpiresAt: {
                  $lte: new Date(),
                },
              },
            ],
          },
          {
            $set: {
              dispatchLockToken,
              dispatchLockExpiresAt,
            },
          },
          {
            new: true,
          }
        );

      if (selectedDriver) {
        break;
      }
    }

    if (selectedDriver) {
      break;
    }

    if (attempt === 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, 100)
      );
    }
  }

  if (!selectedDriver) {
    return null;
  }


  try {
    request.driverId = selectedDriver._id;
    request.driverName = selectedDriver.fullName;
    request.driverPhone = selectedDriver.phone;
    request.driverAssignedAt = new Date();

    await request.save();

    return selectedDriver;
  } finally {
    try {
      await TransportationDriver.updateOne(
        {
          _id: selectedDriver._id,
          dispatchLockToken,
        },
        {
          $set: {
            dispatchLockToken: "",
            dispatchLockExpiresAt: null,
          },
        }
      );
    } catch (releaseError) {
      console.error(
        "Transportation driver dispatch lock release failed:",
        releaseError
      );
    }
  }
}
