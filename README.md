# Web — Barber&iacute;a Doctor Fade (Castell&oacute;n)

Web est&aacute;tica multip&aacute;gina (HTML + CSS + JS puro, sin librer&iacute;as, funciona offline).
P&aacute;ginas: `index.html` · `servicios.html` · `galeria.html` · `contacto.html`.

## Publicar en GitHub Pages (3 pasos)
1. Crea un repositorio en GitHub (p. ej. `doctor-fade`) y sube **todo el contenido de esta carpeta** (incluido el archivo oculto `.nojekyll`).
2. En el repositorio: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
3. En 1–2 minutos la web estará en `https://TU-USUARIO.github.io/doctor-fade/`.

## Editar datos (buscar y reemplazar en los 4 HTML)
| Dato | Buscar |
|---|---|
| Teléfono visible | `634 37 61 02` |
| Teléfono del enlace | `+34634376102` |
| Instagram | `drfade_castellon` |
| Dirección | `Cant&oacute; de Castalia` |
| Horario | `10:00&ndash;14:00 &middot; 16:00&ndash;20:00` |
| Valoración / reseñas | `4,6` y `51` |
| URL canónica | `TU-USUARIO.github.io` → pon tu URL real |

Los textos usan entidades HTML para los acentos (`&aacute;`, `&oacute;`, `&ntilde;`…).

## Pendiente de confirmar con el negocio
- **Teléfono:** la ficha de Google indica `634 37 61 02` (el usado en la web). La web oficial antigua muestra también `643 70 01 77`. Confirmar cuál es el principal.
- **Número de calle:** la ficha de Google no muestra número; la web oficial indica el **16** de C. del Cantó de Castalia. Si se confirma, añadirlo tras la calle.
- **Email y WhatsApp:** no se han incluido por no estar confirmados.
- **Precios:** se muestran como «Cita previa» (no hay tarifas publicadas).

## Qué revisar tras publicar
- Que el teléfono e Instagram abren bien desde el móvil.
- La animación de spray de la intro (solo se reproduce una vez por sesión; para verla de nuevo, abre en ventana privada).
- El día actual aparece resaltado con la etiqueta **HOY** en Contacto.

## Estructura
```
index.html  servicios.html  galeria.html  contacto.html
.nojekyll
assets/styles.css   assets/app.js
assets/fonts/  (Unbounded, Space Grotesk — locales)
assets/img/    (logo transparente, fotos .webp optimizadas, favicons, og.jpg)
```
