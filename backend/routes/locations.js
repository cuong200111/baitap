import express from "express";
import { locationsController } from "../controllers/searchController.js";

const router = express.Router();

// Get all provinces/cities
router.get("/", locationsController.getLocations);

// Get districts by province
router.get("/provinces/:province_id/districts", locationsController.getDistricts);

// Get wards by district
router.get("/districts/:district_id/wards", locationsController.getWards);

export default router;
