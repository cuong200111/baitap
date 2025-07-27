import express from "express";
import { adminController } from "../controllers/adminController.js";

const router = express.Router();

// Serve robots.txt
router.get("/robots.txt", async (req, res) => {
  try {
    // Get robots content
    const mockReq = { protocol: req.protocol, get: (header) => req.get(header) };
    const mockRes = {
      json: (data) => {
        if (data.success && data.data?.content) {
          res.set('Content-Type', 'text/plain');
          res.send(data.data.content);
        } else {
          res.status(500).send('Error generating robots.txt');
        }
      }
    };
    
    await adminController.generateRobots(mockReq, mockRes);
  } catch (error) {
    console.error('Robots.txt error:', error);
    res.status(500).send('Error generating robots.txt');
  }
});

// Serve sitemap.xml
router.get("/sitemap.xml", async (req, res) => {
  try {
    // Get sitemap content
    const mockReq = { protocol: req.protocol, get: (header) => req.get(header) };
    const mockRes = {
      json: (data) => {
        if (data.success && data.data?.content) {
          res.set('Content-Type', 'application/xml');
          res.send(data.data.content);
        } else {
          res.status(500).send('Error generating sitemap.xml');
        }
      }
    };
    
    await adminController.generateSitemap(mockReq, mockRes);
  } catch (error) {
    console.error('Sitemap.xml error:', error);
    res.status(500).send('Error generating sitemap.xml');
  }
});

export default router;
