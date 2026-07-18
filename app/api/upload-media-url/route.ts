import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminApi } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

const allowedFolders = new Set([
  "venues",
  "venues/menus",
  "reels",
  "reels/posters",
  "brand/logo",
]);

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Thiếu Supabase URL hoặc SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function safeFileName(name: string) {
  const clean = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);

  return clean || "upload-file";
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json().catch(() => null);

    const folder = String(body?.folder || "");
    const fileName = safeFileName(String(body?.fileName || "upload.bin"));
    const contentType = String(body?.contentType || "application/octet-stream");

    if (!allowedFolders.has(folder)) {
      return NextResponse.json(
        { ok: false, error: "Folder upload không hợp lệ." },
        { status: 400 },
      );
    }

    const bucket =
      process.env.SUPABASE_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
      "concierge";

    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}-${fileName}`;

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path, {
        upsert: true,
      });

    if (error || !data?.token) {
      throw error || new Error("Không tạo được signed upload URL.");
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({
      ok: true,
      bucket,
      path,
      token: data.token,
      contentType,
      publicUrl: publicData.publicUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Không tạo được đường dẫn upload.",
      },
      { status: 500 },
    );
  }
}