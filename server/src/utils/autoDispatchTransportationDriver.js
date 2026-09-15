import TransportationDriver from "../models/TransportationDriver.js";
import TransportationRequest from "../models/TransportationRequest.js";

export async function autoDispatchTransportationDriver(request) {
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

  const eligibleDrivers = await TransportationDriver.find({
    ownerId: request.ownerId,
    businessListingId: request.listingId,
    status: "active",
    verificationStatus: "approved",
    availabilityStatus: "available",
    serviceTypes: request.serviceType,
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

  const selectedDriver = eligibleDrivers[0];

  request.driverId = selectedDriver._id;
  request.driverName = selectedDriver.fullName;
  request.driverPhone = selectedDriver.phone;
  request.driverAssignedAt = new Date();

  await request.save();

  return selectedDriver;
}
