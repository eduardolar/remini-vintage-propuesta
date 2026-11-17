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
    // «Vintage Y2K», pero no «Vintage Vintage» cuando la época es justo «Vintage»
    var vintage = !p.epoca || R.normalizar(p.epoca) === "vintage" ? "vintage" : "vintage " + p.epoca;
    ponerMeta(
      "description",
      p.nombre + " de " + p.marca + ", talla " + p.talla + ", estado " + p.estado + ". " +
      (p.descripcion ? p.descripcion + " " : "") +
      "Prenda " + vintage + " única, con envíos a todo el Perú. Resérvala por WhatsApp y paga con Yape o Plin."
    );

    var fotos = [];
    for (var i = 1; i <= (p.fotos || 3); i++) fotos.push(R.urlAbsoluta(R.foto(p.slug, i)));

    var DISPONIBILIDAD = { reservada: "Reserved", vendida: "SoldOut" };
    var GENERO = { Mujer: "female", Hombre: "male", Unisex: "unisex" };
    var datos = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.nombre,
      description: p.descripcion || p.nombre + ", " + vintage + ", estado " + p.estado + ".",
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
        availability: "https://schema.org/" + (DISPONIBILIDAD[p.situacion] || "InStock"),
        // Todo es de segunda mano: un 10/10 «como nueva» sigue siendo usada (NewCondition solo
        // valdría para una prenda sin estrenar, con su etiqueta, y ese dato no existe)
        itemCondition: "https://schema.org/UsedCondition"
      }
    };
    if (GENERO[p.genero]) datos.audience = { "@type": "PeopleAudience", suggestedGender: GENERO[p.genero] };
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(datos);
    document.head.appendChild(script);
  }

  /* ---------- Etiqueta kraft: talla, medidas, estado, detalles, época y para ----------
     Orden por lo que más se pregunta: «¿me queda?» (talla y medidas) y «¿en qué estado está?»
     (estado y detalles) van primero, para que entren en la primera pantalla del móvil; la época
     ya sale sobre la foto y «para quién» se filtra en la portada, así que van al final. */

  function renglon(pares) {
    return '<div class="kraft-renglon">' + pares.map(function (x) {
      return "<dt>" + x[0] + "</dt><dd>" + x[1] + "</dd>";
    }).join("") + "</div>";
  }

  function htmlKraft(p) {
    var real = R.leQueda(p);
    var m = R.medidas(p);
    var est = R.estadoDe(p.estado);
    var medidas = m.lista.length
      ? m.lista.map(function (x) { return x.nombre + " <b>" + R.cm(x.valor) + "</b>"; }).join(" · ") +
        ' <span class="kraft-unidad">' + m.unidad + "</span>"
      : "Pídelas por WhatsApp";
    return (
      '<section class="kraft-ficha" aria-labelledby="kraft-titulo">' +
      '<h2 class="sr" id="kraft-titulo">Talla, medidas y estado</h2>' +
      '<span class="kraft-ojal" aria-hidden="true"></span>' +
      "<dl>" +
      // «Le queda» solo con talla real: «su talla» si coincide; sin el dato, no se inventa
      renglon([["Talla", "<b>" + R.esc(p.talla) + "</b>"]].concat(
        real ? [["Le queda", "<b>" + R.esc(real) + "</b>"]] : String(p.tallaReal || "").trim() ? [["Le queda", "su talla"]] : []
      )) +
      renglon([["Medidas", medidas]]) +
      '<div class="kraft-renglon kraft-estado">' +
      "<dt>Estado</dt><dd>" + R.htmlSello(p.estado, "sello-ficha", true) + (est ? " " + R.esc(est.detalle) : R.esc(p.estado)) + "</dd>" +
      "</div>" +
      renglon([["Detalles", p.notaEstado ? R.esc(p.notaEstado) : "Sin detalles a la vista"]]) +
      renglon([
        ["Época", "<b>" + R.esc(p.epoca || "—") + "</b>"],
        ["Para", p.genero ? "<b>" + R.esc(p.genero) + "</b>" : "—"]
      ]) +
      "</dl>" +
      htmlComoMedir(p) +
      // Los campos que la tienda aún no tiene van inventados: se dice cuáles, en una línea
      '<p class="kraft-nota">Ejemplo: le queda, medidas, detalles y para quién.</p>' +
      "</section>"
    );
  }

  /* «¿Cómo medir?»: se abre en la misma etiqueta, debajo de las medidas (sin saltar a otra
     parte de la página ni repetir el título en una sección aparte): un dibujo y una línea */
  var DIBUJO_ARRIBA =
    '<svg class="dibujo-medir" viewBox="0 0 170 124" role="img" aria-label="Dibujo de una prenda de arriba en plano: hombros de costura a costura, pecho de axila a axila y largo del hombro al bajo">' +
    '<path class="dibujo-prenda" d="M52 16 L34 20 L8 42 L22 58 L36 48 V116 H112 V48 L126 58 L140 42 L114 20 L96 16 Q74 30 52 16 Z"/>' +
    '<g class="dibujo-linea"><path d="M34 8 H114 M34 4 V12 M114 4 V12"/><path d="M36 54 H112 M36 50 V58 M112 50 V58"/><path d="M152 20 V116 M148 20 H156 M148 116 H156"/></g>' +
    '<g class="dibujo-texto" aria-hidden="true"><text x="74" y="3" text-anchor="middle">hombros</text><text x="74" y="70" text-anchor="middle">pecho</text><text x="160" y="72" text-anchor="middle" transform="rotate(-90 160 72)">largo</text></g>' +
    "</svg>";
  var DIBUJO_ABAJO =
    '<svg class="dibujo-medir" viewBox="0 0 170 124" role="img" aria-label="Dibujo de un pantalón en plano: cintura de lado a lado, tiro de la cintura a la entrepierna y largo de la cintura al bajo">' +
    '<path class="dibujo-prenda" d="M40 16 H112 L118 116 H90 L78 54 L74 54 L62 116 H34 Z"/>' +
    '<g class="dibujo-linea"><path d="M40 8 H112 M40 4 V12 M112 4 V12"/><path d="M76 18 V52 M72 18 H80 M72 52 H80"/><path d="M134 16 V116 M130 16 H138 M130 116 H138"/></g>' +
    '<g class="dibujo-texto" aria-hidden="true"><text x="76" y="3" text-anchor="middle">cintura</text><text x="96" y="40" text-anchor="middle">tiro</text><text x="146" y="66" text-anchor="middle" transform="rotate(-90 146 66)">largo</text></g>' +
    "</svg>";

  function htmlComoMedir(p) {
    var abajo = R.esDeAbajo(p);
    return (
      '<details id="como-medir" class="como-medir"><summary>¿Cómo medir?</summary>' +
      '<div class="como-medir-cuerpo">' + (abajo ? DIBUJO_ABAJO : DIBUJO_ARRIBA) +
      '<p class="descripcion">' +
      (abajo
        ? "Con la prenda en plano: cintura de lado a lado, largo de la cintura al bajo por fuera y tiro de la cintura a la entrepierna."
        : "Con la prenda en plano: pecho de axila a axila, largo del hombro al bajo y hombros de costura a costura.") +
      " Compáralas con una prenda tuya que te quede bien.</p>" +
      "</div></details>"
    );
  }

  /* ---------- Pintado ---------- */

  function pintar(p) {
    var total = p.fotos || 3;
    var nombreCat = R.nombreCategoria(p.categoria);
    var urlCat = "index.html#" + p.categoria;
    var reservada = R.esReservada(p);

    var figuras = "";
    var miniaturas = "";
    for (var i = 1; i <= total; i++) {
      figuras +=
        '<figure id="foto-' + i + '">' +
        '<img src="' + R.foto(p.slug, i) + '" alt="' + R.esc(R.alt(p, i)) + '" width="1000" height="1350"' +
        (i === 1 ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">' +
        "</figure>";
      miniaturas +=
        '<li><button type="button" data-foto="' + (i - 1) + '" aria-label="Ver foto ' + i + " de " + total + '"' + (i === 1 ? ' aria-current="true"' : "") + ">" +
        '<img src="' + R.foto(p.slug, i) + '" alt="" width="64" height="80" loading="lazy" decoding="async">' +
        "</button></li>";
    }

    ficha.innerHTML =
      '<nav class="ficha-migas" aria-label="Migas de pan"><ol class="migas">' +
      '<li><a href="index.html" data-volver>Inicio</a></li>' +
      '<li><a href="' + urlCat + '">' + R.esc(nombreCat) + "</a></li>" +
      '<li aria-current="page">' + R.esc(p.nombre) + "</li>" +
      "</ol></nav>" +

      /* Galería antes que la cabecera: en el móvil la foto sale primero; en el ordenador
         la rejilla la pone a la izquierda igual que antes */
      '<section class="galeria" aria-label="Fotos de la prenda">' +
      '<div class="galeria-marco">' +
      '<div class="galeria-pista" tabindex="0" aria-label="Fotos: desliza o usa las flechas">' + figuras + "</div>" +
      // la época ya la lee el lector en la etiqueta kraft: aquí es solo la cinta a la vista
      (p.epoca ? '<span class="etiqueta-epoca" aria-hidden="true">' + R.esc(p.epoca) + "</span>" : "") +
      (reservada ? '<span class="sello sello-reservada" aria-hidden="true">Reservada</span>' : "") +
      "</div>" +
      '<ul class="miniaturas" aria-label="Elegir foto">' + miniaturas + "</ul>" +
      "</section>" +

      /* Marca, nombre con el precio al lado, talla, estado, categoría y envío */
      '<div class="ficha-cabeza">' +
      '<div class="ficha-marca-fila">' +
      '<p class="ficha-marca">' + R.esc(p.marca) + (p.joyita ? ' <span class="etiqueta etiqueta-joyita">Joyita</span>' : "") + "</p>" +
      '<button type="button" class="boton-compartir" data-compartir>' + ICONO_COMPARTIR + '<span class="texto-compartir">Compartir</span></button>' +
      "</div>" +
      '<div class="ficha-titulo">' +
      "<h1>" + R.esc(p.nombre) + "</h1>" +
      '<p class="precio"><span class="sr">Precio: </span>' + R.precio(p.precio) + "</p>" +
      "</div>" +
      htmlKraft(p) +
      (reservada
        ? '<p class="aviso-reservada"><strong>Reservada.</strong> Alguien la tiene apartada. Toca «Avisarme si se libera» y te escribimos por WhatsApp. ' +
          '<span class="etiqueta etiqueta-ejemplo">Ejemplo</span></p>'
        : "") +
      '<div class="envio bloque-ejemplo">' +
      '<p class="envio-cabeza">Envío y pago <span class="etiqueta etiqueta-ejemplo">Ejemplo</span></p>' +
      "<p>Envío Lima S/ __ (24-48 h) · Provincias por Shalom u Olva (2-5 días) · Yape, Plin o transferencia</p>" +
      '<p class="nota-ejemplo">El chat de WhatsApp se abre sin número: en la tienda iría el suyo.</p>' +
      "</div>" +
      "</div>" +

      '<div class="ficha-detalles">' +
      (p.descripcion
        ? "<section><h2>Descripción</h2><p class=\"descripcion\">" + R.esc(p.descripcion) + "</p></section>"
        : "") +
      "<section><h2>Cómo comprar</h2>" +
      '<ol class="mini-pasos">' +
      "<li>" + (reservada ? "Toca «Avisarme si se libera» abajo y te escribimos por WhatsApp si se libera." : "Reservas por WhatsApp con el botón de abajo.") + "</li>" +
      "<li>Pagas con Yape, Plin o transferencia.</li>" +
      "<li>Te llega en 24-48 h en Lima o 2-5 días en provincias.</li>" +
      "</ol></section>" +
      '<p><a class="boton boton-secundario" href="' + urlCat + '">Ver más ' + R.esc(nombreCat.toLowerCase()) + "</a></p>" +
      "</div>";

    actual = p;
    ficha.setAttribute("aria-busy", "false");
    activarGaleria();
    activarComoMedir();
    pintarBarra(p);
    ponerSeo(p);
    R.actualizarBolsa();
  }

  function pintarBarra(p) {
    var barra = document.getElementById("barra");
    document.getElementById("barra-precio").innerHTML = '<span class="sr">Precio: </span>' + R.precio(p.precio);
    var guardar = document.getElementById("barra-guardar");
    var wa = document.getElementById("barra-whatsapp");
    // Reservada: sin «Guardar» y, en vez de reservar, preguntar si se libera
    if (R.esReservada(p)) {
      guardar.hidden = true;
      guardar.removeAttribute("data-guardar");
      wa.href = R.enlaceWhatsApp(R.mensajeAviso(p));
      wa.innerHTML = R.iconoWhatsApp + "Avisarme si se libera";
    } else {
      guardar.setAttribute("data-guardar", p.slug);
      guardar.setAttribute("data-nombre", p.nombre);
      wa.href = R.enlaceWhatsApp(R.mensajeUna(p));
      wa.innerHTML = R.iconoWhatsApp + "Reservar por WhatsApp";
    }
    barra.hidden = false;
  }

  /* Al abrir «¿Cómo medir?», el dibujo se trae a la vista (por encima de la barra fija:
     el CSS deja un scroll-padding del alto de la barra) */
  function activarComoMedir() {
    var medir = ficha.querySelector("#como-medir");
    if (!medir) return;
    medir.addEventListener("toggle", function () {
      if (!medir.open) return;
      var suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      medir.querySelector(".como-medir-cuerpo").scrollIntoView({ block: "nearest", behavior: suave ? "smooth" : "auto" });
    });
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

  /* ---------- Compartir: hoja del sistema en el móvil; si no hay, copiar el enlace ---------- */

  var ICONO_COMPARTIR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';

  var actual = null; // prenda pintada

  function compartir() {
    if (!actual) return;
    var url = R.urlAbsoluta(R.enlacePrenda(actual.slug));
    if (navigator.share) {
      navigator.share({
        title: actual.nombre + " · Remini Vintage",
        text: actual.nombre + " (talla " + actual.talla + ", " + R.precio(actual.precio) + ")",
        url: url
      }).catch(function () { /* cancelado: no pasa nada */ });
      return;
    }
    function aMano() { window.prompt("Copia el enlace de la prenda:", url); }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () {
        R.avisar("Enlace copiado: pégalo donde quieras");
      }, aMano);
    } else {
      aMano();
    }
  }

  /* «Inicio» vuelve a la colección como la dejó (filtros y posición) si viene de ella:
     con «Atrás» del historial y no con un enlace nuevo, que la abriría desde arriba. */
  function vieneDeLaColeccion() {
    try {
      var r = new URL(document.referrer);
      var carpeta = location.pathname.replace(/[^/]*$/, "");
      return r.origin === location.origin && (r.pathname === carpeta || r.pathname === carpeta + "index.html");
    } catch (e) {
      return false;
    }
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
      if (e.target.closest("[data-compartir]")) compartir();
      if (e.target.closest("[data-volver]") && vieneDeLaColeccion() && history.length > 1 &&
          !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
        e.preventDefault();
        history.back();
      }
    });
    cargar();
  });
})();
