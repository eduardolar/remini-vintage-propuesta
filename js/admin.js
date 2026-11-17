/* Remini Vintage · propuesta de rediseño
   La trastienda (prototipo del panel): el perchero (inventario con las acciones a un toque),
   colgar una prenda nueva en un solo formulario con su vista previa, y el escaparate (banner).
   Todo vive en memoria y, si se puede, en localStorage de este navegador. No hay servidor. */
(function () {
  "use strict";

  // v2: datos/prendas.json trae ya para quién, talla real, medidas, detalles y situación
  var CLAVE = "remini-admin-demo-v2";
  // La demo de antes (v1) ya no se lee: se borra para no dejar datos huérfanos en el navegador
  try { localStorage.removeItem("remini-admin-demo-v1"); } catch (e) { /* sin almacenamiento */ }
  var MAX_FOTO = 5 * 1024 * 1024;
  var TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"];
  // En singular en el panel; la tienda las enseña en plural (camisas, casacas…). La joyita no es una
  // categoría: es la estrella de una prenda
  var CATEGORIAS = ["Camisa", "Casaca", "Pantalón", "Polo", "Short"];
  var DE_DATOS = { camisas: "Camisa", casacas: "Casaca", pantalones: "Pantalón", polos: "Polo", shorts: "Short" };
  var BANNER_INICIAL = { l1: "Venta de ropa vintage Y2K", l2: "Envíos a todo el Perú", fecha: null };
  // «Quién vende»: de inicio, los textos de ejemplo de la portada (sin nombres de personas)
  var QUIEN_INICIAL = {
    texto: "Desde Lima elegimos una por una prendas vintage y Y2K que no vas a encontrar en otro lado. Cada viernes subimos nuevas; como son piezas únicas, la primera en reservar se la lleva.",
    instagram: "",
    tiktok: "",
    opiniones: [
      { texto: "Aquí iría una opinión real de una clienta, o una captura de su mensaje.", nombre: "", ciudad: "" },
      { texto: "Otra opinión real: cómo le llegó la prenda y si era como en las fotos.", nombre: "", ciudad: "" },
      { texto: "Una más, mejor si es de provincias, para que se vea que el envío funciona.", nombre: "", ciudad: "" }
    ],
    fecha: null
  };
  var MAX_OPINIONES = 6;
  var HOSTS_RED = { instagram: "instagram.com", tiktok: "tiktok.com" };
  // Del 1 (rojo) al 10 (verde), pasando por el amarillo de la marca
  var COLORES_ESTADO = ["#e0452b", "#e6582a", "#ec6c27", "#f08a24", "#f2a72b", "#f2c230", "#d3cc3f", "#a9d24f", "#7fd95f", "#4be283"];
  var NOMBRE_SITUACION = { disponible: "En percha", reservada: "Reservada", vendida: "Vendida" };
  var movReducido = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Medidas típicas en cm, en plano, de ropa holgada vintage/Y2K.
     Arriba (camisas, polos, casacas): pecho de axila a axila, largo desde el hombro y hombros.
     Abajo (pantalones, shorts): cintura de lado a lado, largo exterior y tiro delantero. */
  var LETRAS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  var TIPICAS_ARRIBA = {
    XS: { pecho: 48, largo: 66, hombros: 42 },
    S: { pecho: 51, largo: 69, hombros: 44 },
    M: { pecho: 54, largo: 72, hombros: 47 },
    L: { pecho: 57, largo: 74, hombros: 50 },
    XL: { pecho: 60, largo: 77, hombros: 53 },
    XXL: { pecho: 63, largo: 79, hombros: 56 },
    XXXL: { pecho: 66, largo: 81, hombros: 59 }
  };
  var TIPICAS_ABAJO = {
    XS: { cintura: 36, largo: 100, largoShort: 46, tiro: 26 },
    S: { cintura: 38, largo: 102, largoShort: 48, tiro: 27 },
    M: { cintura: 41, largo: 104, largoShort: 50, tiro: 28 },
    L: { cintura: 44, largo: 106, largoShort: 52, tiro: 29 },
    XL: { cintura: 47, largo: 107, largoShort: 53, tiro: 30 },
    XXL: { cintura: 50, largo: 108, largoShort: 54, tiro: 31 },
    XXXL: { cintura: 53, largo: 109, largoShort: 55, tiro: 32 }
  };

  var $ = function (sel, raiz) { return (raiz || document).querySelector(sel); };
  var $$ = function (sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); };

  function esc(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function precio(n) {
    // espacio duro entre «S/» y la cifra: el precio no se parte
    return "S/ " + Number(n).toLocaleString("es-PE", { maximumFractionDigits: 2 });
  }
  function normalizar(t) {
    return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  function fecha(iso) {
    try {
      return new Date(iso).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
    } catch (e) {
      return new Date(iso).toLocaleString();
    }
  }
  function tamano(bytes) {
    return (bytes / (1024 * 1024)).toLocaleString("es-PE", { maximumFractionDigits: 1 }) + " MB";
  }
  function cm(n) {
    return Number(n).toLocaleString("es-PE", { maximumFractionDigits: 1 });
  }
  /* La escala del estado es la de la tienda: js/escala.js (window.EscalaEstado) */
  function fraseEstado(n) {
    var e = window.EscalaEstado(n);
    return e ? e.frase : "";
  }
  function plural(n, uno, varios) { return n === 1 ? uno : varios; }

  var ICONOS = {
    estrella: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    reloj: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    soltar: '<path d="M8 11V7a4 4 0 0 1 8 0"/><rect x="5" y="11" width="14" height="10" rx="2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    volver: '<path d="M9 7L4 12l5 5"/><path d="M4 12h11a5 5 0 0 1 0 10h-2"/>',
    papelera: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    lapiz: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    corazon: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'
  };
  function icono(nombre) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' + ICONOS[nombre] + "</svg>";
  }

  /* ---------------- Estado ---------------- */

  var estado = null;            // { banner, prendas, categorias }
  var filtro = "todas";         // situación (pegatinas)
  var filtroCat = "todas";      // categoría (chips)
  var busqueda = "";
  var eliminadas = [];          // pila de { prenda, indice }: cada hueco con su «Deshacer»
  var MAX_DESHACER = 10;        // las más antiguas se descuelgan del todo
  var recienId = null;          // la última colgada (no se guarda: solo marca «Recién colgada»)
  var editando = null;          // { id, borrador, inicial }: la ficha abierta para editar una prenda
  var ultimaEdicion = null;     // { id, anterior }: para «Deshacer» los últimos cambios guardados
  var destelloId = null;        // la prenda recién editada brilla un momento
  var retenidas = {};           // id → true: tocadas con un filtro puesto; siguen a la vista (para deshacer) hasta cambiar el filtro
  var fotoBannerGuardada = null;  // foto del escaparate ya guardada (blob: local, dura hasta recargar)
  var fotoBannerPendiente = null; // foto elegida y aún sin guardar
  var fotosElegidas = [];       // [{ archivo, url }]

  function guardar() {
    try {
      var copia = JSON.parse(JSON.stringify(estado));
      // Las URL blob: mueren al recargar: no se guardan
      copia.prendas.forEach(function (p) { if (p.foto && p.foto.indexOf("blob:") === 0) p.foto = null; });
      localStorage.setItem(CLAVE, JSON.stringify(copia));
    } catch (e) { /* sin almacenamiento (modo privado, cuota): sigue en memoria */ }
  }

  function leerGuardado() {
    try {
      return sanear(JSON.parse(localStorage.getItem(CLAVE)));
    } catch (e) { /* datos rotos: se ignoran */ }
    return null;
  }

  var SITUACIONES = ["disponible", "reservada", "vendida"];
  // Solo fotos de la propia web (las blob: no sobreviven a la recarga y otras rutas no se aceptan)
  var FOTO_PROPIA = /^img\/prendas\/[\w-]+\.(webp|jpe?g|png)$/;
  var NOMBRES_MEDIDA = ["pecho", "cintura", "largo", "hombros", "tiro"];
  function sanearMedidas(m) {
    var r = {};
    if (!m || typeof m !== "object" || Array.isArray(m)) return r;
    NOMBRES_MEDIDA.forEach(function (k) {
      var v = Number(m[k]);
      if (typeof m[k] === "number" && v >= 1 && v <= 300) r[k] = v;
    });
    if (Array.isArray(m.aprox)) {
      var aprox = m.aprox.filter(function (k) { return typeof k === "string" && r[k] !== undefined; });
      if (aprox.length) r.aprox = aprox;
    }
    return r;
  }
  function cadena(x) { return typeof x === "string" ? x : ""; }

  // Lo guardado se revisa campo a campo: si algo no cuadra, se corrige o se descarta
  function sanear(v) {
    if (!v || typeof v !== "object" || !Array.isArray(v.prendas)) return null;
    var vistos = {};
    var prendas = v.prendas.filter(function (p) {
      var ok = p && typeof p.id === "string" && p.id && typeof p.nombre === "string" && p.nombre.trim() && !vistos[p.id];
      if (ok) vistos[p.id] = true;
      return ok;
    }).map(function (p) {
      var pr = Number(p.precio);
      var est = parseInt(p.estado, 10);
      return {
        id: p.id,
        nombre: p.nombre,
        marca: cadena(p.marca),
        decada: cadena(p.decada),
        categoria: cadena(p.categoria),
        genero: cadena(p.genero),
        talla: cadena(p.talla),
        tallaReal: cadena(p.tallaReal),
        estado: est >= 1 && est <= 10 ? est : 10,
        notaEstado: cadena(p.notaEstado),
        medidas: sanearMedidas(p.medidas),
        precio: isFinite(pr) && pr > 0 ? pr : 0,
        descripcion: cadena(p.descripcion),
        foto: typeof p.foto === "string" && FOTO_PROPIA.test(p.foto) ? p.foto : null,
        situacion: SITUACIONES.indexOf(p.situacion) !== -1 ? p.situacion : "disponible",
        destacada: p.destacada === true
      };
    });
    // una sola joyita, y nunca una vendida
    var hay = false;
    prendas.forEach(function (p) {
      if (p.destacada && (hay || p.situacion === "vendida")) p.destacada = false;
      if (p.destacada) hay = true;
    });
    var categorias = (Array.isArray(v.categorias) ? v.categorias : []).filter(function (c) { return typeof c === "string" && c.trim(); });
    if (!categorias.length) categorias = CATEGORIAS.slice();
    prendas.forEach(function (p) { if (p.categoria && categorias.indexOf(p.categoria) === -1) categorias.push(p.categoria); });
    var b = v.banner && typeof v.banner === "object" ? v.banner : {};
    return {
      banner: {
        l1: typeof b.l1 === "string" && b.l1.trim() ? b.l1.slice(0, 60) : BANNER_INICIAL.l1,
        l2: typeof b.l2 === "string" ? b.l2.slice(0, 60) : BANNER_INICIAL.l2,
        fecha: typeof b.fecha === "string" && !isNaN(Date.parse(b.fecha)) ? b.fecha : null
      },
      categorias: categorias,
      prendas: prendas,
      quien: sanearQuien(v.quien)
    };
  }

  function copiaQuien(q) { return JSON.parse(JSON.stringify(q)); }
  // Enlace de red: https, del dominio exacto (o con www.) y con un perfil detrás. Devuelve url.href o ""
  function enlaceRed(v, red) {
    if (typeof v !== "string" || !v.trim()) return "";
    try {
      var u = new URL(v.trim());
      var host = u.hostname.toLowerCase();
      if (u.protocol !== "https:" || (host !== HOSTS_RED[red] && host !== "www." + HOSTS_RED[red])) return "";
      if (u.username || u.password || u.port || u.pathname.replace(/\//g, "") === "") return "";
      return u.href;
    } catch (e) { return ""; }
  }
  function enlaceValido(v, red) { return !!enlaceRed(v, red); }
  function sanearQuien(q) {
    if (!q || typeof q !== "object") return copiaQuien(QUIEN_INICIAL);
    var ops = Array.isArray(q.opiniones) ? q.opiniones : [];
    return {
      texto: typeof q.texto === "string" ? q.texto.slice(0, 400) : QUIEN_INICIAL.texto,
      instagram: enlaceRed(q.instagram, "instagram"),
      tiktok: enlaceRed(q.tiktok, "tiktok"),
      opiniones: ops.filter(function (o) { return o && typeof o.texto === "string"; }).slice(0, MAX_OPINIONES).map(function (o) {
        return { texto: o.texto.slice(0, 200), nombre: cadena(o.nombre).slice(0, 40), ciudad: cadena(o.ciudad).slice(0, 40) };
      }),
      fecha: typeof q.fecha === "string" && !isNaN(Date.parse(q.fecha)) ? q.fecha : null
    };
  }

  var GENEROS = ["Mujer", "Hombre", "Unisex"];
  // En datos/prendas.json «aprox: true» vale para todas; el panel guarda la lista de las aproximadas
  function medidasDeDatos(m) {
    if (!m || typeof m !== "object") return {};
    var copia = {};
    NOMBRES_MEDIDA.forEach(function (k) { if (m[k] !== undefined) copia[k] = m[k]; });
    copia.aprox = m.aprox === true ? Object.keys(copia) : m.aprox;
    return sanearMedidas(copia);
  }

  function desdeDatos(prendas) {
    return {
      banner: Object.assign({}, BANNER_INICIAL),
      quien: copiaQuien(QUIEN_INICIAL),
      categorias: CATEGORIAS.slice(),
      prendas: prendas.map(function (p) {
        return {
          id: p.slug,
          nombre: p.nombre,
          marca: p.marca,
          decada: p.epoca || "",
          categoria: DE_DATOS[p.categoria] || p.categoria,
          genero: GENEROS.indexOf(p.genero) !== -1 ? p.genero : "",
          talla: p.talla,
          tallaReal: cadena(p.tallaReal),
          estado: parseInt(p.estado, 10) || 10,
          notaEstado: cadena(p.notaEstado),
          medidas: medidasDeDatos(p.medidas),
          precio: p.precio,
          descripcion: p.descripcion || "",
          foto: "img/prendas/" + p.slug + "-1.webp",
          situacion: SITUACIONES.indexOf(p.situacion) !== -1 ? p.situacion : "disponible",
          destacada: !!p.joyita
        };
      })
    };
  }

  function cargar(forzarDatos) {
    var guardado = forzarDatos ? null : leerGuardado();
    if (guardado) return Promise.resolve(guardado);
    return fetch("datos/prendas.json")
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (datos) { return desdeDatos(datos.prendas || []); });
  }

  /* ---------------- Aviso: bocadillo de WhatsApp ---------------- */

  var aviso = $("#aviso");
  var temporizadorAviso;
  var temporizadorEscribir;
  function avisar(texto) {
    clearTimeout(temporizadorAviso);
    clearTimeout(temporizadorEscribir);
    aviso.innerHTML = "";
    var ahora = new Date();
    var hora = String(ahora.getHours()).padStart(2, "0") + ":" + String(ahora.getMinutes()).padStart(2, "0");
    // vaciar y volver a escribir: los lectores lo leen aunque se repita
    temporizadorEscribir = setTimeout(function () {
      aviso.innerHTML = '<p class="burbuja">' + esc(texto) +
        '<small aria-hidden="true">' + hora + ' <span class="vistos">✓✓</span></small></p>';
    }, 30);
    temporizadorAviso = setTimeout(function () { aviso.innerHTML = ""; }, 4600);
  }

  function errorCampo(campo, mensaje) {
    var hueco = document.getElementById(campo.id + "-error");
    if (hueco) hueco.textContent = mensaje || "";
    if (mensaje) campo.setAttribute("aria-invalid", "true");
    else campo.removeAttribute("aria-invalid");
  }

  function revisarFoto(archivo) {
    if (TIPOS_FOTO.indexOf(archivo.type) === -1) return "«" + archivo.name + "» no es JPG, PNG ni WEBP.";
    if (archivo.size > MAX_FOTO) return "«" + archivo.name + "» pesa " + tamano(archivo.size) + ": el máximo es 5 MB.";
    return "";
  }

  /* ---------------- El escaparate (banner) ---------------- */

  var inputL1 = $("#banner-l1");
  var inputL2 = $("#banner-l2");
  var inputFotoBanner = $("#banner-foto");
  var imgBanner = $("[data-banner-foto]");
  var FOTO_BANNER = "img/portada.webp";

  function contar(input) {
    var cuenta = $('[data-contador-de="' + input.id + '"]');
    var n = input.value.length;
    var max = Number(input.getAttribute("maxlength"));
    cuenta.textContent = n + "/" + max;
    cuenta.classList.toggle("contador-cerca", n >= max - 10);
  }

  function pintarVistaBanner() {
    $("[data-vista-l1]").textContent = inputL1.value || " ";
    $("[data-vista-l2]").textContent = inputL2.value;
    $("[data-vista-l2]").hidden = !inputL2.value.trim();
    contar(inputL1);
    contar(inputL2);
  }

  function marcarPendiente() {
    if (!estado) return;
    var b = estado.banner;
    var cambiado = inputL1.value !== b.l1 || inputL2.value !== b.l2 || !!fotoBannerPendiente;
    $("[data-banner-pendiente]").hidden = !cambiado;
    $("[data-banner-descartar]").hidden = !cambiado;
  }

  function pintarBanner() {
    inputL1.value = estado.banner.l1;
    inputL2.value = estado.banner.l2;
    var t = $("[data-banner-fecha]");
    var f = estado.banner.fecha && !isNaN(Date.parse(estado.banner.fecha)) ? estado.banner.fecha : null;
    t.textContent = f ? fecha(f) : "aún sin cambios en esta demo";
    if (f) t.setAttribute("datetime", f);
    else t.removeAttribute("datetime");
    pintarVistaBanner();
    marcarPendiente();
  }

  [inputL1, inputL2].forEach(function (input) {
    input.addEventListener("input", function () {
      pintarVistaBanner();
      if (input === inputL1 && inputL1.value.trim()) errorCampo(inputL1, "");
      marcarPendiente();
    });
  });

  inputFotoBanner.addEventListener("change", function () {
    var archivo = inputFotoBanner.files[0];
    if (!archivo) return;
    var problema = revisarFoto(archivo);
    if (problema) {
      errorCampo(inputFotoBanner, problema);
      inputFotoBanner.value = "";
      return;
    }
    errorCampo(inputFotoBanner, "");
    if (fotoBannerPendiente) URL.revokeObjectURL(fotoBannerPendiente);
    fotoBannerPendiente = URL.createObjectURL(archivo);
    inputFotoBanner.value = "";
    pintarFotoBanner("con la foto nueva: " + archivo.name);
    marcarPendiente();
    avisar("Foto puesta en la vista previa. Falta guardar el escaparate.");
  });

  function pintarFotoBanner(detalle) {
    imgBanner.src = fotoBannerPendiente || fotoBannerGuardada || FOTO_BANNER;
    imgBanner.alt = "Vista previa del banner " + (detalle || (fotoBannerGuardada ? "con la foto guardada" : "con la foto de portada actual"));
  }

  // Restablecer: fuera las dos fotos locales
  function quitarFotoBanner() {
    if (fotoBannerPendiente) URL.revokeObjectURL(fotoBannerPendiente);
    if (fotoBannerGuardada) URL.revokeObjectURL(fotoBannerGuardada);
    fotoBannerPendiente = null;
    fotoBannerGuardada = null;
    inputFotoBanner.value = "";
    errorCampo(inputFotoBanner, "");
    pintarFotoBanner();
  }

  $("[data-banner-descartar]").addEventListener("click", function () {
    if (!estado) return;
    // descartar vuelve a lo guardado, también a la foto guardada
    if (fotoBannerPendiente) URL.revokeObjectURL(fotoBannerPendiente);
    fotoBannerPendiente = null;
    inputFotoBanner.value = "";
    errorCampo(inputFotoBanner, "");
    pintarFotoBanner();
    errorCampo(inputL1, "");
    pintarBanner();
    avisar("Cambios del escaparate descartados.");
    inputL1.focus();
  });

  $("#form-banner").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!estado) return;
    if (!inputL1.value.trim()) {
      errorCampo(inputL1, "Escribe el texto grande: es lo principal del banner.");
      inputL1.focus();
      return;
    }
    estado.banner.l1 = inputL1.value.trim();
    estado.banner.l2 = inputL2.value.trim();
    estado.banner.fecha = new Date().toISOString();
    var conFoto = !!fotoBannerPendiente;
    if (conFoto) {
      if (fotoBannerGuardada) URL.revokeObjectURL(fotoBannerGuardada);
      fotoBannerGuardada = fotoBannerPendiente;
      fotoBannerPendiente = null;
      pintarFotoBanner();
    }
    guardar();
    pintarBanner();
    avisar(conFoto
      ? "Escaparate guardado. En la demo, la foto nueva se ve hasta que recargues."
      : "Escaparate guardado.");
  });

  /* ---------------- Quién vende ---------------- */

  var formQuien = $("#form-quien");
  var quienTexto = $("#quien-texto");
  var quienIg = $("#quien-instagram");
  var quienTk = $("#quien-tiktok");
  var quienFoto = $("#quien-foto");
  var listaOps = $("[data-opiniones-lista]");
  var ayudaOps = $("[data-opiniones-ayuda]");
  var botonAnadirOp = $("[data-anadir-opinion]");
  var tarjetaOpAnadir = $("[data-opinion-anadir]"); // se mueve al final de la lista en cada pintado
  var vistaQuien = $("[data-vista-quien]");
  var quienBorrador = null;      // lo que se está editando (se guarda al pulsar «Guardar»)
  var fotoQuienGuardada = null;  // blob: local, dura hasta recargar
  var fotoQuienPendiente;        // undefined = sin cambios · null = quitar · texto = foto nueva sin guardar
  var opinionQuitada = null;     // { op, i }: para «Deshacer» en su sitio

  function fotoQuienActual() { return fotoQuienPendiente !== undefined ? fotoQuienPendiente : fotoQuienGuardada; }
  function sinFecha(q) { var c = copiaQuien(q); delete c.fecha; return JSON.stringify(c); }
  function esEjemplo(o) {
    return !o.nombre && !o.ciudad && QUIEN_INICIAL.opiniones.some(function (e) { return e.texto === o.texto; });
  }

  function pintarQuien() {
    quienBorrador = copiaQuien(estado.quien);
    if (typeof fotoQuienPendiente === "string") URL.revokeObjectURL(fotoQuienPendiente);
    fotoQuienPendiente = undefined;
    opinionQuitada = null;
    quienTexto.value = quienBorrador.texto;
    quienIg.value = quienBorrador.instagram;
    quienTk.value = quienBorrador.tiktok;
    quienFoto.value = "";
    [quienTexto, quienIg, quienTk, quienFoto].forEach(function (c) { errorCampo(c, ""); });
    var t = $("[data-quien-fecha]");
    var f = estado.quien.fecha;
    t.textContent = f ? fecha(f) : "aún sin cambios en esta demo";
    if (f) t.setAttribute("datetime", f); else t.removeAttribute("datetime");
    contar(quienTexto);
    pintarOpiniones();
    pintarVistaQuien();
    marcarQuienPendiente();
  }

  function marcarQuienPendiente() {
    if (!estado) return;
    var cambiado = sinFecha(quienBorrador) !== sinFecha(estado.quien) || fotoQuienPendiente !== undefined;
    $("[data-quien-pendiente]").hidden = !cambiado;
    $("[data-quien-descartar]").hidden = !cambiado;
    var hay = !!fotoQuienActual();
    $("[data-quien-quitar-foto]").hidden = !hay;
    $("[data-quien-foto-texto]").textContent = hay ? "Cambiar la foto" : "Poner una foto";
  }

  function pintarOpiniones(foco) {
    var ops = quienBorrador.opiniones;
    var html = ops.map(function (o, i) {
      var n = i + 1;
      return '<li class="opinion-editar">' +
        '<fieldset class="opinion-caja"><legend>Opinión ' + n + "</legend>" +
          '<div class="campo-fila"><label for="op-texto-' + i + '">Qué dice</label>' +
            '<span class="contador" id="op-texto-' + i + '-cuenta">' + o.texto.length + "/200</span></div>" +
          '<textarea class="control" id="op-texto-' + i + '" rows="2" maxlength="200" data-op-campo="texto" data-i="' + i + '" aria-describedby="op-texto-' + i + "-cuenta op-texto-" + i + '-error">' + esc(o.texto) + "</textarea>" +
          '<p id="op-texto-' + i + '-error" class="error-campo"></p>' +
          '<div class="opinion-quien">' +
            '<div class="campo"><label for="op-nombre-' + i + '">Nombre <span class="opcional">(o inicial)</span></label>' +
              '<input class="control" id="op-nombre-' + i + '" maxlength="40" autocomplete="off" data-op-campo="nombre" data-i="' + i + '" value="' + esc(o.nombre) + '"></div>' +
            '<div class="campo"><label for="op-ciudad-' + i + '">Ciudad</label>' +
              '<input class="control" id="op-ciudad-' + i + '" maxlength="40" autocomplete="off" data-op-campo="ciudad" data-i="' + i + '" value="' + esc(o.ciudad) + '"></div>' +
          "</div>" +
          '<div class="opinion-botones">' +
            '<button type="button" class="chip chip-ficha" data-op-mover="-1" data-i="' + i + '"' + (i === 0 ? ' aria-disabled="true"' : "") + ">↑ Subir" +
              '<span class="sr"> la opinión ' + n + "</span></button>" +
            '<button type="button" class="chip chip-ficha" data-op-mover="1" data-i="' + i + '"' + (i === ops.length - 1 ? ' aria-disabled="true"' : "") + ">↓ Bajar" +
              '<span class="sr"> la opinión ' + n + "</span></button>" +
            '<button type="button" class="boton-texto boton-quitar-op" data-op-quitar data-i="' + i + '">Quitar<span class="sr"> la opinión ' + n + "</span></button>" +
          "</div>" +
        "</fieldset></li>";
    });
    if (opinionQuitada) {
      html.splice(Math.min(opinionQuitada.i, html.length), 0,
        '<li class="opinion-quitada"><p>Quitaste una opinión.</p><button type="button" class="boton boton-secundario" data-op-deshacer>Deshacer</button></li>');
    }
    listaOps.innerHTML = html.join("");
    // la tarjeta «+ Añadir opinión», al final de la fila de tarjetas
    var tarjetaAnadir = document.createElement("li");
    tarjetaAnadir.className = "opinion-anadir-li";
    tarjetaAnadir.appendChild(tarjetaOpAnadir);
    listaOps.appendChild(tarjetaAnadir);
    var lleno = ops.length >= MAX_OPINIONES;
    if (lleno) botonAnadirOp.setAttribute("aria-disabled", "true"); else botonAnadirOp.removeAttribute("aria-disabled");
    if (foco) { var el = $(foco, listaOps); if (el) el.focus(); }
  }

  function decirOps(texto) {
    ayudaOps.textContent = "";
    setTimeout(function () { ayudaOps.textContent = texto; }, 30);
  }

  function pintarVistaQuien() {
    var q = quienBorrador;
    var foto = fotoQuienActual();
    var redes = [["Instagram", "instagram"], ["TikTok", "tiktok"]].filter(function (r) { return enlaceValido(q[r[1]], r[1]); });
    var conTexto = q.opiniones.filter(function (o) { return o.texto.trim(); });
    vistaQuien.innerHTML =
      '<p class="titulo-seccion">Quién <span class="resalte">vende</span></p>' +
      '<div class="quien">' +
        (foto
          ? '<div class="hueco-foto hueco-foto-real"><img src="' + esc(foto) + '" alt=""></div>'
          : '<div class="hueco-foto"><img src="img/logo-remini.webp" alt="" width="253" height="256"><p>Aquí va tu foto o la de tu puesto <span class="etiqueta etiqueta-ejemplo">Ejemplo</span></p></div>') +
        '<div class="quien-texto">' +
          (q.texto === QUIEN_INICIAL.texto ? '<p><span class="etiqueta etiqueta-ejemplo">Texto de ejemplo</span></p>' : "") +
          (q.texto.trim() ? "<p>" + esc(q.texto) + "</p>" : "") +
          (redes.length ? '<ul class="redes">' + redes.map(function (r) { return '<li><span class="boton boton-secundario">' + r[0] + "</span></li>"; }).join("") + "</ul>" : "") +
          (conTexto.length ? '<ul class="opiniones">' + conTexto.map(function (o) {
            var pie = esEjemplo(o) ? "Opinión de ejemplo · nombre y ciudad" : [o.nombre, o.ciudad].filter(Boolean).map(esc).join(" · ");
            return '<li class="' + (esEjemplo(o) ? "bloque-ejemplo" : "bloque-opinion") + '"><blockquote><p>«' + esc(o.texto.trim()) + "»</p>" +
              (pie ? "<footer>" + pie + "</footer>" : "") + "</blockquote></li>";
          }).join("") + "</ul>" : "") +
        "</div>" +
      "</div>";
  }

  function alEditarQuien() {
    quienBorrador.texto = quienTexto.value;
    quienBorrador.instagram = quienIg.value.trim();
    quienBorrador.tiktok = quienTk.value.trim();
    contar(quienTexto);
    if (quienTexto.value.trim()) errorCampo(quienTexto, "");
    if (!quienIg.value.trim() || enlaceValido(quienIg.value, "instagram")) errorCampo(quienIg, "");
    if (!quienTk.value.trim() || enlaceValido(quienTk.value, "tiktok")) errorCampo(quienTk, "");
    pintarVistaQuien();
    marcarQuienPendiente();
  }
  [quienTexto, quienIg, quienTk].forEach(function (c) { c.addEventListener("input", alEditarQuien); });
  // los enlaces se revisan al salir del campo
  [[quienIg, "instagram", "https://www.instagram.com/tu-tienda"], [quienTk, "tiktok", "https://www.tiktok.com/@tu-tienda"]].forEach(function (x) {
    x[0].addEventListener("blur", function () {
      var v = x[0].value.trim();
      errorCampo(x[0], v && !enlaceValido(v, x[1]) ? "Pega el enlace completo del perfil, como " + x[2] + " (o déjalo vacío)." : "");
    });
  });

  listaOps.addEventListener("input", function (e) {
    var c = e.target.closest("[data-op-campo]");
    if (!c) return;
    var i = Number(c.getAttribute("data-i"));
    quienBorrador.opiniones[i][c.getAttribute("data-op-campo")] = c.value;
    if (c.getAttribute("data-op-campo") === "texto") {
      $("#op-texto-" + i + "-cuenta").textContent = c.value.length + "/200";
      if (c.value.trim()) errorCampo(c, "");
    }
    pintarVistaQuien();
    marcarQuienPendiente();
  });

  listaOps.addEventListener("click", function (e) {
    var ops = quienBorrador.opiniones;
    var mover = e.target.closest("[data-op-mover]");
    if (mover) {
      if (mover.getAttribute("aria-disabled") === "true") return;
      var i = Number(mover.getAttribute("data-i"));
      var d = Number(mover.getAttribute("data-op-mover"));
      var j = i + d;
      ops.splice(j, 0, ops.splice(i, 1)[0]);
      opinionQuitada = null;
      // el foco sigue al botón pulsado; si en su nuevo sitio no se puede, al otro
      var sigue = (d < 0 && j === 0) || (d > 0 && j === ops.length - 1) ? -d : d;
      pintarOpiniones('[data-op-mover="' + sigue + '"][data-i="' + j + '"]');
      decirOps("Opinión movida al puesto " + (j + 1) + " de " + ops.length + ".");
      pintarVistaQuien();
      marcarQuienPendiente();
      return;
    }
    var quitar = e.target.closest("[data-op-quitar]");
    if (quitar) {
      var k = Number(quitar.getAttribute("data-i"));
      opinionQuitada = { op: ops.splice(k, 1)[0], i: k };
      pintarOpiniones("[data-op-deshacer]");
      decirOps("Opinión quitada. Puedes deshacerlo en su sitio.");
      pintarVistaQuien();
      marcarQuienPendiente();
      return;
    }
    if (e.target.closest("[data-op-deshacer]") && opinionQuitada) {
      if (ops.length >= MAX_OPINIONES) return decirOps("Ya hay " + MAX_OPINIONES + " opiniones: quita otra antes de recuperar esta.");
      var donde = Math.min(opinionQuitada.i, ops.length);
      ops.splice(donde, 0, opinionQuitada.op);
      opinionQuitada = null;
      pintarOpiniones("#op-texto-" + donde);
      decirOps("La opinión vuelve a su sitio.");
      pintarVistaQuien();
      marcarQuienPendiente();
    }
  });

  botonAnadirOp.addEventListener("click", function () {
    var ops = quienBorrador.opiniones;
    if (ops.length >= MAX_OPINIONES) return decirOps("Caben " + MAX_OPINIONES + " opiniones como mucho: quita una para añadir otra.");
    ops.push({ texto: "", nombre: "", ciudad: "" });
    pintarOpiniones("#op-texto-" + (ops.length - 1));
    decirOps("Opinión " + ops.length + " añadida: escribe qué dice.");
    pintarVistaQuien();
    marcarQuienPendiente();
  });

  quienFoto.addEventListener("change", function () {
    var archivo = quienFoto.files[0];
    if (!archivo) return;
    var problema = revisarFoto(archivo);
    quienFoto.value = "";
    if (problema) return errorCampo(quienFoto, problema);
    errorCampo(quienFoto, "");
    if (typeof fotoQuienPendiente === "string") URL.revokeObjectURL(fotoQuienPendiente);
    fotoQuienPendiente = URL.createObjectURL(archivo);
    pintarVistaQuien();
    marcarQuienPendiente();
    avisar("Foto puesta en la vista previa. Falta guardar «Quién vende».");
  });
  $("[data-quien-quitar-foto]").addEventListener("click", function () {
    if (typeof fotoQuienPendiente === "string") URL.revokeObjectURL(fotoQuienPendiente);
    fotoQuienPendiente = fotoQuienGuardada ? null : undefined;
    pintarVistaQuien();
    marcarQuienPendiente();
    quienFoto.focus();
  });

  $("[data-quien-descartar]").addEventListener("click", function () {
    if (!estado) return;
    pintarQuien();
    avisar("Cambios de «Quién vende» descartados.");
    quienTexto.focus();
  });

  formQuien.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!estado) return;
    var q = quienBorrador;
    var errores = [];
    if (!q.texto.trim()) { errorCampo(quienTexto, "Escribe unas líneas de presentación."); errores.push(quienTexto); }
    if (q.instagram && !enlaceValido(q.instagram, "instagram")) {
      errorCampo(quienIg, "Pega el enlace completo del perfil, como https://www.instagram.com/tu-tienda (o déjalo vacío).");
      errores.push(quienIg);
    }
    if (q.tiktok && !enlaceValido(q.tiktok, "tiktok")) {
      errorCampo(quienTk, "Pega el enlace completo del perfil, como https://www.tiktok.com/@tu-tienda (o déjalo vacío).");
      errores.push(quienTk);
    }
    q.opiniones.forEach(function (o, i) {
      if (!o.texto.trim()) {
        var c = $("#op-texto-" + i);
        errorCampo(c, "Escribe la opinión " + (i + 1) + " o quítala.");
        errores.push(c);
      }
    });
    if (errores.length) {
      avisar("Revisa " + (errores.length === 1 ? "el campo marcado" : "los " + errores.length + " campos marcados") + " antes de guardar.");
      errores[0].focus();
      return;
    }
    estado.quien = sanearQuien(Object.assign(copiaQuien(q), { fecha: new Date().toISOString() }));
    var conFoto = fotoQuienPendiente !== undefined;
    if (conFoto) {
      if (fotoQuienGuardada && fotoQuienGuardada !== fotoQuienPendiente) URL.revokeObjectURL(fotoQuienGuardada);
      fotoQuienGuardada = fotoQuienPendiente;
      fotoQuienPendiente = undefined;
    }
    guardar();
    pintarQuien();
    avisar(conFoto && fotoQuienGuardada
      ? "«Quién vende» guardado. En la demo, la foto se ve hasta que recargues."
      : "«Quién vende» guardado.");
  });

  /* ---------------- El perchero (inventario) ---------------- */

  var lista = $("#inv-lista");
  var resumen = $("#inv-resumen");
  var inputBuscar = $("#buscar-inv");
  var botonLimpiar = $("[data-limpiar-filtros]");

  function buscar(id) {
    for (var i = 0; i < estado.prendas.length; i++) if (estado.prendas[i].id === id) return estado.prendas[i];
    return null;
  }

  function htmlFoto(p) {
    return p.foto
      ? '<img src="' + esc(p.foto) + '" alt="" width="400" height="400" loading="lazy" decoding="async">'
      : '<span class="colgada-sin-foto">Sin foto</span>';
  }

  var GIROS = ["-1.4deg", "1deg", "-0.6deg", "1.6deg", "-1deg", "0.5deg"];

  function htmlPrenda(p, i) {
    var id = esc(p.id);
    var nombre = esc(p.nombre);
    var vendida = p.situacion === "vendida";
    var reservada = p.situacion === "reservada";
    var datos = [p.marca, p.categoria].filter(Boolean).map(esc).join(" · ");
    var fuera = retenidas[p.id] && !pasaFiltro(p);
    var nueva = p.id === recienId;

    var acciones = vendida
      ? '<button type="button" class="accion accion-volver" data-accion="vender" data-id="' + id + '">' + icono("volver") +
          '<span><span class="sr">Volver a </span>Disponible<span class="sr"> · ' + nombre + "</span></span></button>"
      : '<button type="button" class="accion accion-reservar" data-accion="reservar" data-id="' + id + '">' + icono(reservada ? "soltar" : "reloj") +
          "<span>" + (reservada ? "Liberar" : "Reservar") + '<span class="sr"> · ' + nombre + "</span></span></button>" +
        '<button type="button" class="accion accion-vender" data-accion="vender" data-id="' + id + '">' + icono("check") +
          '<span><span class="sr">Marcar como </span>Vendida<span class="sr"> · ' + nombre + "</span></span></button>";

    var editada = ultimaEdicion && ultimaEdicion.id === p.id;
    return '<li class="colgada situacion-' + esc(p.situacion) + (p.destacada ? " es-joyita" : "") + (nueva ? " es-nueva" : "") + (fuera ? " fuera-filtro" : "") +
        (p.id === destelloId ? " destello-edicion" : "") +
        '" data-item="' + id + '" tabindex="-1" style="--giro:' + GIROS[i % GIROS.length] + '">' +
      '<article class="colgada-papel" aria-labelledby="n-' + id + '">' +
        '<div class="colgada-foto">' + htmlFoto(p) +
          (reservada ? '<span class="sello sello-reservada" aria-hidden="true">Reservada</span>' : "") +
          (vendida ? '<span class="banda-vendida" aria-hidden="true">Vendida</span>' : "") +
          '<button type="button" class="boton-joyita" data-accion="destacar" data-id="' + id + '" aria-pressed="' + p.destacada + '"' + (vendida ? ' aria-disabled="true"' : "") + ">" +
            icono("estrella") + '<span class="boton-joyita-texto">Joyita</span><span class="sr"> (destacada en la portada) · ' + nombre + "</span></button>" +
        "</div>" +
        '<div class="colgada-pie">' +
          (nueva ? '<span class="cinta-nueva" aria-hidden="true">Recién colgada</span>' : "") +
          (fuera ? '<p class="nota-fuera">Ya no está en este filtro</p>' : "") +
          '<h3 class="colgada-nombre" id="n-' + id + '">' + nombre + "</h3>" +
          '<p class="colgada-datos">' + datos + '<span class="sr"> · ' + NOMBRE_SITUACION[p.situacion] + (p.destacada ? " · Joyita" : "") + "</span></p>" +
          '<div class="colgada-precio"><span class="hilo" aria-hidden="true"></span><p class="etiqueta-precio"><span class="sr">Precio </span>' +
            precio(p.precio) + "<small><span class=\"sr\">Talla </span>" + esc(p.talla) + "</small></p></div>" +
          '<div class="colgada-herramientas">' +
            '<button type="button" class="herramienta" data-accion="editar" data-id="' + id + '">' + icono("lapiz") +
              'Editar<span class="sr"> · ' + nombre + "</span></button>" +
            selloEstado(p.estado) +
            '<button type="button" class="herramienta boton-descolgar" data-accion="eliminar" data-id="' + id + '" aria-label="Descolgar (eliminar) ' + nombre + '">' + icono("papelera") + "</button>" +
          "</div>" +
          (editada ? '<p class="nota-editada">Cambios guardados · <button type="button" class="boton-deshacer-edicion" data-deshacer-edicion="' + id + '">Deshacer' +
            '<span class="sr"> los cambios de ' + nombre + "</span></button></p>" : "") +
        "</div>" +
        '<div class="colgada-acciones' + (vendida ? " una" : "") + '">' + acciones + "</div>" +
      "</article></li>";
  }

  /* Estado en la polaroid: un sello de tinta pequeño, como los de la portada.
     Verde tinta (9-10), tinta azul oscura (7-8), rojo tinta (6 o menos). Sin estado, no se muestra */
  function selloEstado(estadoPrenda) {
    var e = window.EscalaEstado(estadoPrenda);
    if (!e) return "";
    var n = e.n;
    var palabra = e.palabra;
    return '<span class="sello-estado ' + e.tinta + '">' +
      '<span class="sr">· Estado ' + n + " de 10, " + palabra.toLowerCase() + "</span>" +
      '<b aria-hidden="true">' + n + '/10</b><small aria-hidden="true">' +
      // cada palabra en su <span>: en el móvil van una debajo de otra y el sello cabe en la fila
      palabra.split(" ").map(function (x) { return "<span>" + esc(x) + "</span>"; }).join(" ") + "</small></span>";
  }

  function htmlNueva() {
    return '<li class="colgada colgada-vacia">' +
      '<button type="button" class="colgar-nueva" data-abrir-taller aria-haspopup="dialog">' +
        '<span class="colgar-nueva-mas" aria-hidden="true">+</span>' +
        '<span class="colgar-nueva-texto">Colgar prenda nueva</span>' +
        '<span class="colgar-nueva-sub">Fotos, nombre, precio y listo</span>' +
      "</button></li>";
  }

  function htmlEliminada(e) {
    return '<li class="colgada colgada-hueco">' +
      '<p>Descolgaste <strong>' + esc(e.prenda.nombre) + "</strong>.</p>" +
      '<button type="button" class="boton boton-secundario" data-deshacer="' + esc(e.prenda.id) + '">' + icono("volver") +
        'Deshacer<span class="sr"> · ' + esc(e.prenda.nombre) + "</span></button>" +
      "</li>";
  }

  function pasaTexto(p) {
    return !busqueda || normalizar(p.nombre + " " + p.marca + " " + p.categoria).indexOf(busqueda) !== -1;
  }
  function pasaCat(p) { return filtroCat === "todas" || p.categoria === filtroCat; }
  function pasaFiltro(p) {
    if (filtro !== "todas" && p.situacion !== filtro) return false;
    return pasaCat(p) && pasaTexto(p);
  }
  function pasa(p) { return !!retenidas[p.id] || pasaFiltro(p); }
  // Al cambiar de filtro, las retenidas vuelven a filtrarse como las demás
  function soltarRetenidas() { retenidas = {}; }

  var TEXTO_CUENTA = {
    todas: ["en total", "en total"],
    disponible: ["en percha", "en percha"],
    reservada: ["reservada", "reservadas"],
    vendida: ["vendida", "vendidas"]
  };

  function pintarContadores() {
    var c = { todas: estado.prendas.length, disponible: 0, reservada: 0, vendida: 0 };
    estado.prendas.forEach(function (p) { c[p.situacion]++; });
    Object.keys(c).forEach(function (k) {
      $('[data-cuenta="' + k + '"]').textContent = c[k];
      $('[data-texto-cuenta="' + k + '"]').textContent = TEXTO_CUENTA[k][c[k] === 1 ? 0 : 1];
    });
    $$("[data-filtro-estado]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-filtro-estado") === filtro));
    });
  }

  function pintarFiltrosCat() {
    var cuentas = {};
    estado.prendas.forEach(function (p) {
      if (filtro === "todas" || p.situacion === filtro) if (pasaTexto(p)) cuentas[p.categoria] = (cuentas[p.categoria] || 0) + 1;
    });
    var total = Object.keys(cuentas).reduce(function (s, k) { return s + cuentas[k]; }, 0);
    var cats = estado.categorias.filter(function (c) { return cuentas[c] || c === filtroCat; });
    $("[data-cat-filtros]").innerHTML =
      '<li><button type="button" class="chip" data-cat="todas" aria-pressed="' + (filtroCat === "todas") + '">Todas <span class="chip-cuenta">' + total + "</span></button></li>" +
      cats.map(function (c) {
        return '<li><button type="button" class="chip" data-cat="' + esc(c) + '" aria-pressed="' + (filtroCat === c) + '">' + esc(c) +
          ' <span class="chip-cuenta">' + (cuentas[c] || 0) + "</span></button></li>";
      }).join("");
  }

  function hayFiltro() { return filtro !== "todas" || filtroCat !== "todas" || !!busqueda; }

  function pintarInventario() {
    pintarContadores();
    pintarFiltrosCat();
    var visibles = estado.prendas.filter(pasa);
    var html = visibles.map(htmlPrenda);

    // cada hueco «Deshacer» va donde estaba su prenda (entre las que se ven); de atrás adelante para no descolocarlos
    eliminadas.slice().sort(function (a, b) { return b.indice - a.indice; }).forEach(function (e) {
      var antes = estado.prendas.slice(0, e.indice).filter(pasa).length;
      html.splice(antes, 0, htmlEliminada(e));
    });

    if (!visibles.length && !eliminadas.length && hayFiltro()) {
      html.push('<li class="percha-estado">' +
        "<h3>Nada en esta percha</h3>" +
        "<p>Ninguna prenda coincide con lo que elegiste.</p>" +
        '<button type="button" class="boton boton-secundario" data-limpiar-filtros>Ver todas</button>' +
        "</li>");
    } else if (!estado.prendas.length && !eliminadas.length) {
      html.push('<li class="percha-estado">' +
        "<h3>El perchero está vacío</h3>" +
        "<p>Cuelga tu primera prenda con la polaroid de al lado.</p></li>");
    }

    lista.innerHTML = htmlNueva() + html.join("");
    lista.removeAttribute("aria-busy");
    destelloId = null; // el destello solo una vez

    var n = visibles.length;
    var total = estado.prendas.length;
    resumen.textContent = n === total
      ? total + plural(total, " prenda en el perchero", " prendas en el perchero")
      : "Mostrando " + n + " de " + total + plural(total, " prenda", " prendas");
    botonLimpiar.hidden = !hayFiltro();
  }

  function enfocar(id, accion) {
    var item = $('[data-item="' + CSS.escape(id) + '"]');
    if (!item) return;
    var destino = $('[data-accion="' + accion + '"]', item) || $(".accion", item) || item;
    destino.focus();
  }

  function ejecutar(accion, id) {
    var p = buscar(id);
    if (!p) return;
    var mensaje = "";
    // con un filtro puesto, la prenda tocada no desaparece de golpe: así se ve el cambio y se deshace en el sitio
    if (pasa(p)) retenidas[p.id] = true;

    if (accion === "destacar") {
      if (p.destacada) {
        p.destacada = false;
        mensaje = "«" + p.nombre + "» ya no es la joyita.";
      } else {
        if (p.situacion === "vendida") {
          avisar("«" + p.nombre + "» está vendida: no puede ser la joyita.");
          return;
        }
        var antes = estado.prendas.filter(function (x) { return x.destacada; })[0];
        estado.prendas.forEach(function (x) { x.destacada = false; });
        p.destacada = true;
        mensaje = "«" + p.nombre + "» es ahora la joyita: en la tienda se vería destacada" + (antes ? " (en lugar de «" + antes.nombre + "»)." : ".");
      }
    } else if (accion === "reservar") {
      p.situacion = p.situacion === "reservada" ? "disponible" : "reservada";
      mensaje = p.situacion === "reservada" ? "«" + p.nombre + "» queda reservada." : "«" + p.nombre + "» vuelve a la percha.";
    } else if (accion === "vender") {
      p.situacion = p.situacion === "vendida" ? "disponible" : "vendida";
      if (p.situacion === "vendida") {
        mensaje = "¡Vendida! «" + p.nombre + "»: en la tienda se vería en gris.";
        if (p.destacada) {
          p.destacada = false;
          mensaje += " Ya no es la joyita.";
        }
      } else {
        mensaje = "«" + p.nombre + "» vuelve a la percha.";
      }
    } else if (accion === "eliminar") {
      // sin «¿Seguro?»: se descuelga al momento y el hueco ofrece «Deshacer» en su sitio
      delete retenidas[p.id];
      eliminar(p);
      return;
    }

    guardar();
    pintarInventario();
    avisar(mensaje);
    enfocar(id, accion);
  }

  function soltarBlob(p) {
    if (p && p.foto && p.foto.indexOf("blob:") === 0) URL.revokeObjectURL(p.foto);
  }

  function eliminar(p) {
    var indice = estado.prendas.indexOf(p);
    if (indice === -1) return;
    estado.prendas.splice(indice, 1);
    // los huecos de detrás corren un puesto, para seguir en su sitio
    eliminadas.forEach(function (e) { if (e.indice > indice) e.indice--; });
    eliminadas.push({ prenda: p, indice: indice });
    // la pila no crece sin fin: la más antigua se descuelga del todo
    while (eliminadas.length > MAX_DESHACER) soltarBlob(eliminadas.shift().prenda);
    guardar();
    pintarInventario();
    avisar("Descolgaste «" + p.nombre + "». Si fue sin querer, toca «Deshacer» en su sitio.");
    var b = $('[data-deshacer="' + CSS.escape(p.id) + '"]');
    if (b) b.focus();
  }

  function deshacer(id) {
    var i = -1;
    eliminadas.forEach(function (e, j) { if (e.prenda.id === id) i = j; });
    if (i === -1) return;
    var e = eliminadas.splice(i, 1)[0];
    var p = e.prenda;
    var donde = Math.min(e.indice, estado.prendas.length);
    estado.prendas.splice(donde, 0, p);
    eliminadas.forEach(function (x) { if (x.indice >= donde) x.indice++; });
    // si al quitarla se eligió otra joyita, no hay dos
    if (p.destacada && estado.prendas.some(function (x) { return x !== p && x.destacada; })) p.destacada = false;
    retenidas[p.id] = true; // vuelve a su sitio aunque haya un filtro puesto
    guardar();
    pintarInventario();
    avisar("«" + p.nombre + "» vuelve al perchero.");
    enfocar(p.id, "eliminar");
  }

  function limpiarFiltros() {
    soltarRetenidas();
    filtro = "todas";
    filtroCat = "todas";
    busqueda = "";
    inputBuscar.value = "";
    pintarInventario();
  }

  $$("[data-filtro-estado]").forEach(function (boton) {
    boton.addEventListener("click", function () {
      var elegido = boton.getAttribute("data-filtro-estado");
      // tocar otra vez la pegatina activa la quita
      filtro = filtro === elegido ? "todas" : elegido;
      soltarRetenidas();
      pintarInventario();
    });
  });

  var temporizadorBusqueda;
  inputBuscar.addEventListener("input", function () {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(function () {
      busqueda = normalizar(inputBuscar.value.trim());
      soltarRetenidas();
      pintarInventario();
    }, 150);
  });
  $("[data-buscador]").addEventListener("submit", function (e) { e.preventDefault(); });

  $("[data-cat-filtros]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]");
    if (!b) return;
    filtroCat = b.getAttribute("data-cat");
    soltarRetenidas();
    pintarInventario();
    var mismo = $('[data-cat="' + CSS.escape(filtroCat) + '"]');
    if (mismo) mismo.focus();
  });

  botonLimpiar.addEventListener("click", function () {
    limpiarFiltros();
    $('[data-filtro-estado="todas"]').focus();
  });

  lista.addEventListener("click", function (e) {
    var t = e.target;
    var boton = t.closest("[data-accion]");
    if (boton && boton.getAttribute("data-accion") === "editar") return abrirEditar(boton.getAttribute("data-id"), boton);
    if (boton) return ejecutar(boton.getAttribute("data-accion"), boton.getAttribute("data-id"));
    var desEd = t.closest("[data-deshacer-edicion]");
    if (desEd) return deshacerEdicion(desEd.getAttribute("data-deshacer-edicion"));
    var des = t.closest("[data-deshacer]");
    if (des) return deshacer(des.getAttribute("data-deshacer"));
    if (t.closest("[data-abrir-taller]")) return abrirTaller(t.closest("[data-abrir-taller]"));
    if (t.closest("[data-limpiar-filtros]")) {
      limpiarFiltros();
      $('[data-filtro-estado="todas"]').focus();
      return;
    }
    if (t.closest("[data-reintentar]")) arrancar();
  });

  /* ---------------- Diálogos ---------------- */

  function abrirDialogo(d) {
    if (d.open) return;
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");
  }
  function cerrarDialogo(d) {
    if (typeof d.close === "function") d.close();
    else { d.removeAttribute("open"); d.dispatchEvent(new Event("close")); }
  }

  // Confirmación propia (restablecer la demo: no se puede deshacer)
  var dConfirmar = $("#confirmar");
  var botonSi = $("[data-confirmar-si]");
  var confirmarAbridor = null;
  var confirmarAccion = null;
  var confirmarElegido = false;

  function preguntar(op) {
    confirmarAbridor = document.activeElement;
    confirmarAccion = op.alSi;
    confirmarElegido = false;
    $("#confirmar-titulo").textContent = op.titulo;
    $("#confirmar-texto").textContent = op.texto;
    botonSi.textContent = op.si;
    abrirDialogo(dConfirmar);
    $("[data-confirmar-no]").focus();
  }
  botonSi.addEventListener("click", function () {
    confirmarElegido = true;
    cerrarDialogo(dConfirmar);
  });
  $("[data-confirmar-no]").addEventListener("click", function () { cerrarDialogo(dConfirmar); });
  dConfirmar.addEventListener("click", function (e) { if (e.target === dConfirmar) cerrarDialogo(dConfirmar); });
  dConfirmar.addEventListener("close", function () {
    var accion = confirmarAccion;
    confirmarAccion = null;
    if (confirmarElegido && accion) accion();
    else if (confirmarAbridor && document.contains(confirmarAbridor)) confirmarAbridor.focus();
  });

  $("[data-restablecer]").addEventListener("click", function () {
    preguntar({
      titulo: "¿Restablecer la demo?",
      texto: "Se borran los cambios hechos en este navegador (escaparate, perchero y prendas colgadas) y vuelven las prendas de ejemplo.",
      si: "Restablecer",
      alSi: restablecer
    });
  });

  function restablecer() {
    try { localStorage.removeItem(CLAVE); localStorage.removeItem(CLAVE_PARA); } catch (e) { /* nada */ }
    cargar(true).then(function (nuevo) {
      if (estado) estado.prendas.forEach(soltarBlob);
      eliminadas.forEach(function (e) { soltarBlob(e.prenda); });
      estado = nuevo;
      eliminadas = [];
      recienId = null;
      ultimaEdicion = null;
      soltarRetenidas();
      filtro = "todas";
      filtroCat = "todas";
      busqueda = "";
      inputBuscar.value = "";
      quitarFotoBanner();
      if (typeof fotoQuienPendiente === "string") URL.revokeObjectURL(fotoQuienPendiente);
      if (fotoQuienGuardada) URL.revokeObjectURL(fotoQuienGuardada);
      fotoQuienPendiente = undefined;
      fotoQuienGuardada = null;
      errorCampo(inputL1, "");
      pintarBanner();
      pintarQuien();
      pintarInventario();
      vaciarTaller();
      avisar("Demo restablecida: todo vuelve a como estaba al principio.");
      $("[data-restablecer]").focus();
    }, function () {
      avisar("No se pudo restablecer: no cargaron las prendas de ejemplo.");
    });
  }

  /* ---------------- Colgar prenda nueva (un solo formulario) ---------------- */

  var taller = $("#taller");
  var form = $("#form-prenda");
  var estadoTaller = $("#taller-estado");
  var cajaCat = $("#caja-categoria");
  var inputNuevaCat = $("#p-categoria-nueva");
  var listaFotos = $("[data-fotos-lista]");
  var inputFotos = $("#p-fotos");
  var zonaSoltar = $("[data-soltar]");
  var tallerAbridor = null;
  var colgadaId = null;
  var intentado = false;
  var cuerpoTaller = $(".taller-cuerpo");
  var CLAVE_PARA = "remini-admin-ultimo-para";

  function abrirTaller(desde) {
    if (!estado) return avisar("Espera a que cargue el perchero.");
    tallerAbridor = desde || document.activeElement;
    colgadaId = null;
    abrirDialogo(taller);
    pintarRelleno();
    cuerpoTaller.scrollTop = 0;
    // a las fotos: no abre el teclado del móvil
    inputFotos.focus();
  }

  $$("[data-abrir-taller]").forEach(function (b) {
    if (!lista.contains(b)) b.addEventListener("click", function () { abrirTaller(b); });
  });
  $("[data-cerrar-taller]").addEventListener("click", pedirCierre);
  // Esc se atiende aquí (Chrome no deja cancelar el «cancel» si no hubo interacción desde que se abrió)
  taller.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !e.defaultPrevented) {
      e.preventDefault();
      pedirCierre();
    }
  });
  taller.addEventListener("cancel", function (e) {
    e.preventDefault();
    pedirCierre();
  });

  function pedirCierre() {
    if (editando && firma() !== editando.inicial) {
      var p = buscar(editando.id);
      preguntar({
        titulo: "¿Descartar cambios?",
        texto: "Lo que cambiaste en «" + (p ? p.nombre : "la prenda") + "» no se guarda.",
        si: "Descartar",
        alSi: function () { cerrarDialogo(taller); }
      });
      return;
    }
    cerrarDialogo(taller);
  }

  taller.addEventListener("close", function () {
    // el aviso «close» llega después: si para entonces ya se volvió a abrir (p. ej. para editar), no es para nosotros
    if (taller.open) return;
    if (editando) {
      // fuera las fotos nuevas que no se guardaron, y vuelve el borrador de «Colgar prenda nueva»
      fotosElegidas.forEach(function (f) { if (!f.propia) URL.revokeObjectURL(f.url); });
      fotosElegidas = [];
      var borrador = editando.borrador;
      editando = null;
      modoTaller(false);
      restaurar(borrador);
    }
    if (colgadaId) {
      var item = $('[data-item="' + CSS.escape(colgadaId) + '"]');
      colgadaId = null;
      if (item) {
        item.scrollIntoView({ block: "center", behavior: movReducido.matches ? "auto" : "smooth" });
        item.focus({ preventScroll: true });
        return;
      }
    }
    if (tallerAbridor && document.contains(tallerAbridor)) tallerAbridor.focus();
    else { var b = $(".colgar-nueva"); if (b) b.focus(); }
  });

  function decirTaller(texto) {
    estadoTaller.textContent = "";
    setTimeout(function () { estadoTaller.textContent = texto; }, 30);
  }

  // Categoría y estado como chips (radios)
  function categoriaElegida() {
    var r = form.querySelector('input[name="categoria"]:checked');
    return r ? r.value : "";
  }

  // elegida: undefined = la que haya; "" = ninguna. Se marca con la propiedad, no con el atributo
  function pintarCategorias(elegida) {
    var actual = elegida === undefined ? categoriaElegida() : elegida;
    $("[data-categorias]").innerHTML = estado.categorias.map(function (c, i) {
      return '<label class="chip-radio"><input type="radio" name="categoria" id="p-cat-' + i + '" value="' + esc(c) + '"><span class="chip">' + esc(c) + "</span></label>";
    }).join("") +
      '<button type="button" class="chip chip-otra" data-nueva-categoria aria-expanded="' + !cajaCat.hidden + '" aria-controls="caja-categoria">+ nueva</button>';
    $$('input[name="categoria"]', form).forEach(function (r) { r.checked = !!actual && r.value === actual; });
  }

  /* Estado: el termómetro (un range nativo de 1 a 10). El valor se lee en la punta del mercurio */
  var rangoEstado = $("#p-estado");
  var termometro = $("[data-termometro]");

  var estadoVacio = true; // la prenda nueva empieza sin estado: hay que elegirlo

  function estadoElegido() {
    if (estadoVacio) return 0;
    var v = Number(rangoEstado.value);
    return v >= 1 && v <= 10 ? v : 0;
  }
  function pintarFrase() {
    var n = estadoElegido();
    termometro.classList.toggle("sin-elegir", !n);
    termometro.style.setProperty("--nivel", n || 1);
    termometro.style.setProperty("--c", n ? COLORES_ESTADO[n - 1] : "transparent");
    $("[data-termo-num]").textContent = n || "";
    $("[data-frase-estado]").textContent = n ? fraseEstado(n) : "Toca para elegir";
    rangoEstado.setAttribute("aria-valuetext", n ? n + " de 10, " + fraseEstado(n) : "Sin elegir: toca el tubo o usa las flechas");
  }
  // Cualquier toque o tecla en el termómetro lo da por elegido (también si deja el 10 que ya había debajo)
  function elegirEstado() {
    if (!estadoVacio) return;
    estadoVacio = false;
    pintarFrase();
    if (intentado) validarUno("p-estado");
    pintarRelleno();
  }
  rangoEstado.addEventListener("pointerup", elegirEstado);
  rangoEstado.addEventListener("keyup", function (e) {
    if (/^(Arrow|Home|End|Page)/.test(e.key)) elegirEstado();
  });
  rangoEstado.addEventListener("input", function () { estadoVacio = false; });

  /* Talla: el metro de modista. Marcas de letra para arriba y de número (26-40) para pantalones y shorts.
     0 = cinta recogida (sin talla, o una talla que no está en la cinta) */
  var MARCAS_ARRIBA = LETRAS;
  var MARCAS_ABAJO = ["26", "28", "30", "32", "34", "36", "38", "40"];
  var cinta = $("[data-cinta]");
  var rangoCinta = $("#p-talla-cinta");
  var inputTalla = $("#p-talla");
  var botonOtra = $("[data-otra-talla]");
  var otraAbierta = false;

  function marcasTalla() { return tipoCategoria(categoriaElegida()) === "abajo" ? MARCAS_ABAJO : MARCAS_ARRIBA; }
  function enCinta(texto, marcas) {
    var t = String(texto || "").trim().toUpperCase().replace(/^2XL$/, "XXL").replace(/^3XL$/, "XXXL");
    return marcas.indexOf(t);
  }

  function pintarCinta() {
    var marcas = marcasTalla();
    var n = marcas.length;
    var talla = valor("p-talla");
    var i = enCinta(talla, marcas);
    var v = i + 1;
    // la talla libre (no «Estándar») se ve en su campo, sobre la cinta recogida
    var libre = !!talla && i === -1 && normalizar(talla) !== "estandar";
    inputTalla.hidden = !(otraAbierta || libre);
    botonOtra.setAttribute("aria-expanded", String(!inputTalla.hidden));
    // mientras se escribe otra talla, la cinta se ve recogida (aunque coincida con una marca)
    var visto = inputTalla.hidden ? v : 0;
    rangoCinta.max = n;
    rangoCinta.value = visto;
    cinta.style.setProperty("--f", visto / n);
    cinta.style.setProperty("--n", n);
    cinta.classList.toggle("recogida", !visto);
    $("[data-cinta-marcas]").innerHTML = marcas.map(function (m, j) {
      var clase = j + 1 < visto ? "cubierta" : j + 1 === visto ? "elegida" : "";
      // en pantallas estrechas, a la vista «2XL»/«3XL» para que no se pisen (lo accesible y lo guardado no cambian)
      var rotulo = pantallaEstrecha.matches ? m.replace(/^XXXL$/, "3XL").replace(/^XXL$/, "2XL") : m;
      return '<span style="--i:' + (j + 1) + '"' + (clase ? ' class="' + clase + '"' : "") + ">" + rotulo + "</span>";
    }).join("");
    rangoCinta.setAttribute("aria-valuetext", visto ? "Talla " + marcas[i] : talla ? "Cinta recogida: talla " + talla + " escrita aparte" : "Cinta recogida: sin talla");
  }

  rangoCinta.addEventListener("input", function () {
    var marcas = marcasTalla();
    var v = Number(rangoCinta.value);
    otraAbierta = false;
    inputTalla.value = v ? marcas[v - 1] : "";
    inputTalla.dispatchEvent(new Event("input", { bubbles: true }));
  });

  botonOtra.addEventListener("click", function () {
    otraAbierta = inputTalla.hidden;
    if (otraAbierta) {
      // escribir otra talla recoge la cinta
      if (enCinta(valor("p-talla"), marcasTalla()) !== -1 || normalizar(valor("p-talla")) === "estandar") {
        inputTalla.value = "";
        inputTalla.dispatchEvent(new Event("input", { bubbles: true }));
      }
      pintarCinta();
      inputTalla.focus();
    } else {
      pintarCinta();
      rangoCinta.focus();
    }
  });

  form.addEventListener("click", function (e) {
    var nueva = e.target.closest("[data-nueva-categoria]");
    if (nueva) {
      var abrir = cajaCat.hidden;
      cajaCat.hidden = !abrir;
      nueva.setAttribute("aria-expanded", String(abrir));
      if (abrir) inputNuevaCat.focus();
      return;
    }
    // Atajos (Sin marca, tallas, épocas, «Igual que la etiqueta»): rellenan el campo sin llevar el foco a él,
    // para que en el móvil no salte el teclado; el chip elegido queda marcado
    var atajo = e.target.closest("[data-poner]");
    if (e.target.closest("[data-igual-talla]")) {
      inputReal.value = "";
      inputReal.dispatchEvent(new Event("input", { bubbles: true })); // el campo vacío deja «Igual» marcado
      pintarRelleno();
      return;
    }
    if (atajo) {
      var campo = document.getElementById(atajo.getAttribute("data-poner"));
      if (campo === inputTalla) otraAbierta = false;
      if (campo === inputEpoca) otraEpoca = false;
      campo.value = atajo.getAttribute("data-valor");
      campo.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  var botonIgual = $("[data-igual-talla]");
  var inputReal = $("#p-talla-real");
  var realIgual = true; // «Le queda»: por defecto, igual que la talla de la etiqueta

  // La talla real: la de la etiqueta si está «Igual»; si no, la escrita
  function valorTallaReal() { return realIgual ? valor("p-talla") : valor("p-talla-real"); }

  function pintarAtajos() {
    $$("[data-poner]", form).forEach(function (b) {
      var actual = normalizar(valor(b.getAttribute("data-poner")));
      b.setAttribute("aria-pressed", String(!!actual && actual === normalizar(b.getAttribute("data-valor"))));
    });
    var talla = valor("p-talla");
    botonIgual.textContent = talla ? "Igual (" + talla + ")" : "Igual";
    botonIgual.setAttribute("aria-label", talla ? "Le queda igual: " + talla + ", la talla de la etiqueta" : "Le queda igual que la talla de la etiqueta (aún sin talla)");
    botonIgual.setAttribute("aria-pressed", String(realIgual));
    pintarEpoca();
  }

  inputReal.addEventListener("input", function () {
    // escribir otra talla deselecciona «Igual»; vaciar el campo lo vuelve a marcar
    realIgual = !inputReal.value.trim();
  });

  /* Época: chips con flechas (una sola parada de tabulador) y «Otra…» para escribirla */
  var botonOtraEpoca = $("[data-otra-epoca]");
  var inputEpoca = $("#p-decada");
  var otraEpoca = false;
  var EPOCAS = ["y2k", "90s", "80s", "vintage"];
  function pintarEpoca() {
    var v = normalizar(valor("p-decada"));
    var libre = !!v && EPOCAS.indexOf(v) === -1;
    inputEpoca.hidden = !(otraEpoca || libre);
    botonOtraEpoca.setAttribute("aria-expanded", String(!inputEpoca.hidden));
    botonOtraEpoca.setAttribute("aria-pressed", String(!inputEpoca.hidden));
    var chips = $$(".chip", $("[data-epocas]"));
    var activo = chips.filter(function (c) { return c.getAttribute("aria-pressed") === "true"; })[0] || chips[0];
    chips.forEach(function (c) { c.tabIndex = c === activo ? 0 : -1; });
  }
  botonOtraEpoca.addEventListener("click", function () {
    otraEpoca = inputEpoca.hidden;
    if (otraEpoca && EPOCAS.indexOf(normalizar(valor("p-decada"))) !== -1) {
      inputEpoca.value = "";
      inputEpoca.dispatchEvent(new Event("input", { bubbles: true }));
    }
    pintarEpoca();
    if (otraEpoca) inputEpoca.focus();
  });
  $("[data-epocas]").addEventListener("keydown", function (e) {
    var chips = $$(".chip", e.currentTarget);
    var i = chips.indexOf(document.activeElement);
    if (i === -1) return;
    var j = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % chips.length
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + chips.length) % chips.length
      : e.key === "Home" ? 0 : e.key === "End" ? chips.length - 1 : -1;
    if (j === -1) return;
    e.preventDefault();
    chips.forEach(function (c, k) { c.tabIndex = k === j ? 0 : -1; });
    chips[j].focus();
  });

  function anadirCategoria() {
    var nombre = inputNuevaCat.value.trim().replace(/\s+/g, " ");
    if (!nombre) {
      errorCampo(inputNuevaCat, "Escribe el nombre de la categoría.");
      inputNuevaCat.focus();
      return;
    }
    var existe = estado.categorias.filter(function (c) { return normalizar(c) === normalizar(nombre); })[0];
    if (!existe) {
      nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
      estado.categorias.push(nombre);
      guardar();
    }
    var elegida = existe || nombre;
    cajaCat.hidden = true;
    errorCampo(inputNuevaCat, "");
    inputNuevaCat.value = "";
    pintarCategorias(elegida);
    var radio = form.querySelector('input[name="categoria"]:checked');
    if (radio) radio.focus();
    decirTaller(existe ? "Ya existía «" + existe + "»: queda elegida." : "Categoría «" + nombre + "» creada y elegida.");
    rellenarMedidas();
    if (intentado) validarUno("p-categoria");
    pintarRelleno();
  }
  $("[data-anadir-categoria]").addEventListener("click", anadirCategoria);
  inputNuevaCat.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); anadirCategoria(); }
  });

  // Fotos: se suman a las ya elegidas; la primera es la principal
  function anadirFotos(archivos) {
    var problemas = [];
    Array.prototype.forEach.call(archivos, function (archivo) {
      var problema = revisarFoto(archivo);
      if (problema) problemas.push(problema);
      else fotosElegidas.push({ archivo: archivo, url: URL.createObjectURL(archivo) });
    });
    errorCampo(inputFotos, problemas.join(" "));
    pintarFotos();
    if (fotosElegidas.length) decirTaller(fotosElegidas.length + plural(fotosElegidas.length, " foto elegida.", " fotos elegidas."));
  }

  inputFotos.addEventListener("change", function () {
    anadirFotos(inputFotos.files);
    inputFotos.value = ""; // permite volver a elegir la misma
  });

  // Un archivo soltado fuera del cuadro no hace que el navegador abra la imagen (y se pierda lo escrito)
  function llevaArchivos(e) {
    return !!(e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") !== -1);
  }
  ["dragover", "drop"].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      if (llevaArchivos(e) && !zonaSoltar.contains(e.target)) {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "none";
      }
    });
  });
  ["dragenter", "dragover"].forEach(function (ev) {
    zonaSoltar.addEventListener(ev, function (e) {
      if (!llevaArchivos(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      zonaSoltar.classList.add("encima");
    });
  });
  zonaSoltar.addEventListener("dragleave", function (e) {
    // solo al salir de verdad del cuadro, no al pasar entre sus hijos (sin parpadeo)
    if (!e.relatedTarget || !zonaSoltar.contains(e.relatedTarget)) zonaSoltar.classList.remove("encima");
  });
  zonaSoltar.addEventListener("drop", function (e) {
    e.preventDefault();
    zonaSoltar.classList.remove("encima");
    if (e.dataTransfer && e.dataTransfer.files.length) anadirFotos(e.dataTransfer.files);
  });

  var fotoPrincipal = $("[data-foto-principal]");
  function nombreFoto(f) { return f.nombre || (f.archivo && f.archivo.name) || "foto"; }

  function pintarFotos() {
    var hay = fotosElegidas.length > 0;
    fotoPrincipal.hidden = !hay;
    if (hay) {
      fotoPrincipal.src = fotosElegidas[0].url;
      fotoPrincipal.alt = "Foto principal: " + nombreFoto(fotosElegidas[0]);
    } else {
      fotoPrincipal.src = "data:,";
      fotoPrincipal.alt = "";
    }
    zonaSoltar.classList.toggle("con-fotos", hay);
    listaFotos.innerHTML = fotosElegidas.map(function (f, i) {
      var nombre = esc(nombreFoto(f));
      return '<li' + (i === 0 ? ' class="es-principal"' : "") + ">" +
        '<button type="button" class="mini-foto" data-principal="' + i + '" aria-pressed="' + (i === 0) + '" aria-label="' +
          (i === 0 ? "Foto 1, principal: " : "Hacer principal la foto " + (i + 1) + ": ") + nombre + '">' +
          '<img src="' + esc(f.url) + '" alt="" width="40" height="40"></button>' +
        '<button type="button" class="quitar-foto" data-quitar-foto="' + i + '" aria-label="Quitar foto ' + (i + 1) + ", " + nombre + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
        "</li>";
    }).join("");
    listaFotos.hidden = !hay;
    $("[data-mini-mas]").hidden = !hay;
    $("[data-fotos-ayuda]").hidden = fotosElegidas.length < 2;
  }

  listaFotos.addEventListener("click", function (e) {
    var principal = e.target.closest("[data-principal]");
    if (principal) {
      var j = Number(principal.getAttribute("data-principal"));
      if (j > 0) {
        fotosElegidas.unshift(fotosElegidas.splice(j, 1)[0]);
        pintarFotos();
        decirTaller("La foto " + (j + 1) + " es ahora la principal.");
      }
      var primera = $("[data-principal]", listaFotos);
      if (primera) primera.focus();
      return;
    }
    var b = e.target.closest("[data-quitar-foto]");
    if (!b) return;
    var i = Number(b.getAttribute("data-quitar-foto"));
    var quitada = fotosElegidas.splice(i, 1)[0];
    if (!quitada.propia) URL.revokeObjectURL(quitada.url);
    pintarFotos();
    decirTaller("Foto quitada. Quedan " + fotosElegidas.length + ".");
    var siguiente = $$("[data-quitar-foto]", listaFotos)[Math.min(i, fotosElegidas.length - 1)];
    (siguiente || inputFotos).focus();
  });

  function valor(id) { return $("#" + id).value.trim(); }

  /* ---- Medidas típicas según la talla y la categoría ---- */

  var inputsMedida = $$("[data-medida]");
  var ayudaMedidas = $("[data-medidas-ayuda]");
  var anuncioMedidas = $("[data-medidas-anuncio]");
  var botonTipicas = $("[data-medidas-tipicas]");
  var AYUDA_MEDIDAS = ayudaMedidas.textContent;
  var ultimoAnuncio = "";
  var temporizadorAnuncio;

  function tipoCategoria(c) {
    var n = normalizar(c);
    if (/^(pantal|short|jean|bermud|falda|buzo)/.test(n)) return "abajo";
    if (/^(camis|polo|casac|chompa|polera|sudad|top|blus|chaq|chaleco)/.test(n)) return "arriba";
    return null;
  }

  function leerTalla(texto) {
    var t = String(texto || "").trim().toUpperCase();
    if (!t) return null;
    t = t.split(/[\s\/(),.-]+/)[0];
    t = t.replace(/^2XL$/, "XXL").replace(/^3XL$/, "XXXL").replace(/^XXS$/, "XS");
    if (LETRAS.indexOf(t) !== -1) return { letra: t };
    if (/^\d{2}$/.test(t)) {
      var n = Number(t);
      if (n >= 26 && n <= 40) return { numero: n };
    }
    return null;
  }

  function letraDeNumero(n) {
    if (n <= 28) return "XS";
    if (n <= 30) return "S";
    if (n <= 32) return "M";
    if (n <= 34) return "L";
    if (n <= 36) return "XL";
    if (n <= 38) return "XXL";
    return "XXXL";
  }

  function medio(n) { return Math.round(n * 2) / 2; }

  // Devuelve { talla, valores } o null si no hay típicas que poner
  function tipicas(tipo) {
    if (!tipo) return null;
    var fuentes = [valorTallaReal(), valor("p-talla")].filter(Boolean);
    for (var i = 0; i < fuentes.length; i++) {
      var t = leerTalla(fuentes[i]);
      if (!t) continue;
      if (tipo === "arriba") {
        if (!t.letra) continue; // «38» en una camisa: no se sabe
        return { talla: t.letra, valores: TIPICAS_ARRIBA[t.letra] };
      }
      var letra = t.letra || letraDeNumero(t.numero);
      var base = TIPICAS_ABAJO[letra];
      var corto = /^(short|bermud)/.test(normalizar(categoriaElegida()));
      return {
        talla: t.letra || String(t.numero),
        numero: t.numero,
        valores: {
          cintura: t.numero ? medio(t.numero * 2.54 / 2) : base.cintura,
          largo: corto ? base.largoShort : base.largo,
          tiro: base.tiro
        }
      };
    }
    return null;
  }

  function visibleMedida(input) { return !input.closest("[data-medida-de]") || !input.closest("[data-medida-de]").hidden; }

  function marcarAuto(input, auto) {
    input.classList.toggle("es-auto", auto);
    pintarCm();
  }
  function pintarCm() {
    var aprox = inputsMedida.some(function (c) { return c.classList.contains("es-auto") && visibleMedida(c) && c.value; });
    $("[data-medidas-cm]").textContent = aprox ? "cm aprox." : "cm";
  }

  // Sin categoría, la talla dice qué medidas tocan: letras, arriba; 26-40, abajo
  function tipoMedidas() {
    var tipo = tipoCategoria(categoriaElegida());
    if (tipo) return tipo;
    var fuentes = [valorTallaReal(), valor("p-talla")];
    for (var i = 0; i < fuentes.length; i++) {
      var t = leerTalla(fuentes[i]);
      if (t) return t.letra ? "arriba" : "abajo";
    }
    return null;
  }

  var tipoAnterior = null;
  function rellenarMedidas() {
    var tipo = tipoMedidas();
    if (tipoAnterior && tipo && tipo !== tipoAnterior) {
      var largo = $("#p-largo");
      largo.removeAttribute("data-tocado");
    }
    if (tipo) tipoAnterior = tipo;
    // arriba (o sin saber) muestra pecho y hombros; abajo, cintura y tiro
    $$("[data-medida-de]").forEach(function (caja) {
      caja.hidden = caja.getAttribute("data-medida-de") !== (tipo === "abajo" ? "abajo" : "arriba");
    });
    var r = tipicas(tipo);
    var puestas = 0;
    var tocadas = 0;

    inputsMedida.forEach(function (input) {
      var nombre = input.name;
      var visible = visibleMedida(input);
      if (input.hasAttribute("data-tocado")) {
        if (visible) tocadas++;
        return; // lo que escribió la dueña no se pisa
      }
      if (visible && r && r.valores[nombre] != null) {
        input.value = r.valores[nombre];
        marcarAuto(input, true);
        puestas++;
      } else {
        input.value = "";
        marcarAuto(input, false);
      }
    });

    if (r) {
      ayudaMedidas.textContent = "Medidas típicas de talla " + r.talla + ": mídela y ajústalas si hace falta." +
        (tipo === "abajo" ? " Cintura = ancho en plano" + (r.numero ? " (talla " + r.numero + " × 2.54 ÷ 2 = " + cm(r.valores.cintura) + " cm)." : ".") : "");
    } else {
      var t = valorTallaReal() || valor("p-talla");
      ayudaMedidas.textContent = t
        ? "No hay medidas típicas para «" + t + "»: mídela y escríbelas si quieres."
        : AYUDA_MEDIDAS;
    }
    botonTipicas.hidden = !(r && tocadas);

    var anuncio = r && puestas ? "Medidas típicas de talla " + r.talla + " rellenadas." : "";
    clearTimeout(temporizadorAnuncio);
    if (anuncio && anuncio !== ultimoAnuncio) {
      temporizadorAnuncio = setTimeout(function () { anuncioMedidas.textContent = anuncio; }, 600);
    }
    ultimoAnuncio = anuncio;
  }

  inputsMedida.forEach(function (input) {
    input.addEventListener("input", function () {
      input.setAttribute("data-tocado", "");
      marcarAuto(input, false);
      botonTipicas.hidden = !tipicas(tipoMedidas());
    });
  });

  botonTipicas.addEventListener("click", function () {
    inputsMedida.forEach(function (input) { input.removeAttribute("data-tocado"); });
    ultimoAnuncio = "";
    rellenarMedidas();
    var primera = inputsMedida.filter(visibleMedida)[0];
    if (primera) primera.focus();
  });

  /* ---- Validación (en línea) ---- */

  var REGLAS = {
    "p-marca": function () { return valor("p-marca") ? "" : "Escribe la marca o toca «Sin marca»."; },
    "p-nombre": function () { return valor("p-nombre") ? "" : "Escribe el nombre de la prenda."; },
    "p-precio": function () {
      var pr = $("#p-precio");
      if (!pr.value.trim()) return pr.validity.badInput ? "Solo números (49.90)." : "Pon el precio.";
      if (/e/i.test(pr.value)) return "Solo números (49.90).";
      if (/\.\d{3,}$/.test(pr.value)) return "Como mucho 2 decimales.";
      return Number(pr.value) > 0 ? "" : "Mayor que 0.";
    },
    "p-categoria": function () { return categoriaElegida() ? "" : "Elige una categoría."; },
    "p-genero": function () { return form.querySelector('input[name="genero"]:checked') ? "" : "Elige Mujer, Hombre o Unisex."; },
    "p-estado": function () { return estadoElegido() ? "" : "Toca el termómetro para elegir el estado."; },
    "p-talla": function () { return valor("p-talla") ? "" : "Estira la cinta hasta la talla, o elige «Estándar» u «Otra talla…»."; },
    "p-talla-real": function () { return realIgual || valorTallaReal() ? "" : "Escribe cómo le queda."; },
    "p-medidas": function () {
      var mal = medidasMal();
      inputsMedida.forEach(function (c) {
        if (mal.indexOf(c) !== -1) c.setAttribute("aria-invalid", "true"); else c.removeAttribute("aria-invalid");
      });
      return mal.length ? "Entre 1 y 300 cm (con decimales si quieres), o vacías." : "";
    }
  };
  // Medida mal: escrita (o ilegible) y fuera de 1-300 cm. Sin marcar nada: sirve también para «Faltan»
  function medidasMal() {
    return inputsMedida.filter(function (c) {
      return visibleMedida(c) && (c.value !== "" || c.validity.badInput) && !(Number(c.value) >= 1 && Number(c.value) <= 300);
    });
  }
  var NOMBRES = {
    "p-nombre": "nombre", "p-categoria": "categoría", "p-precio": "precio", "p-talla": "talla",
    "p-talla-real": "talla real", "p-estado": "estado", "p-marca": "marca", "p-genero": "para quién", "p-medidas": "revisar medidas"
  };

  function marcarGrupo(id, mensaje) {
    var hueco = document.getElementById(id + "-error");
    if (hueco) hueco.textContent = mensaje;
    var el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === "FIELDSET") {
      el.classList.toggle("con-error", !!mensaje);
      $$("input[type=radio]", el).forEach(function (r) {
        if (mensaje) r.setAttribute("aria-invalid", "true"); else r.removeAttribute("aria-invalid");
      });
    } else if (mensaje) el.setAttribute("aria-invalid", "true");
    else el.removeAttribute("aria-invalid");
  }

  function validarUno(id) {
    var m = REGLAS[id]();
    marcarGrupo(id, m);
    if (id === "p-talla") {
      if (m) rangoCinta.setAttribute("aria-invalid", "true"); else rangoCinta.removeAttribute("aria-invalid");
    }
    return m;
  }

  function validarTodo() {
    return Object.keys(REGLAS).filter(function (id) { return !!validarUno(id); });
  }

  function primerControl(id) {
    if (id === "p-medidas") return inputsMedida.filter(function (c) { return c.hasAttribute("aria-invalid"); })[0];
    if (id === "p-talla" && inputTalla.hidden) return rangoCinta;
    var el = document.getElementById(id);
    if (el.tagName === "FIELDSET") return el.querySelector("input:checked") || el.querySelector("input");
    return el;
  }

  // Un campo se revisa al salir de él (si ya se escribió algo) y, tras el primer intento, mientras se escribe
  form.addEventListener("focusout", function (e) {
    var id = idDeCampo(e.target);
    if (!id) return;
    if (intentado || (e.target.value && e.target.type !== "radio" && e.target.type !== "range")) validarUno(id);
  });

  function idDeCampo(el) {
    if (!el || !el.closest) return null;
    if (el.id && REGLAS[el.id]) return el.id;
    if (el.id === "p-talla-cinta") return "p-talla";
    if (el.hasAttribute("data-medida")) return "p-medidas";
    var grupo = el.closest("fieldset[id]");
    return grupo && REGLAS[grupo.id] ? grupo.id : null;
  }

  function alCambiar(e) {
    var t = e && e.target;
    if (t === inputFotos || t === inputNuevaCat) return;
    if (t && (t.name === "categoria" || t.id === "p-talla" || t.id === "p-talla-real")) rellenarMedidas();
    if (t && t.name === "estado") pintarFrase();
    if (t && t.id === "p-nombre") autoAltura(t);
    if (!t) rellenarMedidas();
    if (intentado) {
      var id = idDeCampo(t);
      if (id) validarUno(id);
      if (t && (t.name === "categoria" || t.id === "p-talla" || t.id === "p-talla-real")) validarUno("p-medidas");
    }
    pintarRelleno();
  }
  form.addEventListener("input", alCambiar);
  form.addEventListener("change", alCambiar);

  /* ---- Hecho / pendiente y «Faltan: …» junto al botón ---- */

  var cajaFaltan = $("[data-faltan]");
  var OBLIGATORIOS = ["p-marca", "p-nombre", "p-precio", "p-categoria", "p-genero", "p-estado", "p-talla", "p-talla-real"];

  function pintarRelleno() {
    pintarAtajos();
    pintarCinta();
    var faltan = OBLIGATORIOS.filter(function (id) {
      var ok = !REGLAS[id]();
      var caja = $('[data-req="' + id + '"]');
      if (caja) caja.classList.toggle("hecho", ok);
      return !ok;
    });
    if (medidasMal().length) faltan.push("p-medidas");
    cajaFaltan.classList.toggle("tras-intento", intentado);
    var firmaFaltan = faltan.join(",") + "|" + pantallaEstrecha.matches;
    if (firmaFaltan === ultimaFirmaFaltan) return; // igual que antes: no se tocan los nodos
    ultimaFirmaFaltan = firmaFaltan;
    var dentro = cajaFaltan.contains(document.activeElement);
    if (!faltan.length) {
      cajaFaltan.innerHTML = '<p class="faltan-listo"><span aria-hidden="true">✓</span> Todo listo para colgar</p>';
      if (dentro) $(".boton-colgar-tienda").focus();
      return;
    }
    var nombres = faltan.map(function (id) { return NOMBRES[id]; });
    if (pantallaEstrecha.matches) {
      // móvil: un solo botón que salta al primero
      cajaFaltan.innerHTML = '<button type="button" class="faltan-boton" data-ir="' + faltan[0] + '" aria-label="Faltan ' + faltan.length + ": " +
        nombres.join(", ") + '. Ir al primero">Faltan ' + faltan.length + ' <span aria-hidden="true">▸</span></button>';
      if (dentro) $(".faltan-boton").focus();
      return;
    }
    cajaFaltan.innerHTML = '<p class="faltan-texto">Faltan ' + faltan.length + ":</p>" +
      '<ul class="faltan-lista">' + faltan.map(function (id, i) {
        return "<li>" + (i ? '<span aria-hidden="true">·</span> ' : "") + '<button type="button" class="faltan-ir" data-ir="' + id + '">' + NOMBRES[id] + "</button></li>";
      }).join("") + "</ul>";
    if (dentro) $(".faltan-ir", cajaFaltan).focus();
  }
  var ultimaFirmaFaltan = "";
  var pantallaEstrecha = window.matchMedia("(max-width: 760px)");
  if (pantallaEstrecha.addEventListener) pantallaEstrecha.addEventListener("change", function () { if (estado) pintarRelleno(); });

  cajaFaltan.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ir]");
    if (!b) return;
    var c = primerControl(b.getAttribute("data-ir"));
    if (c) c.focus();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!estado) return decirTaller("Espera a que cargue el perchero.");
    intentado = true;
    ultimaFirmaFaltan = "";
    var errores = validarTodo();
    pintarRelleno();
    if (errores.length) {
      var nombres = errores.map(function (id) { return NOMBRES[id]; });
      var lista_ = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : nombres[0];
      decirTaller("Falta" + (errores.length === 1 ? "" : "n") + " " + lista_ + ". Están marcados en rojo.");
      var c = primerControl(errores[0]);
      if (c) c.focus();
      return;
    }

    var medidas = {};
    var aprox = [];
    inputsMedida.filter(visibleMedida).forEach(function (c) {
      if (c.value) {
        medidas[c.name] = Number(c.value);
        if (c.classList.contains("es-auto")) aprox.push(c.name);
      }
    });
    if (aprox.length) medidas.aprox = aprox;

    var datos = {
      nombre: valor("p-nombre"),
      marca: valor("p-marca"),
      decada: valor("p-decada"),
      categoria: categoriaElegida(),
      genero: form.querySelector('input[name="genero"]:checked').value,
      talla: valor("p-talla"),
      tallaReal: valorTallaReal(),
      estado: estadoElegido(),
      notaEstado: valor("p-nota"),
      medidas: medidas,
      precio: Number($("#p-precio").value),
      descripcion: valor("p-descripcion"),
      foto: fotosElegidas.length ? fotosElegidas[0].url : null
    };

    // la foto principal sigue en uso en el perchero: no se revoca
    fotosElegidas.slice(1).forEach(function (f) { if (!f.propia) URL.revokeObjectURL(f.url); });
    fotosElegidas = [];

    if (editando) return guardarEdicion(datos);
    try { localStorage.setItem(CLAVE_PARA, datos.genero); } catch (err) { /* sin almacenamiento */ }

    var prenda = Object.assign({ id: "nueva-" + Date.now() }, datos, { situacion: "disponible", destacada: false });
    recienId = prenda.id;
    estado.prendas.unshift(prenda);
    // los huecos «Deshacer» siguen en su sitio: la nueva entra delante
    eliminadas.forEach(function (x) { x.indice++; });
    guardar();

    filtro = "todas";
    filtroCat = "todas";
    busqueda = "";
    inputBuscar.value = "";
    soltarRetenidas();
    pintarInventario();

    vaciarTaller();
    colgadaId = prenda.id;
    cerrarDialogo(taller);
    avisar("Colgada «" + prenda.nombre + "»: ya está la primera del perchero.");
  });

  /* ---- Editar una prenda ya colgada: la misma ficha, rellena ---- */

  function modoTaller(editar) {
    $("#taller-titulo").innerHTML = editar ? "Editar <span>prenda</span>" : "Colgar <span>prenda nueva</span>";
    $(".boton-colgar-tienda").textContent = editar ? "Guardar cambios" : "Colgar en la tienda";
    $$("[data-vaciar]").forEach(function (b) { b.hidden = editar; });
    taller.classList.toggle("en-edicion", editar);
  }

  // Foto fija del formulario, para guardarla aparte y volver a ella (el borrador no se mezcla con una edición)
  function capturar() {
    return {
      campos: $$("input, textarea", form).filter(function (c) { return c.id && c.type !== "file" && c.type !== "radio"; }).map(function (c) {
        return { id: c.id, valor: c.value, tocado: c.hasAttribute("data-tocado"), auto: c.classList.contains("es-auto") };
      }),
      radios: $$("input[type=radio]:checked", form).map(function (r) { return { nombre: r.name, valor: r.value }; }),
      fotos: fotosElegidas.slice(),
      intentado: intentado,
      cajaAbierta: !cajaCat.hidden,
      estadoVacio: estadoVacio,
      realIgual: realIgual,
      otraEpoca: otraEpoca
    };
  }
  function firma() {
    var c = capturar();
    return JSON.stringify([
      c.campos.map(function (x) { return [x.id, x.valor]; }),
      c.radios,
      c.fotos.map(function (f) { return f.url; }),
      c.estadoVacio,
      c.realIgual
    ]);
  }
  function restaurar(c) {
    vaciarTaller(true);
    cajaCat.hidden = !c.cajaAbierta;
    var cat = c.radios.filter(function (r) { return r.nombre === "categoria"; })[0];
    pintarCategorias(cat ? cat.valor : "");
    c.radios.forEach(function (r) {
      var el = form.querySelector('input[name="' + r.nombre + '"][value="' + CSS.escape(r.valor) + '"]');
      if (el) el.checked = true;
    });
    c.campos.forEach(function (x) {
      var el = document.getElementById(x.id);
      if (!el) return;
      el.value = x.valor;
      if (x.tocado) el.setAttribute("data-tocado", ""); else el.removeAttribute("data-tocado");
      if (el.hasAttribute("data-medida")) marcarAuto(el, x.auto);
    });
    fotosElegidas = c.fotos.slice();
    intentado = c.intentado;
    estadoVacio = c.estadoVacio !== false;
    realIgual = c.realIgual !== false;
    otraEpoca = c.otraEpoca;
    autoAltura($("#p-nombre"));
    pintarFotos();
    pintarFrase();
    rellenarMedidas();
    if (intentado) validarTodo();
    pintarRelleno();
  }

  function abrirEditar(id, desde) {
    var p = buscar(id);
    if (!p || taller.open) return;
    tallerAbridor = desde || document.activeElement;
    colgadaId = null;
    var borrador = capturar();
    try {
      rellenarConPrenda(p);
    } catch (err) {
      console.error("No se pudo abrir la prenda para editar:", err);
      restaurar(borrador);
      avisar("No se pudo abrir esa prenda para editar.");
      return;
    }
    editando = { id: id, borrador: borrador };
    modoTaller(true);
    abrirDialogo(taller);
    pintarRelleno();
    editando.inicial = firma();
    decirTaller("Editando «" + p.nombre + "».");
    cuerpoTaller.scrollTop = 0;
    inputFotos.focus();
  }

  function rellenarConPrenda(p) {
    vaciarTaller(true);
    if (p.categoria && estado.categorias.indexOf(p.categoria) === -1) estado.categorias.push(p.categoria);
    pintarCategorias(p.categoria);
    [["p-marca", p.marca], ["p-nombre", p.nombre], ["p-precio", p.precio > 0 ? String(p.precio) : ""], ["p-talla", p.talla],
      ["p-talla-real", p.tallaReal], ["p-decada", p.decada], ["p-nota", p.notaEstado], ["p-descripcion", p.descripcion]
    ].forEach(function (x) { $("#" + x[0]).value = x[1] || ""; });
    // «Para»: el de la prenda (sin él, ninguno: no se usa el recordado)
    $$('input[name="genero"]', form).forEach(function (r) { r.checked = !!p.genero && r.value === p.genero; });
    rangoEstado.value = p.estado || 10;
    estadoVacio = false;
    realIgual = !p.tallaReal || normalizar(p.tallaReal) === normalizar(p.talla);
    if (realIgual) $("#p-talla-real").value = "";
    otraEpoca = false;
    autoAltura($("#p-nombre"));
    pintarFrase();
    fotosElegidas = p.foto ? [{ url: p.foto, propia: true, nombre: "foto actual" }] : [];
    pintarFotos();

    // Medidas: las guardadas cuentan como escritas, salvo las que siguen siendo las típicas
    rellenarMedidas();
    var med = p.medidas || {};
    var aprox = med.aprox || [];
    var conMedidas = inputsMedida.some(function (c) { return typeof med[c.name] === "number"; });
    // sin medidas guardadas (las de ejemplo): se quedan las típicas de su talla, como «aprox.»
    if (conMedidas) inputsMedida.forEach(function (c) {
      var v = med[c.name];
      var tipica = c.classList.contains("es-auto") ? Number(c.value) : null;
      if (typeof v === "number" && aprox.indexOf(c.name) !== -1 && v === tipica) return;
      c.value = typeof v === "number" ? v : "";
      c.setAttribute("data-tocado", "");
      marcarAuto(c, false);
    });
    rellenarMedidas();
  }

  // ¿Alguien sigue usando esta foto local? (prendas, huecos de deshacer, la última edición)
  function blobEnUso(url) {
    if (!url || url.indexOf("blob:") !== 0) return true;
    return estado.prendas.some(function (x) { return x.foto === url; }) ||
      eliminadas.some(function (e) { return e.prenda.foto === url; }) ||
      (ultimaEdicion && ultimaEdicion.anterior.foto === url);
  }
  function soltarSiSobra(url) { if (url && !blobEnUso(url)) URL.revokeObjectURL(url); }

  function guardarEdicion(datos) {
    var p = buscar(editando.id);
    if (!p) return cerrarDialogo(taller);
    var anterior = Object.assign({}, p);
    var nueva = Object.assign({}, p, datos); // conserva id, situación y joyita
    estado.prendas[estado.prendas.indexOf(p)] = nueva;
    var vieja = ultimaEdicion;
    ultimaEdicion = { id: p.id, anterior: anterior };
    if (vieja) soltarSiSobra(vieja.anterior.foto);
    retenidas[p.id] = true; // sigue a la vista aunque ya no encaje en el filtro
    guardar();
    destelloId = p.id;
    pintarInventario();
    colgadaId = p.id;
    cerrarDialogo(taller);
    avisar("Cambios guardados en «" + nueva.nombre + "». Si te equivocaste, toca «Deshacer» en su polaroid.");
  }

  function deshacerEdicion(id) {
    if (!ultimaEdicion || ultimaEdicion.id !== id) return;
    var p = buscar(id);
    if (!p) { ultimaEdicion = null; return; }
    // vuelve la versión anterior, pero sin tocar lo que se marcó después (reservada, vendida, joyita)
    var vuelta = Object.assign({}, ultimaEdicion.anterior, { situacion: p.situacion, destacada: p.destacada });
    estado.prendas[estado.prendas.indexOf(p)] = vuelta;
    ultimaEdicion = null;
    soltarSiSobra(p.foto);
    retenidas[id] = true;
    destelloId = id;
    guardar();
    pintarInventario();
    avisar("Vuelve la versión anterior de «" + vuelta.nombre + "».");
    enfocar(id, "editar");
  }

  function vaciarTaller(conservarFotos) {
    form.reset();
    intentado = false;
    ultimaFirmaFaltan = "";
    tipoAnterior = null;
    otraAbierta = false;
    otraEpoca = false;
    estadoVacio = true;
    realIgual = true;
    autoAltura($("#p-nombre"));
    // «Para»: el último que se usó
    var ultimo = null;
    try { ultimo = localStorage.getItem(CLAVE_PARA); } catch (err) { /* sin almacenamiento */ }
    var radioPara = ultimo && form.querySelector('input[name="genero"][value="' + CSS.escape(ultimo) + '"]');
    if (radioPara) radioPara.checked = true;
    if (!conservarFotos) fotosElegidas.forEach(function (f) { if (!f.propia) URL.revokeObjectURL(f.url); });
    fotosElegidas = [];
    $$("[aria-invalid]", form).forEach(function (c) { c.removeAttribute("aria-invalid"); });
    $$(".con-error", form).forEach(function (c) { c.classList.remove("con-error"); });
    $$(".error-campo", form).forEach(function (p) { p.textContent = ""; });
    inputsMedida.forEach(function (c) { c.removeAttribute("data-tocado"); marcarAuto(c, false); });
    ultimoAnuncio = "";
    anuncioMedidas.textContent = "";
    cajaCat.hidden = true;
    estadoTaller.textContent = "";
    if (estado) {
      pintarCategorias("");
      pintarFrase();
    }
    pintarFotos();
    rellenarMedidas();
    pintarRelleno();
  }

  $$("[data-vaciar]").forEach(function (b) {
    b.addEventListener("click", function () {
      preguntar({
        titulo: "¿Vaciar la ficha?",
        texto: "Se borra lo escrito y las fotos elegidas de esta prenda nueva.",
        si: "Vaciar",
        alSi: function () {
          vaciarTaller(false);
          decirTaller("Ficha vacía.");
          cuerpoTaller.scrollTop = 0;
          inputFotos.focus();
        }
      });
    });
  });

  // El nombre es un textarea de una línea que crece (sin cortar en el móvil); Intro no hace salto de línea
  function autoAltura(el) {
    if (!el) return;
    el.style.height = "";
    el.style.height = el.scrollHeight + "px";
  }
  $("#p-nombre").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); $("#p-precio").focus(); }
  });
  $("#p-nombre").addEventListener("input", function (e) {
    if (/\n/.test(e.target.value)) e.target.value = e.target.value.replace(/\s*\n\s*/g, " ");
  });

  /* ---------------- Sesión ---------------- */

  $("[data-cerrar-sesion]").addEventListener("click", function () {
    try { sessionStorage.removeItem("remini-admin-demo-sesion"); } catch (e) { /* nada */ }
  });

  /* ---------------- Arranque ---------------- */

  function arrancar() {
    lista.setAttribute("aria-busy", "true");
    cargar(false).then(function (datos) {
      estado = datos;
      pintarBanner();
      pintarQuien();
      pintarCategorias();
      pintarFrase();
      pintarInventario();
      pintarFotos();
      rellenarMedidas();
      pintarRelleno();
    }).catch(function (error) {
      console.error("No se pudo cargar el perchero:", error);
      estado = null;
      resumen.textContent = "No se pudo cargar el perchero.";
      lista.removeAttribute("aria-busy");
      lista.innerHTML = '<li class="percha-estado percha-error" role="alert">' +
        "<h3>No cargó el perchero</h3>" +
        "<p>Si abriste el archivo con doble clic (<code>file://</code>), el navegador bloquea la carga: " +
        "sírvelo con un servidor local, por ejemplo <code>python -m http.server</code>.</p>" +
        '<button type="button" class="boton boton-primario" data-reintentar>Reintentar</button></li>';
    });
  }

  arrancar();
})();
