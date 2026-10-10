"use client";

import { useState } from "react";

const categories = ["Polainas", "Gorros", "Mitones", "Ponchos"] as const;

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
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number] | null>(null);

  function selectCategory(category: (typeof categories)[number]) {
    setSelectedCategory(category);
    document.getElementById("galeria")?.scrollIntoView({ behavior: "smooth" });
  }

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
