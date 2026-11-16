/* Remini Vintage · propuesta de rediseño
   Portada: categorías, filtros y buscador con el estado en el hash (#casacas&talla=M). */
(function () {
  "use strict";

  var R = window.Remini;
  var CATEGORIAS = ["todas"].concat(R.categorias.map(function (c) { return c.id; }));
  var PRECIOS = {
    "hasta-100": function (p) { return p <= 100; },
    "100-250": function (p) { return p > 100 && p <= 250; },
    "mas-250": function (p) { return p > 250; }
  };
  var ORDEN_TALLAS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

  var prendas = [];
  var estado = vacio();

  var rejilla, resultado, buscar, limpiar, selects;

  function vacio() {
    return { cat: "todas", talla: "", precio: "", marca: "", q: "" };
  }

  function hayFiltros(e) {
    return e.cat !== "todas" || !!e.talla || !!e.precio || !!e.marca || !!e.q;
  }

  /* ---------- Hash: #casacas&talla=M&precio=100-250&marca=Coogi&q=tiger ---------- */

  function leerHash() {
    var h = location.hash.replace(/^#/, "");
    if (!h) return vacio();
    var partes = h.split("&");
    // Un hash que no es de filtros (#coleccion, #como-comprar…) es solo un ancla
    if (partes[0].indexOf("=") === -1 && CATEGORIAS.indexOf(partes[0]) === -1) return null;

    var e = vacio();
    partes.forEach(function (parte) {
      var i = parte.indexOf("=");
      if (i === -1) {
        if (CATEGORIAS.indexOf(parte) !== -1) e.cat = parte;
        return;
      }
      var clave = parte.slice(0, i);
      var valor = "";
      try { valor = decodeURIComponent(parte.slice(i + 1).replace(/\+/g, " ")); } catch (err) { /* hash mal formado */ }
      if (clave === "talla" || clave === "marca" || clave === "q") e[clave] = valor;
      if (clave === "precio" && PRECIOS[valor]) e.precio = valor;
    });
    return e;
  }

  function escribirHash() {
    var url = location.pathname + location.search;
    if (hayFiltros(estado)) {
      var partes = [estado.cat];
      ["talla", "precio", "marca", "q"].forEach(function (k) {
        if (estado[k]) partes.push(k + "=" + encodeURIComponent(estado[k]));
      });
      url += "#" + partes.join("&");
    }
    // replaceState: compartir el enlace sin llenar el historial ni mover la página
    history.replaceState(null, "", url);
  }

  /* ---------- Filtrado ---------- */

  function filtrar(e) {
    e = e || estado;
    var q = R.normalizar(e.q.trim());
    return prendas.filter(function (p) {
      if (e.cat !== "todas" && p.categoria !== e.cat) return false;
      if (e.talla && p.talla !== e.talla) return false;
      if (e.marca && p.marca !== e.marca) return false;
      if (e.precio && !PRECIOS[e.precio](Number(p.precio))) return false;
      if (q && R.normalizar(p.nombre + " " + p.marca).indexOf(q) === -1) return false;
      return true;
    });
  }

  /* Cuántas prendas habría cambiando solo lo indicado (para chips y desplegables) */
  function cuantasCon(cambios) {
    var e = {};
    for (var k in estado) e[k] = estado[k];
    for (var c in cambios) e[c] = cambios[c];
    return filtrar(e).length;
  }

  /* ---------- Pintado ---------- */

  var ICONO_GUARDAR =
    '<svg class="icono-guardar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>' +
    '<svg class="icono-guardada" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';

  function tarjeta(p) {
    return (
      "<li><article class=\"tarjeta\">" +
      '<div class="tarjeta-foto">' +
      '<img src="' + R.foto(p.slug, 1) + '" alt="' + R.esc(R.alt(p, 1)) + '" width="1000" height="1350" loading="lazy" decoding="async">' +
      (p.joyita ? '<span class="etiqueta etiqueta-joyita">Joyita</span>' : "") +
      "</div>" +
      '<div class="tarjeta-cuerpo">' +
      '<p class="tarjeta-marca">' + R.esc(p.marca) + "</p>" +
      '<h3 class="tarjeta-nombre"><a class="enlace-estirado" href="' + R.enlacePrenda(p.slug) + '">' + R.esc(p.nombre) + "</a></h3>" +
      '<p class="tarjeta-datos"><span>Talla ' + R.esc(p.talla) + "</span><span>Estado " + R.esc(p.estado) + "</span></p>" +
      '<div class="tarjeta-pie">' +
      '<p class="precio">' + R.precio(p.precio) + "</p>" +
      '<button type="button" class="boton boton-guardar" data-guardar="' + R.esc(p.slug) + '" data-nombre="' + R.esc(p.nombre) + '" aria-pressed="false" aria-label="Guardar ' + R.esc(p.nombre) + ' en Mi bolsa">' +
      ICONO_GUARDAR + '<span class="texto-guardar">Guardar</span></button>' +
      "</div></div></article></li>"
    );
  }

  /* Tarjeta de muestra: así se vería una prenda ya vendida (no es una prenda real) */
  function tarjetaVendida() {
    return (
      '<li><article class="tarjeta tarjeta-vendida" aria-label="Ejemplo de prenda vendida">' +
      '<div class="tarjeta-foto">' +
      '<img src="img/prendas/casaca-frankio-garage-just-design-2.webp" alt="Ejemplo de prenda vendida: foto reutilizada de la Casaca Frankio Garage, en gris" width="1000" height="1337" loading="lazy" decoding="async">' +
      '<span class="franja-vendida" aria-hidden="true">VENDIDA</span>' +
      "</div>" +
      '<div class="tarjeta-cuerpo">' +
      '<p><span class="etiqueta etiqueta-ejemplo">Ejemplo</span></p>' +
      '<h3 class="tarjeta-nombre">Ejemplo de prenda vendida</h3>' +
      '<p class="tarjeta-datos"><span>Se queda unos días en gris, sin botón, para que se vea que la tienda vende.</span></p>' +
      '<div class="tarjeta-pie"><p class="precio"><span class="sr">Precio anterior </span>S/ 90</p><p class="tarjeta-datos"><strong>Vendida</strong></p></div>' +
      "</div></article></li>"
    );
  }

  /* Sin resultados: decir por qué y dar la salida más útil. Si hay búsqueda y otros filtros
     (p. ej. «audigier» con Casacas elegida), ofrecer buscar lo mismo en todas las prendas. */
  function htmlSinResultados() {
    var q = estado.q.trim();
    var otros = estado.cat !== "todas" || !!estado.talla || !!estado.precio || !!estado.marca;
    var enTodas = q && otros ? filtrar({ cat: "todas", talla: "", precio: "", marca: "", q: q }).length : 0;
    var texto;
    if (q && otros) texto = "«" + R.esc(q) + "» no aparece con los filtros que elegiste.";
    else if (q) texto = "No encontramos «" + R.esc(q) + "». Prueba con la marca o con menos letras: cada viernes entran nuevas.";
    else texto = "No hay prendas con esos filtros. Prueba con otra talla o categoría: cada viernes entran nuevas.";

    return (
      '<li class="estado">' +
      "<h3>Nada por aquí</h3>" +
      "<p>" + texto + "</p>" +
      (enTodas
        ? '<button type="button" class="boton boton-primario" data-buscar-en-todas>Ver «' + R.esc(q) + "» en todas (" + enTodas + ")</button>" +
          '<button type="button" class="boton boton-secundario" data-limpiar>Ver todas las prendas</button>'
        : '<button type="button" class="boton boton-primario" data-limpiar>Ver todas las prendas</button>') +
      "</li>"
    );
  }

  /* Desplegables: cada opción dice cuántas prendas daría y las que darían 0 se desactivan
     (en vez de dejar elegirlas y enseñar «Nada por aquí»). La opción vacía, cuando hay
     algo elegido, dice «Todas las tallas» para que se entienda que quita el filtro. */
  var VACIAS = {
    talla: ["Talla", "Todas las tallas"],
    precio: ["Precio", "Todos los precios"],
    marca: ["Marca", "Todas las marcas"]
  };
  function ponerCuentas(select, k) {
    Array.prototype.forEach.call(select.options, function (o) {
      if (!o.hasAttribute("data-texto")) o.setAttribute("data-texto", o.textContent);
      var base = o.getAttribute("data-texto");
      if (!o.value) {
        o.textContent = VACIAS[k] ? VACIAS[k][select.value ? 1 : 0] : base;
        return;
      }
      var cambio = {};
      cambio[k] = o.value;
      var n = cuantasCon(cambio);
      var elegida = o.value === select.value;
      // la elegida va sin número: es lo que se ve con el desplegable cerrado
      o.textContent = elegida ? base : base + " (" + n + ")";
      o.disabled = n === 0 && !elegida;
    });
  }

  function pintar() {
    var lista = filtrar();
    var conFiltros = hayFiltros(estado);

    if (!lista.length) {
      rejilla.innerHTML = htmlSinResultados();
    } else {
      rejilla.innerHTML = lista.map(tarjeta).join("") + (conFiltros ? "" : tarjetaVendida());
    }
    rejilla.setAttribute("aria-busy", "false");

    var n = lista.length;
    var texto = n + (n === 1 ? " prenda" : " prendas");
    if (estado.cat !== "todas") texto += " en " + R.nombreCategoria(estado.cat);
    if (conFiltros) texto += " de " + prendas.length;
    resultado.textContent = texto;

    document.querySelectorAll(".chip[data-cat]").forEach(function (chip) {
      chip.setAttribute("aria-pressed", chip.getAttribute("data-cat") === estado.cat ? "true" : "false");
    });
    // Las cuentas de los chips tienen en cuenta talla, precio, marca y búsqueda:
    // con «audigier» escrito, «Camisas 1» y «Casacas 0» dicen dónde está antes de tocar
    document.querySelectorAll("[data-cuenta]").forEach(function (el) {
      el.textContent = String(cuantasCon({ cat: el.getAttribute("data-cuenta") }));
    });
    selects.forEach(function (s) {
      var k = s.getAttribute("data-filtro");
      s.value = estado[k];
      if (s.value !== estado[k]) s.value = ""; // valor del hash que no existe
      s.classList.toggle("activo", !!s.value);
      ponerCuentas(s, k);
    });
    if (buscar.value !== estado.q) buscar.value = estado.q;
    limpiar.hidden = !conFiltros;

    // Botón «Filtrar» del móvil: cuántos filtros hay puestos (categoría, talla, precio, marca y búsqueda)
    var activos = (estado.cat !== "todas" ? 1 : 0) + ["talla", "precio", "marca", "q"].filter(function (k) { return !!estado[k]; }).length;
    var cuenta = document.querySelector("[data-filtros-activos]");
    var cuentaTexto = document.querySelector("[data-filtros-activos-texto]");
    if (cuenta) {
      cuenta.textContent = activos ? String(activos) : "";
      cuenta.hidden = activos === 0;
      cuentaTexto.textContent = activos ? ", " + activos + (activos === 1 ? " filtro activo" : " filtros activos") : "";
    }

    R.actualizarBolsa();
  }

  function cambiar(cambios) {
    for (var k in cambios) estado[k] = cambios[k];
    escribirHash();
    pintar();
  }

  /* ---------- Opciones de talla y marca a partir de los datos ---------- */

  function rellenarOpciones() {
    var tallas = [];
    var marcas = [];
    prendas.forEach(function (p) {
      if (tallas.indexOf(p.talla) === -1) tallas.push(p.talla);
      if (marcas.indexOf(p.marca) === -1) marcas.push(p.marca);
    });
    tallas.sort(function (a, b) {
      var rango = function (t) {
        var i = ORDEN_TALLAS.indexOf(t);
        if (i !== -1) return i;
        if (/^\d+$/.test(t)) return 100 + Number(t);
        return 1000; // "Estándar" al final
      };
      return rango(a) - rango(b);
    });
    marcas.sort(function (a, b) { return a.localeCompare(b, "es"); });

    var talla = document.getElementById("f-talla");
    var marca = document.getElementById("f-marca");
    talla.insertAdjacentHTML("beforeend", tallas.map(function (t) {
      return '<option value="' + R.esc(t) + '">' + (t === "Estándar" ? "Estándar" : "Talla " + R.esc(t)) + "</option>";
    }).join(""));
    marca.insertAdjacentHTML("beforeend", marcas.map(function (m) {
      return '<option value="' + R.esc(m) + '">' + R.esc(m) + "</option>";
    }).join(""));
    // Las cuentas de chips y desplegables las pone pintar(), según los demás filtros
  }

  /* ---------- Posición al volver ----------
     Las prendas se pintan después de cargar el JSON, cuando el navegador ya intentó
     restaurar el scroll (y antes se forzaba ir a la colección con filtros). Se guarda la
     posición al salir y se recupera al volver con «Atrás» o al recargar. */

  var CLAVE_POSICION = "remini-propuesta-posicion";

  function guardarPosicion() {
    try {
      sessionStorage.setItem(CLAVE_POSICION, JSON.stringify({ url: location.href, y: window.scrollY }));
    } catch (e) { /* sin almacenamiento */ }
  }

  function restaurarPosicion() {
    var tipo = "navigate";
    try { tipo = performance.getEntriesByType("navigation")[0].type; } catch (e) { /* navegador antiguo */ }
    if (tipo !== "back_forward" && tipo !== "reload") return false;
    var guardada = null;
    try { guardada = JSON.parse(sessionStorage.getItem(CLAVE_POSICION) || "null"); } catch (e) { /* nada */ }
    if (!guardada || guardada.url !== location.href || !(guardada.y > 0)) return false;
    window.scrollTo({ top: guardada.y, behavior: "instant" });
    return true;
  }

  /* ---------- Arranque ---------- */

  function cargar() {
    rejilla.setAttribute("aria-busy", "true");
    rejilla.innerHTML = '<li class="estado"><span class="cargando" aria-hidden="true"></span><p>Cargando prendas…</p></li>';
    resultado.textContent = "Cargando prendas…";

    R.cargarPrendas().then(
      function (datos) {
        prendas = datos;
        rellenarOpciones();

        var desdeHash = leerHash();
        if (desdeHash) estado = desdeHash;

        // Búsqueda que llega desde la ficha: index.html?q=tiger → #todas&q=tiger
        var q = new URLSearchParams(location.search).get("q");
        if (q) {
          estado.q = q;
          history.replaceState(null, "", location.pathname);
          escribirHash();
        }

        pintar();

        // Al volver desde una ficha (o recargar), seguir donde estaba; si no, un enlace
        // compartido con filtros lleva directamente a la colección
        if (!restaurarPosicion() && hayFiltros(estado)) document.getElementById("coleccion").scrollIntoView();
      },
      function () {
        rejilla.setAttribute("aria-busy", "false");
        rejilla.innerHTML = "<li style=\"grid-column:1/-1\">" + R.htmlError("Las prendas no cargaron") + "</li>";
        resultado.textContent = "Error al cargar las prendas";
      }
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    rejilla = document.getElementById("rejilla");
    resultado = document.getElementById("resultado");
    buscar = document.getElementById("buscar");
    limpiar = document.querySelector(".resumen [data-limpiar]");
    selects = Array.prototype.slice.call(document.querySelectorAll("[data-filtro]"));

    document.querySelectorAll(".chip[data-cat]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        cambiar({ cat: chip.getAttribute("data-cat") });
      });
    });

    selects.forEach(function (s) {
      s.addEventListener("change", function () {
        var c = {};
        c[s.getAttribute("data-filtro")] = s.value;
        cambiar(c);
      });
    });

    buscar.addEventListener("input", function () {
      if (prendas.length) cambiar({ q: buscar.value });
    });
    buscar.form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (prendas.length) cambiar({ q: buscar.value });
      // En el móvil, cerrar el teclado: si no, tapa media lista de resultados
      if (window.matchMedia("(pointer: coarse)").matches) buscar.blur();
      document.getElementById("coleccion").scrollIntoView();
    });

    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-limpiar]")) {
        estado = vacio();
        escribirHash();
        pintar();
        document.querySelector('.chip[data-cat="todas"]').focus();
      }
      if (e.target.closest("[data-buscar-en-todas]")) {
        estado = { cat: "todas", talla: "", precio: "", marca: "", q: estado.q };
        escribirHash();
        pintar();
        document.querySelector('.chip[data-cat="todas"]').focus();
      }
      if (e.target.closest("[data-reintentar]")) cargar();
    });

    window.addEventListener("pagehide", guardarPosicion);

    /* «Filtrar» (móvil): visible solo dentro de la colección y con los filtros fuera de la vista */
    var irAFiltros = document.querySelector("[data-ir-a-filtros]");
    var controles = document.querySelector(".controles");
    if (irAFiltros && controles && "IntersectionObserver" in window) {
      var verControles = true;
      var verColeccion = false;
      var ponerFiltrar = function () { irAFiltros.hidden = verControles || !verColeccion; };
      new IntersectionObserver(function (e) { verControles = e[0].isIntersecting; ponerFiltrar(); }).observe(controles);
      new IntersectionObserver(function (e) { verColeccion = e[0].isIntersecting; ponerFiltrar(); }, { rootMargin: "0px 0px -80px 0px" })
        .observe(document.getElementById("rejilla"));
      irAFiltros.addEventListener("click", function () {
        var suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        controles.scrollIntoView({ block: "start", behavior: suave ? "smooth" : "auto" });
        var chip = document.querySelector('.chip[aria-pressed="true"]') || document.querySelector(".chip[data-cat]");
        if (chip) chip.focus({ preventScroll: true });
      });
    }

    // Atrás/adelante o hash editado a mano
    window.addEventListener("hashchange", function () {
      var e = leerHash();
      if (e && prendas.length) {
        estado = e;
        pintar();
      }
    });

    cargar();
  });
})();
