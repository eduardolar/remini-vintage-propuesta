# Remini Vintage · propuesta de rediseño

**Esto no es la tienda.** Es un prototipo que Eduardo Lara ha hecho para Leslie,
dueña de [Remini Vintage](https://remini-vintage.vercel.app/), para enseñarle cómo
quedarían en su web las mejoras del estudio *«Propuestas para Remini Vintage»*
(16/11/2026). No se vende nada desde aquí: los botones de WhatsApp abren el chat
sin número y la bolsa solo se guarda en tu navegador.

Las páginas llevan `noindex,nofollow` y una franja fija arriba que lo dice:
«Propuesta de rediseño para Remini Vintage · prototipo, no es la tienda real · Ver la tienda».

- `index.html`: portada con la colección.
- `prenda.html?p=<slug>`: ficha de una prenda, por ejemplo
  `prenda.html?p=camisa-christian-audigier-rosas-y-dagas`.

## Qué demuestra cada parte

Entre paréntesis, la mejora del estudio a la que responde.

### Portada

| Parte | Qué enseña | Mejora del estudio |
| --- | --- | --- |
| Cabecera | Logo y «REMINI VINTAGE», buscador por nombre o marca (sin importar tildes) y «Mi bolsa (n)». Desde 601 px se queda pegada bajo la franja al bajar; en el móvil, en cuanto guardas una prenda aparece un botón redondo de «Mi bolsa» abajo a la derecha. En el ordenador, «/» lleva al buscador. | *Reservar varias prendas de una vez* |
| Portada | «REMINI VINTAGE» enorme sobre la foto nocturna oscurecida, «Y2K ÚNICO · ENVÍOS A TODO EL PERÚ», «Nuevas cada viernes · Pagas con Yape o Plin» y «Ver colección». Alrededor flotan tres polaroids de prendas reales (enlazan a su ficha), una etiqueta de precio colgada, el sello «Prenda única», un «¿Sigue disponible?» de WhatsApp, «Yape ✓», cinta de embalaje y destellos; se mueven despacio y con el scroll, hay un botón «Pausar animaciones» y con «reducir movimiento» todo queda quieto. En el móvil solo quedan cuatro piezas pequeñas, y a 390×844 y 1366×900 ya asoma la primera fila de prendas. | *Que las prendas se vean antes*; detalle *Que el título principal sea la marca* |
| Categorías y filtros | Todas, Camisas, Casacas, Pantalones, Polos y Shorts (deslizables en el móvil), y filtros de talla, precio (hasta S/ 100, S/ 100-250, más de S/ 250) y marca. El estado va en la dirección (`index.html#casacas&talla=M`), así que se puede compartir. Cada chip y cada opción dice cuántas prendas daría con los demás filtros, las opciones que darían 0 salen desactivadas y, si una búsqueda no encuentra nada por culpa de un filtro, se ofrece «Ver «audigier» en todas (1)». Al volver de una ficha (o al recargar) la lista sigue donde estaba. | *Filtros y categorías ordenadas* |
| «Joyita» | Es una etiqueta amarilla sobre la foto, no una categoría: la camisa Christian Audigier sale en Camisas. | *Filtros y categorías ordenadas* |
| Tarjetas | Foto 4:5, marca, nombre completo (sin «…»), talla, estado, precio grande y «Guardar». 2 columnas en el móvil, 3 en tableta y 4 en el ordenador. | Detalles: *nombre sin cortar*, *más contraste en el texto pequeño* |
| Prenda vendida | Una tarjeta de **ejemplo** en gris con la franja «VENDIDA» y sin botón. | *Las prendas vendidas, a la vista* |
| Cómo comprar | Tres pasos: reservas por WhatsApp, pagas con Yape, Plin o transferencia, te llega en 24-48 h en Lima o 2-5 días en provincias. | *Envío y pago* |
| Quién vende | Hueco para la foto de Leslie, texto, Instagram, TikTok y opiniones de clientes. | *Quién vende* |
| Open Graph | Título, descripción y la foto de portada al compartir el enlace. | *Cada página con su título, su descripción y su foto* |

### Ficha de prenda

| Parte | Qué enseña | Mejora del estudio |
| --- | --- | --- |
| Encima del pliegue | Marca, nombre con el **precio al lado**, talla, estado con una frase («9/10 · casi nueva, sin detalles a la vista»), categoría correcta y época. | *Filtros y categorías ordenadas* (la categoría bien puesta) |
| Envío y pago | Justo debajo del precio: «Envío Lima S/ __ (24-48 h) · Provincias por Shalom u Olva (2-5 días) · Yape, Plin o transferencia». | *Envío y pago, justo debajo del precio* |
| Galería | Tres fotos que se deslizan en el móvil, con miniaturas; la página deja al final un hueco del alto de la barra, así que nada queda tapado. | Detalle *hueco al final de la ficha* |
| Medidas y defectos | «Pecho __ cm · Largo __ cm · Manga __ cm» (en pantalones y shorts: cintura, largo y tiro) y un bloque «Defectos». | *Medidas en centímetros y defectos a la vista* |
| Barra fija | Precio, «Guardar» y «Reservar por WhatsApp» (verde, texto oscuro) con el mensaje ya escrito: «Hola, quiero reservar *Nombre* (talla X, S/ precio). enlace ¿Sigue disponible? El envío sería a: », que acaba ahí para que solo haya que escribir el distrito o la ciudad. | *«Reservar» abre WhatsApp con el mensaje ya escrito* |
| Mi bolsa | Panel lateral con las prendas guardadas («Quitar» deja un «Deshacer» en su sitio), total sin envío y «Reservar las N por WhatsApp · S/ total», que manda **un solo mensaje** con todas (con el total «más el envío»). | *Reservar varias prendas de una vez* |
| Volver y compartir | «Inicio» en las migas vuelve a la colección con sus filtros y su posición si se llegó desde ella, y «Compartir» junto a la marca abre la hoja de compartir del móvil (o copia el enlace). | — |
| SEO de muestra | `<title>` y descripción propios de cada prenda, JSON-LD `Product` (marca, talla, fotos, precio en PEN, InStock, UsedCondition) y texto alternativo real en cada foto («Nombre, talla X, vista 1 de 3»). | *Cada página con su título…*, *Mapa del sitio y texto en las fotos*, *Datos de producto para Google* |

### Accesibilidad y calidad

- Contraste AA en todo el texto; el texto pequeño en mayúsculas tiene al menos 13 px y un gris claro.
- Botones y enlaces de 44-48 px, contorno amarillo de 2 px al navegar con teclado y enlace «Saltar a la colección».
- Respeta «reducir movimiento» del sistema, y la portada tiene un botón «Pausar animaciones» (se recuerda en el navegador).
- Sin scroll lateral desde 360 px de ancho.
- Imágenes con `width`/`height` y carga diferida, salvo la foto de portada y la primera foto de la ficha.
- Sin contadores falsos de urgencia.
- Un solo modo oscuro, con todos los colores en variables (`css/estilos.css`, `:root`).

## Qué es de ejemplo

Todo esto va marcado en la página con la etiqueta «Ejemplo» o con un borde discontinuo:

- **Medidas y defectos**: la tienda aún no los tiene; Leslie los añadiría al subir cada prenda.
- **Envío y pago**: el precio del envío en Lima va como `S/ __` y los plazos son orientativos.
- **WhatsApp**: el enlace es `https://wa.me/?text=…` **sin número**; en la tienda real iría el de Leslie (`https://wa.me/51XXXXXXXXX?text=…`).
- **Quién vende**: el texto, la foto (de momento el logo), los enlaces de Instagram y TikTok («(pon tu enlace)») y las opiniones de clientes.
- **La prenda vendida**: es una tarjeta inventada que reutiliza una foto de la Casaca Frankio Garage.
- **Open Graph**: `og:image` va con ruta relativa porque el prototipo se publica en una subcarpeta; en la tienda real debe ser una URL absoluta.

## Cómo verlo en local

Las prendas se cargan con `fetch('datos/prendas.json')`, y el navegador lo bloquea si abres
`index.html` con doble clic (`file://`): verás un aviso que lo explica. Hay que servir la carpeta:

```sh
cd remini-vintage-propuesta
python -m http.server
```

y entrar en <http://localhost:8000>. Cualquier otro servidor estático sirve igual.

Todas las rutas son relativas, así que funciona también en GitHub Pages bajo
`/remini-vintage-propuesta/`.

## Archivos

- `index.html`, `prenda.html`: las dos páginas.
- `css/estilos.css`: estilos con variables de color, tipografía y espacios.
- `js/comun.js`: carga de datos, «Mi bolsa» (localStorage) y mensajes de WhatsApp.
- `js/portada.js`: categorías, filtros y buscador con el estado en la dirección.
- `js/hero.js`: parallax de las piezas de la portada y botón «Pausar animaciones».
- `js/prenda.js`: ficha, galería, título, descripción y JSON-LD.
- `datos/prendas.json`: las 7 prendas.
- `img/`: logo, foto de portada y 3 fotos por prenda.

Sin frameworks ni librerías; solo las fuentes Anton e Inter de Google Fonts.

## Créditos

Las fotos, las prendas y el logo son de **Remini Vintage** y se usan con permiso de Leslie.
Prototipo hecho por Eduardo Lara para Leslie.
