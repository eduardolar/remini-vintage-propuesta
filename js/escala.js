/* Remini Vintage · propuesta de rediseño
   La escala del estado, una sola para la tienda (js/comun.js) y la trastienda (js/admin.js):
   10 como nueva · 9 casi nueva · 8 muy bueno · 7 bueno · 6 o menos usado.
   La frase larga es la palabra más su detalle («casi nueva, apenas usada»).
   Tinta del sello: verde (9-10), azul (7-8) y roja (6 o menos). */
(function () {
  "use strict";

  var ESCALA = [
    { desde: 10, palabra: "Como nueva", detalle: "sin uso" },
    { desde: 9, palabra: "Casi nueva", detalle: "apenas usada" },
    { desde: 8, palabra: "Muy bueno", detalle: "leve desgaste de uso" },
    { desde: 7, palabra: "Bueno", detalle: "con señales de uso" },
    { desde: 1, palabra: "Usado", detalle: "con uso visible" }
  ];

  /* «8/10», 8 o "8" → { n, palabra, detalle, frase, tinta }; null si no es una nota de 1 a 10 */
  window.EscalaEstado = function (estado) {
    var n = parseInt(String(estado), 10);
    if (!(n >= 1 && n <= 10)) return null;
    var e = ESCALA.filter(function (x) { return n >= x.desde; })[0];
    return {
      n: n,
      palabra: e.palabra,
      detalle: e.detalle,
      frase: e.palabra.toLowerCase() + ", " + e.detalle,
      tinta: n >= 9 ? "sello-verde" : n >= 7 ? "sello-azul" : "sello-rojo"
    };
  };
})();
