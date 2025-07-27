import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);
    const db = getDatabase();
    const getStmt = db.prepare("SELECT * FROM media WHERE id = ?");
    const mediaFile = getStmt.get(id) as MediaFile;

    if (!mediaFile) {
      return NextResponse.json(
        { success: false, message: "Media file not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: mediaFile,
    });
  } catch (error) {
    console.error("Media GET Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch media file",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);
    const db = getDatabase();

    // Check if media exists
    const getStmt = db.prepare("SELECT * FROM media WHERE id = ?");
    const mediaFile = getStmt.get(id) as MediaFile;

    if (!mediaFile) {
      return NextResponse.json(
        { success: false, message: "Media file not found" },
        { status: 404 },
      );
    }

    const updateData = await request.json();
    const { alt_text, title } = updateData;

    // Update media file metadata
    const updateStmt = db.prepare(`
      UPDATE media
      SET alt_text = ?, title = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(alt_text, title, id);

    // Get updated media file
    const updatedMedia = getStmt.get(id) as MediaFile;

    return NextResponse.json({
      success: true,
      message: "Media file updated successfully",
      data: updatedMedia,
    });
  } catch (error) {
    console.error("Media PUT Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update media file",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);
    const db = getDatabase();

    // Get media file
    const getStmt = db.prepare("SELECT * FROM media WHERE id = ?");
    const mediaFile = getStmt.get(id) as MediaFile;

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
    deleteStmt.run(id);

    return NextResponse.json({
      success: true,
      message: "Media file deleted successfully",
    });
  } catch (error) {
    console.error("Media DELETE Error:", error);
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
