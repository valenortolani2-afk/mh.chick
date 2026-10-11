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
        <a className="cta" href="https://wa.me/5492236203864" rel="noreferrer" target="_blank">
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

      <a
        aria-label="Consultar por WhatsApp"
        className="whatsapp-button"
        href="https://wa.me/5492236203864"
        rel="noreferrer"
        target="_blank"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 3a9 9 0 0 0-7.7 13.65L3 21l4.57-1.22A9 9 0 1 0 12 3Z" />
          <path d="M9.15 8.2c.2-.48.42-.5.7-.5h.45c.14 0 .35.05.44.35l.72 1.7c.09.22.05.4-.07.58l-.35.48c-.11.14-.23.3-.1.54.13.24.58.96 1.24 1.56.85.77 1.57 1 1.8 1.12.24.12.38.1.52-.06l.66-.77c.17-.2.35-.16.58-.08l1.67.78c.26.13.43.2.49.32.06.12.06.72-.17 1.4-.22.67-1.3 1.29-1.8 1.36-.46.06-1.05.09-1.69-.12a15.5 15.5 0 0 1-1.54-.57 12.2 12.2 0 0 1-4.68-4.12c-.29-.4-1.14-1.52-1.14-2.9s.72-2.06.98-2.34Z" />
        </svg>
        <span>WhatsApp</span>
      </a>
    </main>
  );
}
