/* Remini Vintage · propuesta de rediseño
   Acceso a la trastienda (prototipo): no hay servidor ni contraseñas. Se entra con solo pulsar
   «Abrir la trastienda» (o Intro en cualquier campo), escribas lo que escribas o nada. No se envía nada. */
(function () {
  "use strict";

  var form = document.getElementById("form-login");
  var clave = document.getElementById("clave");
  var botonVer = document.querySelector("[data-ver-clave]");
  var botonEntrar = document.querySelector("[data-entrar]");
  var textoEntrar = document.querySelector("[data-entrar-texto]");
  var rueda = botonEntrar.querySelector(".cargando");
  var enviando = false;

  // Mostrar u ocultar la contraseña (el nombre del botón cambia con lo que hará)
  botonVer.addEventListener("click", function () {
    var mostrar = clave.type === "password";
    clave.type = mostrar ? "text" : "password";
    botonVer.classList.toggle("visible", mostrar);
    botonVer.querySelector(".texto-ver").textContent = mostrar ? "Ocultar" : "Mostrar";
  });

  // Intro en cualquiera de los dos campos entra directamente
  [document.getElementById("correo"), clave].forEach(function (campo) {
    campo.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (form.requestSubmit) form.requestSubmit();
        else form.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (enviando) return;

    // Estado de carga «Abriendo…» (simulado: aquí la tienda real llamaría a su servidor)
    enviando = true;
    botonEntrar.setAttribute("aria-disabled", "true");
    form.setAttribute("aria-busy", "true");
    rueda.hidden = false;
    textoEntrar.textContent = "Abriendo…";

    setTimeout(function () {
      // Marca de sesión de la demo: el panel no la exige (su enlace se puede compartir); solo se borra al salir
      try { sessionStorage.setItem("remini-admin-demo-sesion", "1"); } catch (err) { /* sin almacenamiento: da igual */ }
      location.href = "admin.html";
    }, 900);
  });

  // Al volver con «atrás», el botón no se queda en «Abriendo…»
  window.addEventListener("pageshow", function () {
    enviando = false;
    botonEntrar.removeAttribute("aria-disabled");
    form.removeAttribute("aria-busy");
    rueda.hidden = true;
    textoEntrar.textContent = "Abrir la trastienda";
  });
})();
