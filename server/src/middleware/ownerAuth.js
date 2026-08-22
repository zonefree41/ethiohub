import jwt from "jsonwebtoken";
import User from "../models/User.js";


export async function requireOwner(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: "Owner login required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id || decoded.role !== "owner") {
  return res.status(403).json({
    message: "Owner access required",
  });
}

const user = await User.findOne({
  _id: decoded.id,
  role: "owner",
  accountStatus: "active",
}).select("_id role accountStatus");

if (!user) {
  return res.status(401).json({
    message:
      "Owner account is unavailable or not active.",
  });
}

    req.owner = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}