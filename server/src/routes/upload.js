import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }

    cb(null, true);
  },
});

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "hubethio/listings",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("❌ Upload failed:", err.message);
    res.status(500).json({ message: "Image upload failed" });
  }
});

export default router;