import VehicleListing from "../models/VehicleListing.js";

export async function expireVehicleListings() {
  const now = new Date();

  const result = await VehicleListing.updateMany(
    {
      status: "approved",
      expiresAt: {
        $ne: null,
        $lte: now,
      },
    },
    {
      $set: {
        status: "expired",
      },
    }
  );

  console.log(
    `🚗 Vehicle expiration check complete. Expired ${result.modifiedCount} listing(s).`
  );

  return result.modifiedCount;
}