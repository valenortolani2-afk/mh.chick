import { list, put } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";
import { categories, isCategory, type ProductImage } from "../../../lib/catalog";

export const runtime = "nodejs";

const maximumFileSize = 5 * 1024 * 1024;

const extensionsByContentType: Record<string, string> = {
  "image/avif": "avif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "products/" });
    const products = blobs
      .map((blob): ProductImage | null => {
        const [, category] = blob.pathname.split("/");

        if (!category || !isCategory(category)) {
          return null;
        }

        return {
          category,
          pathname: blob.pathname,
          uploadedAt: new Date().toISOString(),
          url: blob.url,
        };
      })
      .filter((product): product is ProductImage => product !== null)
      .sort((first, second) => Date.parse(second.uploadedAt) - Date.parse(first.uploadedAt));

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Unable to list product images from Vercel Blob.", error);
    return NextResponse.json(
      { error: "No se pudieron cargar las imágenes. Revisá la configuración de Vercel Blob." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const category = formData.get("category");
    const file = formData.get("file");

    if (typeof category !== "string" || !isCategory(category)) {
      return NextResponse.json({ error: "Seleccioná una categoría válida." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Seleccioná una imagen para subir." }, { status: 400 });
    }

    const extension = extensionsByContentType[file.type];
    if (!extension) {
      return NextResponse.json(
        { error: "Usá una imagen JPG, PNG, WebP o AVIF." },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size > maximumFileSize) {
      return NextResponse.json({ error: "La imagen debe pesar como máximo 5 MB." }, { status: 400 });
    }

    const blob = await put(`products/${category}/${crypto.randomUUID()}.${extension}`, file, {
      access: "public",
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
      contentType: file.type,
    });

    return NextResponse.json(
      {
        product: {
          category,
          pathname: blob.pathname,
          uploadedAt: new Date().toISOString(),
          url: blob.url,
        } satisfies ProductImage,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unable to upload product image to Vercel Blob.", error);
    return NextResponse.json(
      { error: "No se pudo subir la imagen. Revisá la configuración de Vercel Blob." },
      { status: 500 },
    );
  }
}
