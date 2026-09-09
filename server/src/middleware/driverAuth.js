import jwt from "jsonwebtoken";

import TransportationDriver from "../models/TransportationDriver.js";

export async function requireDriver(req, res, next) {
  const auth = req.headers.authorization || "";

  const token = auth.startsWith("Bearer ")
    ? auth.slice(7).trim()
    : "";

  if (!token) {
    return res.status(401).json({
      message: "Driver login required.",
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!payload?.id || payload.role !== "driver") {
      return res.status(403).json({
        message: "Driver access required.",
      });
    }

    const driver = await TransportationDriver.findOne({
      _id: payload.id,
      driverAccountStatus: "active",
    }).select(
      "_id ownerId businessListingId fullName email driverAccountStatus status verificationStatus"
    );

    if (!driver) {
      return res.status(401).json({
        message:
          "Driver account is unavailable or not active.",
      });
    }

    req.driver = {
      id: driver._id,
      ownerId: driver.ownerId,
      businessListingId: driver.businessListingId,
      fullName: driver.fullName,
      email: driver.email,
      status: driver.status,
      verificationStatus: driver.verificationStatus,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired driver token.",
    });
  }
}
