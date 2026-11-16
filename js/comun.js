/* Remini Vintage · propuesta de rediseño
   Código común a la portada y la ficha: datos, formato, "Mi bolsa" y WhatsApp. */
(function () {
  "use strict";

  var R = (window.Remini = {});

  R.categorias = [
    { id: "camisas", nombre: "Camisas" },
    { id: "casacas", nombre: "Casacas" },
    { id: "pantalones", nombre: "Pantalones" },
    { id: "polos", nombre: "Polos" },
    { id: "shorts", nombre: "Shorts" }
  ];

  R.nombreCategoria = function (id) {
    for (var i = 0; i < R.categorias.length; i++) {
      if (R.categorias[i].id === id) return R.categorias[i].nombre;
    }
    return id;
  };

  R.esc = function (texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  R.precio = function (n) {
    // Entre "S/" y la cifra va un espacio duro (U+00A0): el precio nunca se parte en dos líneas
    return "S/ " + Number(n).toLocaleString("es-PE", { maximumFractionDigits: 2 });
  };

  R.foto = function (slug, i) {
    return "img/prendas/" + slug + "-" + i + ".webp";
  };

  R.alt = function (p, i) {
    return p.nombre + ", talla " + p.talla + ", vista " + i + " de " + (p.fotos || 3);
  };

  R.enlacePrenda = function (slug) {
    return "prenda.html?p=" + encodeURIComponent(slug);
  };

  R.urlAbsoluta = function (relativa) {
    return new URL(relativa, location.href).href;
  };

  R.normalizar = function (texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  };

  /* Frase que acompaña a la nota del estado */
  R.fraseEstado = function (estado) {
    var nota = parseInt(String(estado), 10);
    if (nota >= 10) return "como nueva, sin uso";
    if (nota === 9) return "casi nueva, sin detalles a la vista";
    if (nota === 8) return "buen estado, leve desgaste de uso";
    if (nota === 7) return "estado aceptable, con señales de uso";
    return "con uso visible: revisa las fotos";
  };

  /* ---------------- Datos ---------------- */

  var promesa = null;
  R.cargarPrendas = function () {
    if (!promesa) {
      promesa = fetch("datos/prendas.json")
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        })
        .then(function (datos) {
          return datos.prendas || [];
        })
        .catch(function (error) {
          promesa = null; // permite reintentar
          throw error;
        });
    }
    return promesa;
  };

  R.htmlError = function (titulo) {
    return (
      '<div class="estado estado-error" role="alert">' +
      "<h2>" + R.esc(titulo) + "</h2>" +
      "<p>No se pudieron cargar las prendas.</p>" +
      "<p>Si abriste el archivo con doble clic (<code>file://</code>), el navegador bloquea la carga: " +
      "sírvelo con un servidor local, por ejemplo <code>python -m http.server</code>, y entra en " +
      "<code>http://localhost:8000</code>.</p>" +
      '<button type="button" class="boton boton-primario" data-reintentar>Reintentar</button>' +
      "</div>"
    );
  };

  /* ---------------- WhatsApp ---------------- */
  /* Sin número: en la tienda real iría el de Leslie (wa.me/51XXXXXXXXX). */

  R.enlaceWhatsApp = function (mensaje) {
    return "https://wa.me/?text=" + encodeURIComponent(mensaje);
  };

  /* El mensaje acaba en «El envío sería a: » para que el cursor quede ahí y solo haya que
     escribir el distrito o la ciudad (con un «[ciudad]» en medio, muchos lo mandarían tal cual). */
  var CIERRE_ENVIO = "El envío sería a: ";

  R.mensajeUna = function (p) {
    return (
      "Hola, quiero reservar *" + p.nombre + "* (talla " + p.talla + ", " + R.precio(p.precio) + ").\n" +
      R.urlAbsoluta(R.enlacePrenda(p.slug)) + "\n" +
      "¿Sigue disponible? " + CIERRE_ENVIO
    );
  };

  R.mensajeVarias = function (lista) {
    if (lista.length === 1) return R.mensajeUna(lista[0]);
    var total = 0;
    var lineas = lista.map(function (p, i) {
      total += Number(p.precio);
      return (
        i + 1 + ". *" + p.nombre + "* (talla " + p.talla + ", " + R.precio(p.precio) + ") " +
        R.urlAbsoluta(R.enlacePrenda(p.slug))
      );
    });
    return (
      "Hola, quiero reservar estas " + lista.length + " prendas:\n" +
      lineas.join("\n") +
      "\nTotal: " + R.precio(total) + " más el envío.\n" +
      "¿Siguen disponibles? " + CIERRE_ENVIO
    );
  };

  /* ---------------- Mi bolsa (localStorage) ---------------- */

  var CLAVE = "remini-propuesta-bolsa";
  var enMemoria = [];

  function leer() {
    try {
      var valor = JSON.parse(localStorage.getItem(CLAVE) || "[]");
      return Array.isArray(valor) ? valor.filter(function (s) { return typeof s === "string"; }) : [];
    } catch (e) {
      return enMemoria.slice(); // modo privado o almacenamiento bloqueado
    }
  }

  function escribir(lista) {
    enMemoria = lista.slice();
    try {
      localStorage.setItem(CLAVE, JSON.stringify(lista));
    } catch (e) {
      /* sin almacenamiento: la bolsa dura lo que dure la página */
    }
  }

  R.bolsa = leer;

  R.estaGuardada = function (slug) {
    return leer().indexOf(slug) !== -1;
  };

  function alternar(slug) {
    var lista = leer();
    var i = lista.indexOf(slug);
    if (i === -1) lista.push(slug);
    else lista.splice(i, 1);
    escribir(lista);
    return i === -1;
  }

  function quitar(slug) {
    escribir(leer().filter(function (s) { return s !== slug; }));
  }

  /* Pequeño rebote del contador al guardar (el CSS lo anula con movimiento reducido) */
  function rebotar() {
    document.querySelectorAll("[data-contador-bolsa], [data-bolsa-flotante]").forEach(function (el) {
      el.classList.remove("rebota");
      void el.offsetWidth; // reinicia la animación si se guarda dos veces seguidas
      el.classList.add("rebota");
    });
  }

  /* Aviso breve. «texto» se ve; «detalle» solo lo oye el lector de pantalla (así el aviso
     del móvil cabe en una línea y no tapa las tarjetas). Con Mi bolsa abierta, el aviso de
     la página queda detrás del panel (y fuera del alcance del lector): se usa el del panel. */
  var temporizadorAviso = null;
  function avisar(texto, detalle) {
    var dialogo = document.getElementById("bolsa");
    var aviso = (dialogo && dialogo.open && document.getElementById("bolsa-aviso")) || document.getElementById("aviso");
    if (!aviso) return;
    aviso.textContent = "";
    clearTimeout(temporizadorAviso);
    // pequeño retraso para que los lectores de pantalla anuncien el cambio
    setTimeout(function () {
      aviso.textContent = texto;
      if (detalle) {
        var oculto = document.createElement("span");
        oculto.className = "sr";
        oculto.textContent = ": " + detalle;
        aviso.appendChild(oculto);
      }
    }, 30);
    temporizadorAviso = setTimeout(function () { aviso.textContent = ""; }, 3200);
  }
  R.avisar = avisar;

  /* Pone al día contadores, botones "Guardar" y el panel */
  R.actualizarBolsa = function () {
    var lista = leer();
    var n = lista.length;

    document.querySelectorAll("[data-contador-bolsa]").forEach(function (el) {
      el.textContent = String(n);
    });
    document.querySelectorAll("[data-abrir-bolsa]").forEach(function (el) {
      el.setAttribute("aria-label", "Mi bolsa, " + n + (n === 1 ? " prenda" : " prendas"));
    });
    // Botón flotante del móvil: solo con algo dentro
    document.querySelectorAll("[data-bolsa-flotante]").forEach(function (el) {
      el.hidden = n === 0;
    });
    document.querySelectorAll("[data-guardar]").forEach(function (boton) {
      var guardada = lista.indexOf(boton.getAttribute("data-guardar")) !== -1;
      boton.setAttribute("aria-pressed", guardada ? "true" : "false");
      var texto = boton.querySelector(".texto-guardar");
      if (texto) texto.textContent = guardada ? "Guardada" : "Guardar";
    });

    var dialogo = document.getElementById("bolsa");
    if (dialogo && dialogo.open) return pintarPanel();
    return Promise.resolve();
  };

  /* Última prenda quitada desde el panel: se ofrece «Deshacer» en su sitio hasta cerrarlo */
  var quitada = null; // { slug, nombre, indice }

  function pintarPanel() {
    var listaEl = document.getElementById("bolsa-lista");
    var pie = document.getElementById("bolsa-pie");
    if (!listaEl || !pie) return Promise.resolve();

    return R.cargarPrendas().then(
      function (prendas) {
        var slugs = leer();
        var elegidas = slugs
          .map(function (s) { return prendas.find(function (p) { return p.slug === s; }); })
          .filter(Boolean);
        if (quitada && slugs.indexOf(quitada.slug) !== -1) quitada = null; // se volvió a guardar

        var filaDeshacer = quitada
          ? '<li class="item-bolsa item-quitado">' +
            "<p>Quitaste <strong>" + R.esc(quitada.nombre) + "</strong>.</p>" +
            '<button type="button" class="boton-quitar" data-deshacer aria-label="Deshacer: devolver ' + R.esc(quitada.nombre) + ' a la bolsa">Deshacer</button>' +
            "</li>"
          : "";

        if (!elegidas.length) {
          listaEl.innerHTML =
            filaDeshacer +
            '<li class="bolsa-vacia">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>' +
            "<p><strong>Tu bolsa está vacía.</strong></p>" +
            "<p>Toca «Guardar» en las prendas que te gusten y aquí podrás reservarlas todas en un solo mensaje.</p>" +
            '<a class="boton boton-primario" href="index.html#coleccion" data-ver-coleccion>Ver prendas</a>' +
            "</li>";
          pie.hidden = true;
          return;
        }

        var total = 0;
        var filas = elegidas.map(function (p) {
          total += Number(p.precio);
          return (
            '<li class="item-bolsa">' +
            '<img src="' + R.foto(p.slug, 1) + '" alt="' + R.esc(R.alt(p, 1)) + '" width="64" height="80" loading="lazy">' +
            "<div>" +
            '<a href="' + R.enlacePrenda(p.slug) + '">' + R.esc(p.nombre) + "</a>" +
            '<p class="item-datos">Talla ' + R.esc(p.talla) + " · Estado " + R.esc(p.estado) + "</p>" +
            '<span class="precio">' + R.precio(p.precio) + "</span>" +
            "</div>" +
            '<button type="button" class="boton-quitar" data-quitar="' + R.esc(p.slug) + '" data-nombre="' + R.esc(p.nombre) + '" aria-label="Quitar ' + R.esc(p.nombre) + ' de la bolsa">Quitar</button>' +
            "</li>"
          );
        });
        if (filaDeshacer) filas.splice(Math.min(quitada.indice, filas.length), 0, filaDeshacer);
        listaEl.innerHTML = filas.join("");

        var n = elegidas.length;
        pie.hidden = false;
        pie.innerHTML =
          '<p class="bolsa-total"><span>Total (' + n + (n === 1 ? " prenda" : " prendas") + ', sin envío)</span><span class="precio">' + R.precio(total) + "</span></p>" +
          '<a class="boton boton-whatsapp" href="' + R.esc(R.enlaceWhatsApp(R.mensajeVarias(elegidas))) + '" target="_blank" rel="noopener">' +
          ICONO_WHATSAPP +
          (n === 1 ? "Reservar la prenda" : "Reservar las " + n) + " por WhatsApp · " + R.precio(total) +
          "</a>" +
          '<p class="nota-ejemplo">Un solo mensaje con todas. Ejemplo: el chat se abre sin número (número de Leslie).</p>';
      },
      function () {
        listaEl.innerHTML = '<li class="bolsa-vacia"><p>No se pudieron cargar las prendas. Sirve la web con <code>python -m http.server</code>.</p></li>';
        pie.hidden = true;
      }
    );
  }

  var ICONO_WHATSAPP =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>';
  R.iconoWhatsApp = ICONO_WHATSAPP;

  /* ---------------- Eventos ---------------- */

  document.addEventListener("click", function (e) {
    var objetivo = e.target.closest ? e.target : e.target.parentElement;

    // Enlaces de ejemplo con href="#": que no salten arriba ni borren los filtros
    var vacio = objetivo.closest('a[href="#"]');
    if (vacio) {
      e.preventDefault();
      return;
    }

    var guardar = objetivo.closest("[data-guardar]");
    if (guardar) {
      var slug = guardar.getAttribute("data-guardar");
      var nombre = guardar.getAttribute("data-nombre") || "La prenda";
      var ahora = alternar(slug);
      R.actualizarBolsa();
      var n = leer().length;
      if (ahora) rebotar();
      avisar((ahora ? "Guardada en tu bolsa (" : "Quitada de tu bolsa (") + n + ")", nombre);
      return;
    }

    if (objetivo.closest("[data-abrir-bolsa]")) {
      var dialogo = document.getElementById("bolsa");
      if (dialogo && typeof dialogo.showModal === "function") {
        quitada = null;
        dialogo.showModal();
        pintarPanel();
      }
      return;
    }

    if (objetivo.closest("[data-cerrar-bolsa]")) {
      document.getElementById("bolsa").close();
      return;
    }

    // Bolsa vacía → «Ver prendas»: en la portada basta con cerrar el panel e ir a la colección
    var verColeccion = objetivo.closest("[data-ver-coleccion]");
    if (verColeccion) {
      var coleccion = document.getElementById("coleccion");
      if (coleccion) {
        e.preventDefault();
        document.getElementById("bolsa").close();
        coleccion.scrollIntoView();
      }
      return;
    }

    var botonQuitar = objetivo.closest("[data-quitar]");
    if (botonQuitar) {
      var quitarSlug = botonQuitar.getAttribute("data-quitar");
      quitada = {
        slug: quitarSlug,
        nombre: botonQuitar.getAttribute("data-nombre") || "la prenda",
        indice: leer().indexOf(quitarSlug)
      };
      quitar(quitarSlug);
      avisar("Quitada de tu bolsa (" + leer().length + ")", quitada.nombre);
      R.actualizarBolsa().then(function () {
        // el botón pulsado desaparece: el foco pasa a «Deshacer», en el mismo sitio
        var deshacer = document.querySelector("#bolsa [data-deshacer]");
        if (deshacer) deshacer.focus();
      });
      return;
    }

    if (objetivo.closest("[data-deshacer]")) {
      if (quitada) {
        var lista = leer();
        if (lista.indexOf(quitada.slug) === -1) {
          lista.splice(Math.min(Math.max(quitada.indice, 0), lista.length), 0, quitada.slug);
          escribir(lista);
        }
        var devuelta = quitada;
        quitada = null;
        avisar("De vuelta en tu bolsa (" + lista.length + ")", devuelta.nombre);
        R.actualizarBolsa().then(function () {
          var boton = document.querySelector('#bolsa [data-quitar="' + CSS.escape(devuelta.slug) + '"]');
          if (boton) boton.focus();
        });
      }
      return;
    }

    // Clic en el fondo oscuro cierra el panel
    if (objetivo.id === "bolsa") objetivo.close();
  });

  // Otra pestaña cambió la bolsa
  window.addEventListener("storage", function (e) {
    if (e.key === CLAVE) R.actualizarBolsa();
  });

  document.addEventListener("DOMContentLoaded", R.actualizarBolsa);
})();
