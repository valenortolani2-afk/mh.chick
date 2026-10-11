"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { categories, type Category, type ProductImage } from "../../lib/catalog";

type UploadState =
  | { message: string; status: "error" | "success" }
  | { message: ""; status: "idle" };

export default function AdminPage() {
  const [category, setCategory] = useState<Category>(categories[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [state, setState] = useState<UploadState>({ message: "", status: "idle" });
  const [lastUpload, setLastUpload] = useState<ProductImage | null>(null);

  async function uploadImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsUploading(true);
    setState({ message: "", status: "idle" });

    try {
      const response = await fetch("/api/products", { body: formData, method: "POST" });
      const result = (await response.json()) as
        | { error: string }
        | { product: ProductImage };

      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "No se pudo subir la imagen.");
      }

      setLastUpload(result.product);
      setState({ message: "Imagen publicada en la galería.", status: "success" });
      form.reset();
      setCategory(categories[0]);
    } catch (error) {
      setState({
        message: error instanceof Error ? error.message : "No se pudo subir la imagen.",
        status: "error",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-card" aria-labelledby="admin-title">
        <p className="eyebrow">Mami Helena</p>
        <h1 id="admin-title">Subir una creación</h1>
        <p className="admin-intro">
          Elegí la categoría e imagen. Al publicarla, aparecerá automáticamente en la galería.
        </p>

        <form className="upload-form" onSubmit={uploadImage}>
          <label>
            Categoría
            <select
              name="category"
              onChange={(event) => setCategory(event.target.value as Category)}
              value={category}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Foto de la creación
            <input accept="image/avif,image/jpeg,image/png,image/webp" name="file" required type="file" />
          </label>
          <p className="upload-help">Formatos permitidos: JPG, PNG, WebP o AVIF. Máximo 5 MB.</p>

          <button className="upload-button" disabled={isUploading} type="submit">
            {isUploading ? "Publicando..." : "Publicar imagen"}
          </button>
        </form>

        {state.status !== "idle" && (
          <p aria-live="polite" className={`upload-status ${state.status}`} role="status">
            {state.message}
          </p>
        )}

        {lastUpload && (
          <figure className="last-upload">
            <Image
              alt={`Última creación: ${lastUpload.category}`}
              fill
              sizes="(max-width: 640px) 100vw, 520px"
              src={lastUpload.url}
              unoptimized
            />
            <figcaption>{lastUpload.category}</figcaption>
          </figure>
        )}
      </section>
    </main>
  );
}
