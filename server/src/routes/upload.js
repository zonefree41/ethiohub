import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { fileTypeFromBuffer } from "file-type";

const router = express.Router();

const storage = multer.memoryStorage();

/**
 * Image upload: max 10MB
 */
const imageUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ];

  if (!allowedImageTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "Only JPEG, PNG, WebP, HEIC, and HEIF images are allowed"
      )
    );
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

    const detectedType =
  await fileTypeFromBuffer(req.file.buffer);

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

if (
  !detectedType ||
  !allowedImageTypes.includes(detectedType.mime)
) {
  return res.status(400).json({
    message:
      "Uploaded file content is not a supported image.",
  });
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

    const detectedType =
  await fileTypeFromBuffer(req.file.buffer);

if (
  !detectedType ||
  detectedType.mime !== "video/mp4"
) {
  return res.status(400).json({
    message:
      "Uploaded file content is not a valid MP4 video.",
  });
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

router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "Uploaded file is too large.",
      });
    }

    return res.status(400).json({
      message: err.message || "Upload failed.",
    });
  }

  if (
    err?.message?.includes("Only JPEG") ||
    err?.message?.includes("Only MP4")
  ) {
    return res.status(400).json({
      message: err.message,
    });
  }

  return next(err);
});

export default router;