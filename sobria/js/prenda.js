/* Remini Vintage · propuesta de rediseño
   Ficha de prenda: prenda.html?p=<slug> */
(function () {
  "use strict";

  var R = window.Remini;
  var ficha;

  function slugPedido() {
    return new URLSearchParams(location.search).get("p") || "";
  }

  function ponerMeta(nombre, contenido) {
    var meta = document.querySelector('meta[name="' + nombre + '"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", nombre);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", contenido);
  }

  /* ---------- SEO de muestra: título, descripción y JSON-LD Product ---------- */

  function ponerSeo(p) {
    document.title = p.nombre + " · Talla " + p.talla + " · " + R.precio(p.precio) + " | Remini Vintage";
    ponerMeta(
      "description",
      p.nombre + " de " + p.marca + ", talla " + p.talla + ", estado " + p.estado + ". " +
      (p.descripcion ? p.descripcion + " " : "") +
      "Vintage " + p.epoca + " única, con envíos a todo el Perú. Resérvala por WhatsApp y paga con Yape o Plin."
    );

    var fotos = [];
    for (var i = 1; i <= (p.fotos || 3); i++) fotos.push(R.urlAbsoluta(R.foto(p.slug, i)));

    var datos = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.nombre,
      description: p.descripcion || p.nombre + " vintage " + p.epoca + ", estado " + p.estado + ".",
      sku: p.slug,
      brand: { "@type": "Brand", name: p.marca },
      size: p.talla,
      category: R.nombreCategoria(p.categoria),
      image: fotos,
      offers: {
        "@type": "Offer",
        url: R.urlAbsoluta(R.enlacePrenda(p.slug)),
        price: Number(p.precio).toFixed(2),
        priceCurrency: "PEN",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/UsedCondition"
      }
    };
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(datos);
    document.head.appendChild(script);
  }

  /* ---------- Medidas según el tipo de prenda (ejemplo) ---------- */

  function medidasEjemplo(p) {
    var piezas = p.categoria === "pantalones" || p.categoria === "shorts"
      ? ["Cintura", "Largo", "Tiro"]
      : ["Pecho", "Largo", "Manga"];
    return piezas.map(function (n) {
      return n + ' <span class="hueco" aria-hidden="true">__</span><span class="sr">sin dato</span> cm';
    }).join(" · ");
  }

  /* ---------- Pintado ---------- */

  function pintar(p) {
    var total = p.fotos || 3;
    var nombreCat = R.nombreCategoria(p.categoria);
    var urlCat = "index.html#" + p.categoria;

    var figuras = "";
    var miniaturas = "";
    for (var i = 1; i <= total; i++) {
      figuras +=
        '<figure id="foto-' + i + '">' +
        '<img src="' + R.foto(p.slug, i) + '" alt="' + R.esc(R.alt(p, i)) + '" width="1000" height="1350"' +
        (i === 1 ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">' +
        "</figure>";
      miniaturas +=
        '<li><button type="button" data-foto="' + (i - 1) + '"' + (i === 1 ? ' aria-current="true"' : "") + ">" +
        '<img src="' + R.foto(p.slug, i) + '" alt="' + R.esc(R.alt(p, i)) + '" width="64" height="80" loading="lazy" decoding="async">' +
        "</button></li>";
    }

    ficha.innerHTML =
      /* Encima del pliegue: marca, nombre con el precio al lado, talla, estado, categoría y envío */
      '<div class="ficha-cabeza">' +
      '<nav aria-label="Migas de pan"><ol class="migas">' +
      '<li><a href="index.html">Inicio</a></li>' +
      '<li><a href="' + urlCat + '">' + R.esc(nombreCat) + "</a></li>" +
      '<li aria-current="page">' + R.esc(p.nombre) + "</li>" +
      "</ol></nav>" +
      '<p class="ficha-marca">' + R.esc(p.marca) + (p.joyita ? ' <span class="etiqueta etiqueta-joyita">Joyita</span>' : "") + "</p>" +
      '<div class="ficha-titulo">' +
      "<h1>" + R.esc(p.nombre) + "</h1>" +
      '<p class="precio"><span class="sr">Precio: </span>' + R.precio(p.precio) + "</p>" +
      "</div>" +
      '<ul class="datos-prenda">' +
      '<li class="dato">Talla <b>' + R.esc(p.talla) + "</b></li>" +
      '<li class="dato">Estado <b>' + R.esc(p.estado) + "</b> · " + R.esc(R.fraseEstado(p.estado)) + "</li>" +
      '<li class="dato">Categoría <a href="' + urlCat + '"><b>' + R.esc(nombreCat) + "</b></a></li>" +
      '<li class="dato">Época <b>' + R.esc(p.epoca) + "</b></li>" +
      "</ul>" +
      '<div class="envio bloque-ejemplo">' +
      '<p class="envio-cabeza">Envío y pago <span class="etiqueta etiqueta-ejemplo">Ejemplo</span></p>' +
      "<p>Envío Lima S/ __ (24-48 h) · Provincias por Shalom u Olva (2-5 días) · Yape, Plin o transferencia</p>" +
      '<p class="nota-ejemplo">Precios y plazos de ejemplo: Leslie pondría los suyos. «Reservar por WhatsApp» abre el chat sin número (número de Leslie).</p>' +
      "</div>" +
      "</div>" +

      '<section class="galeria" aria-label="Fotos de la prenda">' +
      '<div class="galeria-pista" tabindex="0" aria-label="Fotos: desliza o usa las flechas">' + figuras + "</div>" +
      '<ul class="miniaturas" aria-label="Elegir foto">' + miniaturas + "</ul>" +
      "</section>" +

      '<div class="ficha-detalles">' +
      (p.descripcion
        ? "<section><h2>Descripción</h2><p class=\"descripcion\">" + R.esc(p.descripcion) + "</p></section>"
        : "") +
      '<section class="bloque-ejemplo"><h2>Medidas <span class="etiqueta etiqueta-ejemplo">Ejemplo</span></h2>' +
      '<p class="medidas">' + medidasEjemplo(p) + "</p>" +
      '<p class="nota-ejemplo">(ejemplo: Leslie las añadiría al subir la prenda; medidas en plano, de costura a costura)</p></section>' +
      '<section class="bloque-ejemplo"><h2>Defectos <span class="etiqueta etiqueta-ejemplo">Ejemplo</span></h2>' +
      '<p class="descripcion">Defectos: __ (por ejemplo «mancha pequeña en el puño izquierdo», con su foto)</p>' +
      '<p class="nota-ejemplo">(ejemplo: Leslie los añadiría al subir la prenda; si no tiene, «Sin defectos»)</p></section>' +
      "<section><h2>Cómo comprar</h2>" +
      '<ol class="mini-pasos">' +
      "<li>Reservas por WhatsApp con el botón de abajo.</li>" +
      "<li>Pagas con Yape, Plin o transferencia.</li>" +
      "<li>Te llega en 24-48 h en Lima o 2-5 días en provincias.</li>" +
      "</ol></section>" +
      '<p><a class="boton boton-secundario" href="' + urlCat + '">Ver más ' + R.esc(nombreCat.toLowerCase()) + "</a></p>" +
      "</div>";

    ficha.setAttribute("aria-busy", "false");
    activarGaleria();
    pintarBarra(p);
    ponerSeo(p);
    R.actualizarBolsa();
  }

  function pintarBarra(p) {
    var barra = document.getElementById("barra");
    document.getElementById("barra-precio").innerHTML = '<span class="sr">Precio: </span>' + R.precio(p.precio);
    var guardar = document.getElementById("barra-guardar");
    guardar.setAttribute("data-guardar", p.slug);
    guardar.setAttribute("data-nombre", p.nombre);
    var wa = document.getElementById("barra-whatsapp");
    wa.href = R.enlaceWhatsApp(R.mensajeUna(p));
    wa.innerHTML = R.iconoWhatsApp + "Reservar por WhatsApp";
    barra.hidden = false;
  }

  /* ---------- Galería: deslizar en móvil, miniaturas en todas las pantallas ---------- */

  function activarGaleria() {
    var pista = ficha.querySelector(".galeria-pista");
    var botones = Array.prototype.slice.call(ficha.querySelectorAll("[data-foto]"));
    var suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function marcar(i) {
      botones.forEach(function (b, j) {
        if (j === i) b.setAttribute("aria-current", "true");
        else b.removeAttribute("aria-current");
      });
    }

    botones.forEach(function (boton, i) {
      boton.addEventListener("click", function () {
        pista.scrollTo({ left: i * pista.clientWidth, behavior: suave ? "smooth" : "auto" });
        marcar(i);
      });
    });

    var espera = null;
    pista.addEventListener("scroll", function () {
      clearTimeout(espera);
      espera = setTimeout(function () {
        marcar(Math.round(pista.scrollLeft / Math.max(1, pista.clientWidth)));
      }, 60);
    }, { passive: true });
  }

  function noEncontrada() {
    document.title = "Prenda no encontrada · Remini Vintage";
    ficha.setAttribute("aria-busy", "false");
    ficha.innerHTML =
      '<div class="estado" style="grid-column: 1 / -1">' +
      "<h1>Esta prenda ya no está</h1>" +
      "<p>Puede que ya se haya vendido o que el enlace esté incompleto. Cada viernes entran nuevas.</p>" +
      '<a class="boton boton-primario" href="index.html#coleccion">Ver la colección</a>' +
      "</div>";
  }

  function cargar() {
    R.cargarPrendas().then(
      function (prendas) {
        var slug = slugPedido();
        var p = prendas.find(function (x) { return x.slug === slug; });
        if (p) pintar(p);
        else noEncontrada();
      },
      function () {
        ficha.setAttribute("aria-busy", "false");
        ficha.innerHTML = '<div style="grid-column: 1 / -1">' + R.htmlError("La prenda no cargó") + "</div>";
      }
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    ficha = document.querySelector(".ficha");
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-reintentar]")) cargar();
    });
    cargar();
  });
})();
