import process from "node:process";
import { put } from "@vercel/blob";

function createJsonResponse(body, init = {}) {
  return Response.json(body, {
    headers: {
      "Cache-Control": "no-store",
    },
    ...init,
  });
}

export async function POST(request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return createJsonResponse(
        { message: "Blob token belum dikonfigurasi." },
        { status: 501 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return createJsonResponse(
        { message: "File gambar tidak ditemukan." },
        { status: 400 },
      );
    }

    const blob = await put(`uploads/${Date.now()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });

    return createJsonResponse({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    return createJsonResponse(
      {
        message: "Gagal mengunggah gambar.",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 },
    );
  }
}
