"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { categories, type Category, type ProductImage } from "../lib/catalog";

const posts = [
  "https://www.instagram.com/mh.chick/p/Ci8Tg_ZP78J/embed/",
  "https://www.instagram.com/mh.chick/reel/DMa4g7mPvn9/embed/",
  "https://www.instagram.com/mh.chick/reel/DJsJ3GgvgUK/embed/",
  "https://www.instagram.com/mh.chick/reel/DGwOfeNPTpo/embed/",
  "https://www.instagram.com/mh.chick/p/C_tANj-RnVg/embed/",
  "https://www.instagram.com/mh.chick/p/C82oaf-xcrb/embed/",
  "https://www.instagram.com/mh.chick/p/C64Ssrlx1v5/embed/",
  "https://www.instagram.com/mh.chick/p/C5J70P7RebW/embed/",
  "https://www.instagram.com/mh.chick/p/C04oDcLx95y/embed/",
  "https://www.instagram.com/mh.chick/p/CzV-WnyrbAH/embed/",
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<ProductImage[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        const result = (await response.json()) as { error?: string; products?: ProductImage[] };

        if (!response.ok || !result.products) {
          throw new Error(result.error ?? "No se pudieron cargar las creaciones.");
        }

        setProducts(result.products);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "No se pudieron cargar las creaciones.");
      }
    }

    void loadProducts();
  }, []);

  function selectCategory(category: Category) {
    setSelectedCategory(category);
    document.getElementById("galeria")?.scrollIntoView({ behavior: "smooth" });
  }

  const visibleProducts = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : products;

  return (
    <main>
      <section className="hero">
        <p className="eyebrow">Hecho a mano, punto por punto</p>
        <h1>
          Abrigo que
          <span> abraza historias.</span>
        </h1>
        <p className="intro">
          Prendas tejidas y accesorios 100% artesanales, creados con amor para acompañarte todos los días.
        </p>
        <div className="category-buttons" aria-label="Categorías de productos">
          {categories.map((category) => (
            <button
              className={selectedCategory === category ? "active" : ""}
              key={category}
              onClick={() => selectCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
        <a className="cta" href="https://walink.co/f5d465" rel="noreferrer" target="_blank">
          Consultar por WhatsApp <span aria-hidden="true">↗</span>
        </a>
      </section>

      <section aria-labelledby="galeria-titulo" className="gallery-section" id="galeria">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Desde nuestro taller</p>
            <h2 id="galeria-titulo">
              {selectedCategory ? `${selectedCategory} en nuestra colección` : "Últimas creaciones"}
            </h2>
          </div>
          {selectedCategory && (
            <button className="clear-filter" onClick={() => setSelectedCategory(null)} type="button">
              Ver todo
            </button>
          )}
        </div>
        {visibleProducts.length > 0 ? (
          <div className="gallery">
            {visibleProducts.map((product, index) => (
              <article className="product-card" key={product.pathname}>
                <div className="post product-image">
                  <Image
                    alt={`${product.category}: ${product.description || "creación tejida por Mami Helena"}`}
                    fill
                    priority={index < 3}
                    sizes="(max-width: 520px) 100vw, (max-width: 850px) 50vw, 20vw"
                    src={product.url}
                    unoptimized
                  />
                </div>
                {(product.description || product.price !== null) && (
                  <div className="product-details">
                    {product.description && <p>{product.description}</p>}
                    {product.price !== null && (
                      <strong>
                        {new Intl.NumberFormat("es-AR", {
                          currency: "ARS",
                          style: "currency",
                        }).format(product.price)}
                      </strong>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : selectedCategory ? (
          <p className="gallery-message">Todavía no hay creaciones publicadas en esta categoría.</p>
        ) : loadError ? (
          <p className="gallery-message" role="alert">
            {loadError}
          </p>
        ) : (
          <div className="gallery">
            {posts.map((post, index) => (
              <article className="post" key={post}>
                <iframe
                  allowFullScreen
                  loading={index > 2 ? "lazy" : "eager"}
                  src={post}
                  title={`Publicación ${index + 1} de Mami Helena`}
                />
              </article>
            ))}
          </div>
        )}
      </section>

      <footer>
        <p>© {new Date().getFullYear()} Mami Helena</p>
        <a href="https://www.instagram.com/mh.chick/" rel="noreferrer" target="_blank">
          Seguinos en Instagram ↗
        </a>
      </footer>
    </main>
  );
}
