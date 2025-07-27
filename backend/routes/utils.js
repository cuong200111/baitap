import express from "express";
import { 
  formatPrice, 
  formatDate, 
  formatDateTime,
  generateSlug,
  isValidEmail,
  isValidPhone,
  calculateDiscountPercent,
  truncate,
  capitalize,
  parseJSON,
  generateId,
  isEmpty,
  getFileExtension,
  formatFileSize
} from "../lib/utils.js";
import { healthCheck, apiRequest } from "../lib/network.js";

const router = express.Router();

// Format utilities
router.post("/format", async (req, res) => {
  try {
    const { type, value, options = {} } = req.body;

    let result;
    switch (type) {
      case 'price':
        result = formatPrice(value);
        break;
      case 'date':
        result = formatDate(value);
        break;
      case 'datetime':
        result = formatDateTime(value);
        break;
      case 'slug':
        result = generateSlug(value);
        break;
      case 'truncate':
        result = truncate(value, options.length);
        break;
      case 'capitalize':
        result = capitalize(value);
        break;
      case 'filesize':
        result = formatFileSize(value);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid format type"
        });
    }

    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    console.error("Format utility error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Validation utilities
router.post("/validate", async (req, res) => {
  try {
    const { type, value } = req.body;

    let result;
    switch (type) {
      case 'email':
        result = isValidEmail(value);
        break;
      case 'phone':
        result = isValidPhone(value);
        break;
      case 'empty':
        result = isEmpty(value);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid validation type"
        });
    }

    res.json({
      success: true,
      data: { valid: result }
    });
  } catch (error) {
    console.error("Validation utility error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Generate utilities
router.post("/generate", async (req, res) => {
  try {
    const { type, options = {} } = req.body;

    let result;
    switch (type) {
      case 'id':
        result = generateId(options.length);
        break;
      case 'slug':
        result = generateSlug(options.text);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid generation type"
        });
    }

    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    console.error("Generate utility error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Calculate utilities
router.post("/calculate", async (req, res) => {
  try {
    const { type, values } = req.body;

    let result;
    switch (type) {
      case 'discount':
        result = calculateDiscountPercent(values.original, values.sale);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid calculation type"
        });
    }

    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    console.error("Calculate utility error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Parse utilities
router.post("/parse", async (req, res) => {
  try {
    const { type, value } = req.body;

    let result;
    switch (type) {
      case 'json':
        result = parseJSON(value);
        break;
      case 'file-extension':
        result = getFileExtension(value);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid parse type"
        });
    }

    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    console.error("Parse utility error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Health check utility
router.get("/health-check", async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL parameter is required"
      });
    }

    const healthResult = await healthCheck(url);
    
    res.json({
      success: true,
      data: healthResult
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
