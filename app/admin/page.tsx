"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { categories, type Category, type ProductImage } from "../../lib/catalog";

type UploadState =
  | { message: string; status: "error" | "success" }
  | { message: ""; status: "idle" };

export default function AdminPage() {
  const [category, setCategory] = useState<Category>(categories[0]);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [state, setState] = useState<UploadState>({ message: "", status: "idle" });
  const [lastUpload, setLastUpload] = useState<ProductImage | null>(null);
  const [products, setProducts] = useState<ProductImage[]>([]);
  const [productsError, setProductsError] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductImage | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingPathname, setDeletingPathname] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        const result = (await response.json()) as { error?: string; products?: ProductImage[] };

        if (!response.ok || !result.products) {
          throw new Error(result.error ?? "No se pudieron cargar las publicaciones.");
        }

        setProducts(result.products);
      } catch (error) {
        setProductsError(
          error instanceof Error ? error.message : "No se pudieron cargar las publicaciones.",
        );
      }
    }

    void loadProducts();
  }, []);

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
      setProducts((currentProducts) => [result.product, ...currentProducts]);
      setState({ message: "Imagen publicada en la galería.", status: "success" });
      form.reset();
      setCategory(categories[0]);
      setDescription("");
    } catch (error) {
      setState({
        message: error instanceof Error ? error.message : "No se pudo subir la imagen.",
        status: "error",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProduct) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const description = formData.get("description");
    const price = Number(formData.get("price"));

    if (typeof description !== "string") {
      return;
    }

    setIsSavingEdit(true);
    setState({ message: "", status: "idle" });

    try {
      const response = await fetch("/api/products", {
        body: JSON.stringify({ description, pathname: editingProduct.pathname, price }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const result = (await response.json()) as { error?: string; product?: ProductImage };

      if (!response.ok || !result.product) {
        throw new Error(result.error ?? "No se pudo modificar la publicación.");
      }

      const updatedProduct = result.product;
      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.pathname === updatedProduct.pathname ? updatedProduct : product,
        ),
      );
      setLastUpload((currentProduct) =>
        currentProduct?.pathname === updatedProduct.pathname ? updatedProduct : currentProduct,
      );
      setEditingProduct(null);
      setState({ message: "Publicación modificada.", status: "success" });
    } catch (error) {
      setState({
        message: error instanceof Error ? error.message : "No se pudo modificar la publicación.",
        status: "error",
      });
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function deleteProduct(product: ProductImage) {
    if (!window.confirm(`¿Querés eliminar esta publicación de ${product.category}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingPathname(product.pathname);
    setState({ message: "", status: "idle" });

    try {
      const response = await fetch("/api/products", {
        body: JSON.stringify({ pathname: product.pathname }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo eliminar la publicación.");
      }

      setProducts((currentProducts) =>
        currentProducts.filter((currentProduct) => currentProduct.pathname !== product.pathname),
      );
      setLastUpload((currentProduct) =>
        currentProduct?.pathname === product.pathname ? null : currentProduct,
      );
      setEditingProduct((currentProduct) =>
        currentProduct?.pathname === product.pathname ? null : currentProduct,
      );
      setState({ message: "Publicación eliminada.", status: "success" });
    } catch (error) {
      setState({
        message: error instanceof Error ? error.message : "No se pudo eliminar la publicación.",
        status: "error",
      });
    } finally {
      setDeletingPathname(null);
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-card" aria-labelledby="admin-title">
        <p className="eyebrow">Mami Helena</p>
        <h1 id="admin-title">Subir una creación</h1>
        <p className="admin-intro">
          Elegí la categoría e imagen, indicá su precio y agregá una descripción. Al publicarla,
          aparecerá automáticamente en la galería.
        </p>

        <form className="upload-form" onSubmit={uploadImage}>
          <fieldset className="category-picker">
            <legend>Categoría</legend>
            <input name="category" type="hidden" value={category} />
            <div aria-label="Elegí la categoría de la creación" className="category-options">
              {categories.map((item) => (
                <button
                  aria-pressed={category === item}
                  className={category === item ? "active" : ""}
                  key={item}
                  onClick={() => setCategory(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <label>
            Foto de la creación
            <input accept="image/avif,image/jpeg,image/png,image/webp" name="file" required type="file" />
          </label>
          <p className="upload-help">Formatos permitidos: JPG, PNG, WebP o AVIF. Máximo 5 MB.</p>

          <label>
            Precio
            <input min="0" name="price" required step="0.01" type="number" />
          </label>

          <label>
            Descripción
            <textarea
              maxLength={500}
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={4}
              value={description}
            />
          </label>
          <p className="upload-help">{description.length}/500 caracteres.</p>

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

        <section aria-labelledby="publications-title" className="publication-manager">
          <h2 id="publications-title">Publicaciones</h2>
          {productsError ? (
            <p className="upload-status error" role="alert">
              {productsError}
            </p>
          ) : products.length === 0 ? (
            <p className="upload-help">Todavía no hay publicaciones para administrar.</p>
          ) : (
            <div className="admin-products">
              {products.map((product) => (
                <article className="admin-product" key={product.pathname}>
                  <div className="admin-product-image">
                    <Image
                      alt={`${product.category}: ${product.description || "creación tejida"}`}
                      fill
                      sizes="112px"
                      src={product.url}
                      unoptimized
                    />
                  </div>
                  <div className="admin-product-content">
                    <p className="admin-product-category">{product.category}</p>
                    <p>{product.description || "Sin descripción"}</p>
                    <strong>
                      {product.price === null
                        ? "Sin precio"
                        : new Intl.NumberFormat("es-AR", {
                            currency: "ARS",
                            style: "currency",
                          }).format(product.price)}
                    </strong>
                    <div className="admin-product-actions">
                      <button
                        className="secondary-button"
                        onClick={() => setEditingProduct(product)}
                        type="button"
                      >
                        Modificar
                      </button>
                      <button
                        className="delete-button"
                        disabled={deletingPathname === product.pathname}
                        onClick={() => void deleteProduct(product)}
                        type="button"
                      >
                        {deletingPathname === product.pathname ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {editingProduct && (
          <section aria-labelledby="edit-publication-title" className="edit-publication">
            <h2 id="edit-publication-title">Modificar publicación</h2>
            <form className="upload-form" onSubmit={saveEdit}>
              <label>
                Precio
                <input
                  defaultValue={editingProduct.price ?? ""}
                  min="0"
                  name="price"
                  required
                  step="0.01"
                  type="number"
                />
              </label>
              <label>
                Descripción
                <textarea
                  defaultValue={editingProduct.description}
                  maxLength={500}
                  name="description"
                  required
                  rows={4}
                />
              </label>
              <div className="admin-product-actions">
                <button className="upload-button" disabled={isSavingEdit} type="submit">
                  {isSavingEdit ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  className="secondary-button"
                  disabled={isSavingEdit}
                  onClick={() => setEditingProduct(null)}
                  type="button"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        )}
      </section>
    </main>
  );
}
