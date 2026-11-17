/* Remini Vintage · propuesta de rediseño
   Portada: parallax suave de las piezas con el scroll (y el ratón en escritorio),
   y el botón «Pausar animaciones». Con «reducir movimiento» no se mueve nada. */
(function () {
  "use strict";

  var CLAVE = "remini-animaciones-pausadas";
  var raiz = document.documentElement;
  var movReducido = window.matchMedia("(prefers-reduced-motion: reduce)");
  var punteroFino = window.matchMedia("(pointer: fine) and (min-width: 1024px)");

  document.addEventListener("DOMContentLoaded", function () {
    var hero = document.querySelector(".hero");
    if (!hero) return;

    var capas = Array.prototype.slice.call(hero.querySelectorAll("[data-prof]")).map(function (el) {
      return { el: el, prof: parseFloat(el.getAttribute("data-prof")) || 0 };
    });
    var raton = { x: 0, y: 0, ax: 0, ay: 0 };
    var pendiente = false;

    function quieto() {
      return movReducido.matches || raiz.classList.contains("pausado");
    }

    function limpiar() {
      capas.forEach(function (c) {
        c.el.style.removeProperty("--py");
        c.el.style.removeProperty("--mx");
        c.el.style.removeProperty("--my");
      });
    }

    function pintar() {
      pendiente = false;
      if (quieto()) { limpiar(); return; }

      var y = window.scrollY;
      var alto = hero.offsetHeight;
      if (y > hero.offsetTop + alto) return; // fuera de la vista

      raton.ax += (raton.x - raton.ax) * 0.08;
      raton.ay += (raton.y - raton.ay) * 0.08;

      capas.forEach(function (c) {
        c.el.style.setProperty("--py", (-y * c.prof).toFixed(1) + "px");
        c.el.style.setProperty("--mx", (raton.ax * c.prof * 36).toFixed(1) + "px");
        c.el.style.setProperty("--my", (raton.ay * c.prof * 36).toFixed(1) + "px");
      });

      if (Math.abs(raton.x - raton.ax) > 0.002 || Math.abs(raton.y - raton.ay) > 0.002) pedir();
    }

    function pedir() {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(pintar);
      }
    }

    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    hero.addEventListener("pointermove", function (e) {
      if (!punteroFino.matches) return;
      raton.x = e.clientX / window.innerWidth - 0.5;
      raton.y = e.clientY / window.innerHeight - 0.5;
      pedir();
    });
    hero.addEventListener("pointerleave", function () {
      raton.x = 0;
      raton.y = 0;
      pedir();
    });
    if (movReducido.addEventListener) movReducido.addEventListener("change", pedir);

    /* ---------- Pausar animaciones (se recuerda en este navegador) ---------- */
    var boton = hero.querySelector(".pausar");
    var texto = boton.querySelector(".pausar-texto");
    var icono = boton.querySelector(".pausar-icono");

    function ponerPausa(pausado) {
      raiz.classList.toggle("pausado", pausado);
      texto.textContent = pausado ? "Reanudar animaciones" : "Pausar animaciones";
      icono.textContent = pausado ? "▶" : "❚❚";
      pedir();
    }

    var guardado = false;
    try { guardado = localStorage.getItem(CLAVE) === "1"; } catch (e) { /* sin almacenamiento */ }
    ponerPausa(guardado);
    // Con «reducir movimiento» la portada ya está quieta: no hay nada que pausar (ni para el lector)
    function ponerBoton() { boton.hidden = movReducido.matches; }
    ponerBoton();
    if (movReducido.addEventListener) movReducido.addEventListener("change", ponerBoton);

    boton.addEventListener("click", function () {
      var pausado = !raiz.classList.contains("pausado");
      ponerPausa(pausado);
      try { localStorage.setItem(CLAVE, pausado ? "1" : "0"); } catch (e) { /* sin almacenamiento */ }
    });

    pedir();
  });
})();
