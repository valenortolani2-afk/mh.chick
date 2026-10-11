import { del, get, list, put } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";
import { isCategory, type Category, type ProductImage } from "../../../lib/catalog";

export const runtime = "nodejs";

const maximumFileSize = 5 * 1024 * 1024;

const extensionsByContentType: Record<string, string> = {
  "image/avif": "avif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const supportedExtensions = new Set(Object.values(extensionsByContentType));
const maximumDescriptionLength = 500;
const maximumPrice = 99_999_999;

type ProductMetadata = Pick<ProductImage, "category" | "description" | "price">;

function getProductPaths(pathname: string) {
  const parts = pathname.split("/");

  if (parts.length !== 3 || parts[0] !== "products" || !isCategory(parts[1])) {
    return null;
  }

  const fileName = parts[2];
  const extensionIndex = fileName.lastIndexOf(".");
  const extension = fileName.slice(extensionIndex + 1).toLowerCase();

  if (extensionIndex <= 0 || !supportedExtensions.has(extension)) {
    return null;
  }

  return {
    category: parts[1],
    metadataPathname: `products/${parts[1]}/${fileName.slice(0, extensionIndex)}.json`,
  };
}

function parseMetadata(value: unknown, fallbackCategory: Category): ProductMetadata {
  if (
    typeof value !== "object" ||
    value === null ||
    !("category" in value) ||
    !("description" in value) ||
    !("price" in value)
  ) {
    throw new Error("Los metadatos de la publicación no tienen un formato válido.");
  }

  const { category, description, price } = value;
  if (
    typeof category !== "string" ||
    !isCategory(category) ||
    typeof description !== "string" ||
    description.length > maximumDescriptionLength ||
    (price !== null &&
      (typeof price !== "number" ||
        !Number.isFinite(price) ||
        price < 0 ||
        price > maximumPrice))
  ) {
    throw new Error("Los metadatos de la publicación contienen valores inválidos.");
  }

  return { category: category ?? fallbackCategory, description, price };
}

function parsePrice(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > maximumPrice) {
    return null;
  }

  return value;
}

async function getProductMetadata(pathname: string, category: Category): Promise<ProductMetadata> {
  const productPaths = getProductPaths(pathname);
  if (!productPaths) {
    throw new Error("La ruta de la publicación no es válida.");
  }

  const metadataBlob = await get(productPaths.metadataPathname, { access: "public", useCache: false });
  if (!metadataBlob) {
    return { category, description: "", price: null };
  }

  try {
    const metadata = await new Response(metadataBlob.stream).json();
    return parseMetadata(metadata, category);
  } catch (error) {
    console.error(`Unable to read metadata for product ${pathname}.`, error);
    return { category, description: "", price: null };
  }
}

async function saveProductMetadata(pathname: string, metadata: ProductMetadata) {
  const productPaths = getProductPaths(pathname);
  if (!productPaths) {
    throw new Error("La ruta de la publicación no es válida.");
  }

  await put(productPaths.metadataPathname, JSON.stringify(metadata), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "products/" });
    const images = blobs.filter((blob) => getProductPaths(blob.pathname) !== null);
    const products = (
      await Promise.all(
        images.map(async (blob): Promise<ProductImage> => {
          const productPaths = getProductPaths(blob.pathname);
          if (!productPaths) {
            throw new Error(`La ruta de publicación ${blob.pathname} no es válida.`);
          }

          const metadata = await getProductMetadata(blob.pathname, productPaths.category);
          return {
            ...metadata,
            pathname: blob.pathname,
            uploadedAt: new Date().toISOString(),
            url: blob.url,
          };
        }),
      )
    )
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
    const description = formData.get("description");
    const file = formData.get("file");
    const priceInput = formData.get("price");
    const price =
      typeof priceInput === "string" && priceInput.trim() ? parsePrice(Number(priceInput)) : null;

    if (typeof category !== "string" || !isCategory(category)) {
      return NextResponse.json({ error: "Seleccioná una categoría válida." }, { status: 400 });
    }

    if (typeof description !== "string" || !description.trim() || description.trim().length > maximumDescriptionLength) {
      return NextResponse.json(
        { error: `Escribí una descripción de hasta ${maximumDescriptionLength} caracteres.` },
        { status: 400 },
      );
    }

    if (price === null) {
      return NextResponse.json(
        { error: `Ingresá un precio válido de hasta $${maximumPrice.toLocaleString("es-AR")}.` },
        { status: 400 },
      );
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
    const metadata = { category, description: description.trim(), price } satisfies ProductMetadata;

    try {
      await saveProductMetadata(blob.pathname, metadata);
    } catch (error) {
      try {
        await del(blob.url);
      } catch (deleteError) {
        console.error(`Unable to remove product image after metadata failure: ${blob.pathname}.`, deleteError);
      }
      throw error;
    }

    return NextResponse.json(
      {
        product: {
          ...metadata,
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

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { pathname, description } = body;
    const price = parsePrice(body.price);

    if (typeof pathname !== "string" || !getProductPaths(pathname)) {
      return NextResponse.json({ error: "La publicación seleccionada no es válida." }, { status: 400 });
    }

    if (typeof description !== "string" || !description.trim() || description.trim().length > maximumDescriptionLength) {
      return NextResponse.json(
        { error: `Escribí una descripción de hasta ${maximumDescriptionLength} caracteres.` },
        { status: 400 },
      );
    }

    if (price === null) {
      return NextResponse.json(
        { error: `Ingresá un precio válido de hasta $${maximumPrice.toLocaleString("es-AR")}.` },
        { status: 400 },
      );
    }

    const productPaths = getProductPaths(pathname);
    if (!productPaths) {
      return NextResponse.json({ error: "La publicación seleccionada no es válida." }, { status: 400 });
    }

    const image = await get(pathname, { access: "public", useCache: false });
    if (!image) {
      return NextResponse.json({ error: "La publicación ya no existe." }, { status: 404 });
    }

    const metadata = {
      category: productPaths.category,
      description: description.trim(),
      price,
    } satisfies ProductMetadata;
    await saveProductMetadata(pathname, metadata);

    return NextResponse.json({
      product: {
        ...metadata,
        pathname,
        uploadedAt: image.blob.uploadedAt.toISOString(),
        url: image.blob.url,
      } satisfies ProductImage,
    });
  } catch (error) {
    console.error("Unable to update product metadata in Vercel Blob.", error);
    return NextResponse.json(
      { error: "No se pudo modificar la publicación. Intentá nuevamente." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const pathname = body.pathname;
    if (typeof pathname !== "string") {
      return NextResponse.json({ error: "La publicación seleccionada no es válida." }, { status: 400 });
    }

    const productPaths = getProductPaths(pathname);
    if (!productPaths) {
      return NextResponse.json({ error: "La publicación seleccionada no es válida." }, { status: 400 });
    }

    const image = await get(pathname, { access: "public", useCache: false });
    if (!image) {
      return NextResponse.json({ error: "La publicación ya no existe." }, { status: 404 });
    }

    await del([pathname, productPaths.metadataPathname]);
    return NextResponse.json({ pathname });
  } catch (error) {
    console.error("Unable to delete product from Vercel Blob.", error);
    return NextResponse.json(
      { error: "No se pudo eliminar la publicación. Intentá nuevamente." },
      { status: 500 },
    );
  }
}
