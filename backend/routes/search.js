import express from "express";
import { searchController } from "../controllers/searchController.js";

const router = express.Router();

// Autocomplete search
router.get("/autocomplete", searchController.autocomplete);

// Full search
router.get("/", searchController.search);

export default router;
