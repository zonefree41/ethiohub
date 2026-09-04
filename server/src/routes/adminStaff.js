import express from "express";
import bcrypt from "bcryptjs";
import AdminUser from "../models/AdminUser.js";
import {
  requireAdmin,
  requireRole,
} from "../middleware/auth.js";

const router = express.Router();

const creatableStaffRoles = [
  "engineer",
  "operations_admin",
  "verification_agent",
  "support_agent",
];

// List staff accounts — Super Admin only
router.get(
  "/",
  requireAdmin,
  requireRole("super_admin"),
  async (_req, res) => {
    try {
      const staff = await AdminUser.find({})
        .select("_id name email role createdAt updatedAt")
        .sort({ createdAt: -1 });

      res.json(staff);
    } catch (err) {
      console.error("Failed to load staff accounts:", err);
      res.status(500).json({
        message: "Failed to load staff accounts.",
      });
    }
  }
);

// Create limited staff account — Super Admin only
router.post(
  "/",
  requireAdmin,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
      } = req.body || {};

      const normalizedEmail =
        typeof email === "string"
          ? email.trim().toLowerCase()
          : "";

      if (!normalizedEmail || !password || !role) {
        return res.status(400).json({
          message: "Email, password, and role are required.",
        });
      }

      if (!creatableStaffRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid staff role.",
        });
      }

      if (typeof password !== "string" || password.length < 10) {
        return res.status(400).json({
          message: "Password must be at least 10 characters.",
        });
      }

      const existing = await AdminUser.findOne({
        email: normalizedEmail,
      });

      if (existing) {
        return res.status(409).json({
          message: "A staff account with this email already exists.",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const staff = await AdminUser.create({
        name:
          typeof name === "string" && name.trim()
            ? name.trim()
            : "Staff",
        email: normalizedEmail,
        passwordHash,
        role,
      });

      res.status(201).json({
        message: "Staff account created successfully.",
        staff: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          createdAt: staff.createdAt,
        },
      });
    } catch (err) {
      console.error("Failed to create staff account:", err);

      if (err?.code === 11000) {
        return res.status(409).json({
          message: "A staff account with this email already exists.",
        });
      }

      res.status(500).json({
        message: "Failed to create staff account.",
      });
    }
  }
);


// Reset staff password — Super Admin only
router.patch(
  "/:id/password",
  requireAdmin,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const { password } = req.body || {};

      if (typeof password !== "string" || password.length < 10) {
        return res.status(400).json({
          message: "Password must be at least 10 characters.",
        });
      }

      const staff = await AdminUser.findById(req.params.id);

      if (!staff) {
        return res.status(404).json({
          message: "Staff account not found.",
        });
      }

      if (staff.role === "super_admin") {
        return res.status(400).json({
          message: "Super Admin password cannot be reset from this endpoint.",
        });
      }

      staff.passwordHash = await bcrypt.hash(password, 12);
      await staff.save();

      res.json({
        message: "Staff password reset successfully.",
      });
    } catch (err) {
      console.error("Failed to reset staff password:", err);
      res.status(500).json({
        message: "Failed to reset staff password.",
      });
    }
  }
);

export default router;
