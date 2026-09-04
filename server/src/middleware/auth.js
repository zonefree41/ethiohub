import jwt from "jsonwebtoken";
import AdminUser from "../models/AdminUser.js";


export async function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ")
    ? auth.slice(7).trim()
    : "";

  if (!token) {
    return res.status(401).json({
      message: "Missing admin token.",
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const allowedAdminRoles = [
  "super_admin",
  "engineer",
  "operations_admin",
  "verification_agent",
  "support_agent",
];

if (!payload?.id || !allowedAdminRoles.includes(payload.role)) {
      return res.status(403).json({
        message: "Administrator access required.",
      });
    }

    const admin = await AdminUser.findOne({
  _id: payload.id,
  role: { $in: allowedAdminRoles },
}).select("_id email role");

if (!admin) {
  return res.status(401).json({
    message:
      "Administrator account is unavailable.",
  });
}

    req.admin = {
  id: admin._id,
  email: admin.email,
  role: admin.role,
};

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired admin token.",
    });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        message: "Administrator authentication required.",
      });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }

    return next();
  };
}