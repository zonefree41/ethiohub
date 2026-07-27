import jwt from "jsonwebtoken";

export function requireAdmin(req, res, next) {
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

    if (!payload?.id || payload.role !== "admin") {
      return res.status(403).json({
        message: "Administrator access required.",
      });
    }

    req.admin = {
      id: payload.id,
      email: payload.email || "",
      role: payload.role,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired admin token.",
    });
  }
}