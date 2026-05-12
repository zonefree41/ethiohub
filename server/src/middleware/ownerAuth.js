import jwt from "jsonwebtoken";

export function requireOwner(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: "Owner login required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token" });
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