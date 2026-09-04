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

// Promote the configured founder admin from legacy admin to super_admin.
// This endpoint cannot promote arbitrary staff accounts.
router.post(
  "/promote-founder",
  requireAdmin,
  async (req, res) => {
    try {
      const configuredAdminEmail =
        process.env.ADMIN_EMAIL?.trim().toLowerCase();

      if (
        !configuredAdminEmail ||
        req.admin.email !== configuredAdminEmail
      ) {
        return res.status(403).json({
          message: "Founder account required.",
        });
      }

      if (req.admin.role === "super_admin") {
        return res.json({
          message: "Founder account is already super admin.",
          role: "super_admin",
        });
      }

      if (req.admin.role !== "admin") {
        return res.status(403).json({
          message: "Only the legacy founder admin can be promoted.",
        });
      }

      const admin = await AdminUser.findByIdAndUpdate(
        req.admin.id,
        {
          $set: {
            role: "super_admin",
          },
        },
        {
          new: true,
        }
      ).select("_id name email role");

      if (!admin) {
        return res.status(404).json({
          message: "Founder account not found.",
        });
      }

      res.json({
        message: "Founder account promoted successfully.",
        staff: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (err) {
      console.error("Failed to promote founder account:", err);
      res.status(500).json({
        message: "Failed to promote founder account.",
      });
    }
  }
);

export default router;
