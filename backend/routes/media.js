import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { executeQuery } from "../database/connection.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
        ),
      );
    }
  },
});

// Upload media file
router.post("/", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { entity_type = "general", entity_id, alt_text, title } = req.body;
    const baseUrl =
      process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    const result = await executeQuery(
      `INSERT INTO media (filename, original_name, mime_type, size, path, url, alt_text, title, uploaded_by, entity_type, entity_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        req.file.path,
        fileUrl,
        alt_text || null,
        title || null,
        req.user.id,
        entity_type,
        entity_id || null,
      ],
    );

    const media = await executeQuery("SELECT * FROM media WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json({
      success: true,
      data: media[0],
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Media upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload file",
    });
  }
});

// Get media files
router.get("/", async (req, res) => {
  try {
    const { entity_type, entity_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = "SELECT * FROM media WHERE is_active = true";
    const params = [];

    if (entity_type) {
      query += " AND entity_type = ?";
      params.push(entity_type);
    }

    if (entity_id) {
      query += " AND entity_id = ?";
      params.push(entity_id);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const media = await executeQuery(query, params);

    // Get total count
    let countQuery =
      "SELECT COUNT(*) as total FROM media WHERE is_active = true";
    const countParams = [];

    if (entity_type) {
      countQuery += " AND entity_type = ?";
      countParams.push(entity_type);
    }

    if (entity_id) {
      countQuery += " AND entity_id = ?";
      countParams.push(entity_id);
    }

    const [{ total }] = await executeQuery(countQuery, countParams);

    res.json({
      success: true,
      data: media,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get media error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch media files",
    });
  }
});

// Get single media file
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const media = await executeQuery(
      "SELECT * FROM media WHERE id = ? AND is_active = true",
      [id],
    );

    if (media.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Media file not found",
      });
    }

    res.json({
      success: true,
      data: media[0],
    });
  } catch (error) {
    console.error("Get media error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch media file",
    });
  }
});

// Update media metadata
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { alt_text, title, entity_type, entity_id } = req.body;

    const media = await executeQuery("SELECT * FROM media WHERE id = ?", [id]);

    if (media.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Media file not found",
      });
    }

    await executeQuery(
      `UPDATE media SET alt_text = ?, title = ?, entity_type = ?, entity_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        alt_text || null,
        title || null,
        entity_type || media[0].entity_type,
        entity_id || null,
        id,
      ],
    );

    const updatedMedia = await executeQuery(
      "SELECT * FROM media WHERE id = ?",
      [id],
    );

    res.json({
      success: true,
      data: updatedMedia[0],
      message: "Media file updated successfully",
    });
  } catch (error) {
    console.error("Update media error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update media file",
    });
  }
});

// Delete media file
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const media = await executeQuery("SELECT * FROM media WHERE id = ?", [id]);

    if (media.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Media file not found",
      });
    }

    // Soft delete - mark as inactive
    await executeQuery("UPDATE media SET is_active = false WHERE id = ?", [id]);

    // Optionally delete physical file
    if (fs.existsSync(media[0].path)) {
      fs.unlinkSync(media[0].path);
    }

    res.json({
      success: true,
      message: "Media file deleted successfully",
    });
  } catch (error) {
    console.error("Delete media error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete media file",
    });
  }
});

export default router;
