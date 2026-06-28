import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

const storage = multer.memoryStorage();

/**
 * Image upload: max 3MB
 */
const imageUpload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }

    cb(null, true);
  },
});

/**
 * Video upload: max 100MB
 */
const videoUpload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "video/mp4") {
      return cb(new Error("Only MP4 video files are allowed"));
    }

    cb(null, true);
  },
});

function uploadToCloudinary(buffer, resourceType = "image", folder = "hubethio/listings") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

/**
 * POST /api/upload
 * Image upload
 */
router.post("/", imageUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      "image",
      "hubethio/listings"
    );

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("❌ Image upload failed:", err.message);
    res.status(500).json({ message: err.message || "Image upload failed" });
  }
});

/**
 * POST /api/upload/video
 * MP4 video upload
 */
router.post("/video", videoUpload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video uploaded" });
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      "video",
      "hubethio/listings/videos"
    );

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("❌ Video upload failed:", err.message);
    res.status(500).json({ message: err.message || "Video upload failed" });
  }
});

export default router;