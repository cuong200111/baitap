import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { getDatabase } from "@/lib/database";

interface MediaFile {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  alt_text?: string;
  title?: string;
  entity_type: string;
  entity_id?: number;
  uploaded_by: number;
  created_at: string;
}

// Helper function to get media files from database
const getMediaFiles = (params?: {
  entity_type?: string;
  entity_id?: number;
  page?: number;
  limit?: number;
}) => {
  const db = getDatabase();
  let query = "SELECT * FROM media";
  const conditions: string[] = [];
  const values: any[] = [];

  if (params?.entity_type && params.entity_type !== "all") {
    conditions.push("entity_type = ?");
    values.push(params.entity_type);
  }

  if (params?.entity_id) {
    conditions.push("entity_id = ?");
    values.push(params.entity_id);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY created_at DESC";

  if (params?.limit) {
    query += " LIMIT ?";
    values.push(params.limit);

    if (params?.page && params.page > 1) {
      query += " OFFSET ?";
      values.push((params.page - 1) * params.limit);
    }
  }

  const stmt = db.prepare(query);
  return stmt.all(...values) as MediaFile[];
};

export async function GET(request: NextRequest) {
  try {
    // Check if request was aborted
    if (request.signal.aborted) {
      return NextResponse.json(
        { success: false, message: "Request was aborted" },
        { status: 499 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const entity_type = searchParams.get("entity_type");
    const entity_id = searchParams.get("entity_id");

    // Get media files from database
    const mediaFiles = getMediaFiles({
      entity_type,
      entity_id: entity_id ? parseInt(entity_id) : undefined,
      page,
      limit,
    });

    // Check abort signal again before processing
    if (request.signal.aborted) {
      return NextResponse.json(
        { success: false, message: "Request was aborted" },
        { status: 499 },
      );
    }

    // Get total count for pagination
    const db = getDatabase();
    let countQuery = "SELECT COUNT(*) as total FROM media";
    const countConditions: string[] = [];
    const countValues: any[] = [];

    if (entity_type && entity_type !== "all") {
      countConditions.push("entity_type = ?");
      countValues.push(entity_type);
    }

    if (entity_id) {
      countConditions.push("entity_id = ?");
      countValues.push(parseInt(entity_id));
    }

    if (countConditions.length > 0) {
      countQuery += " WHERE " + countConditions.join(" AND ");
    }

    const countStmt = db.prepare(countQuery);
    const totalResult = countStmt.get(...countValues) as { total: number };
    const total = totalResult.total;

    return NextResponse.json({
      success: true,
      data: mediaFiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    // Handle abort error specifically
    if (error instanceof Error && error.name === "AbortError") {
      console.log("Media API request was aborted");
      return NextResponse.json(
        { success: false, message: "Request was cancelled" },
        { status: 499 },
      );
    }

    console.error("Media API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch media files",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entity_type = (formData.get("entity_type") as string) || "general";
    const entity_id = formData.get("entity_id") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 },
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "Only image files are allowed" },
        { status: 400 },
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const filename = `${timestamp}-${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filepath = path.join(uploadDir, filename);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Save to database
    const db = getDatabase();
    const insertStmt = db.prepare(`
      INSERT INTO media (
        filename, original_name, mime_type, size, url,
        entity_type, entity_id, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Check if admin user exists, if not use null for uploaded_by
    let uploadedBy = null;
    try {
      const userStmt = db.prepare(
        "SELECT id FROM users WHERE role = 'admin' LIMIT 1",
      );
      const adminUser = userStmt.get() as { id: number } | undefined;
      uploadedBy = adminUser?.id || null;
    } catch (error) {
      console.warn("Could not find admin user for uploaded_by");
    }

    const result = insertStmt.run(
      filename,
      originalName,
      file.type,
      file.size,
      `/uploads/${filename}`,
      entity_type,
      entity_id ? parseInt(entity_id) : null,
      uploadedBy,
    );

    // Get the created media file
    const getStmt = db.prepare("SELECT * FROM media WHERE id = ?");
    const mediaFile = getStmt.get(result.lastInsertRowid) as MediaFile;

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      data: mediaFile,
    });
  } catch (error) {
    console.error("Media Upload Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload file",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Media ID is required" },
        { status: 400 },
      );
    }

    const mediaId = parseInt(id);

    // Get media file from database
    const db = getDatabase();
    const getStmt = db.prepare("SELECT * FROM media WHERE id = ?");
    const mediaFile = getStmt.get(mediaId) as MediaFile;

    if (!mediaFile) {
      return NextResponse.json(
        { success: false, message: "Media file not found" },
        { status: 404 },
      );
    }

    // Delete file from disk
    const filepath = path.join(
      process.cwd(),
      "public",
      "uploads",
      mediaFile.filename,
    );
    try {
      await fs.unlink(filepath);
    } catch (error) {
      console.warn("Could not delete file from disk:", error);
    }

    // Delete from database
    const deleteStmt = db.prepare("DELETE FROM media WHERE id = ?");
    deleteStmt.run(mediaId);

    return NextResponse.json({
      success: true,
      message: "Media file deleted successfully",
    });
  } catch (error) {
    console.error("Media Delete Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete media file",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
