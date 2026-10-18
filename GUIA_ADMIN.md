# Guía Completa del Editor de Pisos (`admin.html`)

El editor visual es **[`admin.html`](./admin.html)**. Permite diseñar y probar los 20 pisos del edificio de **"¡Sin Leche!"** sin escribir código: puedes pintar distintos tipos de suelo, agregar plataformas móviles o secretas, colocar obstáculos del edificio, configurar botones/interruptores por canal, repartir vidas o poderes y asignar imágenes PNG personalizadas. Al guardar, el editor genera automáticamente [`niveles.js`](./niveles.js).

---

## Índice

1. [Cómo abrirlo y qué archivos utiliza](#1-cómo-abrirlo-y-qué-archivos-utiliza)
2. [Estructura de la pantalla](#2-estructura-de-la-pantalla)
3. [Lista de pisos (Recorrido del Piso 20 al Piso 01)](#3-lista-de-pisos-recorrido-del-piso-20-al-piso-01)
4. [Datos generales del piso](#4-datos-generales-del-piso)
5. [El lienzo: navegación, zoom y minimapa](#5-el-lienzo-navegación-zoom-y-minimapa)
6. [Herramientas de edición](#6-herramientas-de-edición)
7. [Plataformas de suelo y plataformas flotantes](#7-plataformas-de-suelo-y-plataformas-flotantes)
8. [Trampas y obstáculos del edificio](#8-trampas-y-obstáculos-del-edificio)
9. [Elementos de nivel: Vidas, Doble Salto, Botones, Checkpoints y Meta](#9-elementos-de-nivel-vidas-doble-salto-botones-checkpoints-y-meta)
10. [Sistema de Canales (Botones que activan puentes o apagan trampas)](#10-sistema-de-canales-botones-que-activan-puentes-o-apagan-trampas)
11. [Objetos y Catálogo de Objetos](#11-objetos-y-catálogo-de-objetos)
12. [Validación automática (Panel Problemas)](#12-validación-automática-panel-problemas)
13. [Probar el piso en vivo y guardar `niveles.js`](#13-probar-el-piso-en-vivo-y-guardar-nivelesjs)
14. [Atajos de teclado](#14-atajos-de-teclado)

---

## 1. Cómo abrirlo y qué archivos utiliza

Abre [`admin.html`](./admin.html) en **Google Chrome o Microsoft Edge** (recomendados porque permiten sobrescribir [`niveles.js`](./niveles.js) directamente con `Cmd+S` / `Ctrl+S`).

| Archivo | Función | ¿Quién lo modifica? |
| :--- | :--- | :--- |
| [`admin.html`](./admin.html), [`admin.js`](./admin.js), [`admin.css`](./admin.css) | Interfaz y lógica del editor visual | Código del proyecto |
| [`niveles.js`](./niveles.js) | Datos de todos los pisos y `CATALOGO_OBJETOS` | **El editor al guardar** |
| [`niveles_base.js`](./niveles_base.js) | Constantes y funciones constructoras (`piso()`, `trampaVapor()`, `interruptor()`, etc.) | Código del proyecto |
| [`personajes.js`](./personajes.js) | Velocidad, salto, doble salto y sprites de Juan y Ame | Código del proyecto |
| [`index.html`](./index.html) | El juego (se abre también dentro del modal **▶ Probar piso**) | Código del proyecto |

> **Importante:** Cada vez que presionas **Guardar `niveles.js`**, el archivo [`niveles.js`](./niveles.js) se regenera por completo. Si necesitas crear nuevas funciones auxiliares o constantes globales, agrégalas en [`niveles_base.js`](./niveles_base.js).

---

## 2. Estructura de la pantalla

- **Barra superior:** Indicador de cambios sin guardar, botones **Deshacer / Rehacer**, **⚡ Generar circuito Fase 2**, **▶ Probar piso**, **Ver código** y **Guardar `niveles.js`**.
- **Columna izquierda (Pisos):** Lista de los 20 niveles del edificio en el orden en que se juegan (del Piso 20 en la cima hasta el Piso 01 en la planta baja).
- **Centro:** Barra de herramientas, selector de grilla (imán), selector de personaje de referencia para arcos de salto, lienzo interactivo con regla en píxeles y minimapa inferior.
- **Columna derecha (Inspector):**
  - **Piso:** Propiedades generales del nivel activo.
  - **Plataforma:** Se muestra al seleccionar un tramo de suelo o plataforma flotante.
  - **Objeto:** Se muestra al seleccionar un objeto decorativo o mueble con colisión.
  - **Trampa activa:** Se muestra al seleccionar un obstáculo del edificio.
  - **Elemento de nivel:** Se muestra al seleccionar un Ítem/Poder, Botón/Interruptor, Checkpoint o Ascensor Meta.
  - **Catálogo de objetos:** Plantillas reutilizables de objetos con sus márgenes de colisión.
  - **Problemas:** Detector en tiempo real de huecos imposibles, solapamientos o imágenes faltantes.

---

## 3. Lista de pisos (Recorrido del Piso 20 al Piso 01)

El orden de la lista izquierda define la progresión de la aventura:
- Empieza arriba de todo en el **Piso 20: Mi Departamento (¡Sin Leche!)**.
- Al tocar el **Ascensor de Bajada (Meta)** de cada nivel, el jugador pasa al siguiente piso de la lista hasta llegar al **Piso 01: Recepción (Salida a la Calle)**.
- Usa los botones **`＋`** (nuevo piso), **`⧉`** (duplicar), **`↑` / `↓`** (reordenar) y **`✕`** (eliminar).

---

## 4. Datos generales del piso

En el panel **Piso** puedes configurar:
- **ID y Nombre:** El nombre aparece en el HUD superior y en la tarjeta de transición al bajar de piso.
- **Fondo (`fondoRuta`):** Ruta del PNG en `assets/fondos/`. Indica al instante `✓ existe` o `✕ no existe`.
- **Tipo de piso y Color base:** Color de respaldo cuando aún no hay imagen cargada.
- **Tema de tiles (`tilesTema`) y Variantes (`tilesVariantes`):** Determina qué archivos `assets/tiles/piso_<tema>_NN.png` y bordes rotos se usan para vestir el suelo.

---

## 5. El lienzo: navegación, zoom y minimapa

- **Desplazarse:** Rueda del mouse, o mantener `Espacio` + arrastrar (también clic medio o derecho).
- **Zoom:** `Cmd` / `Ctrl` + rueda del mouse, o botones `−` y `＋`.
- **Ajustar alto (`F`) / Ver todo (`A`):** Encaja el nivel en pantalla.
- **Imán (Grilla):** Alinea movimientos a `8`, `16`, `32`, `64` o `128 px`. Mantén presionada la tecla **`Alt`** mientras arrastras para mover cualquier elemento libremente píxel por píxel.

---

## 6. Herramientas de edición

| Herramienta | Atajo | Uso en el lienzo |
| :--- | :---: | :--- |
| **Seleccionar** | `V` | Clic para seleccionar cualquier elemento; arrastrar para mover o redimensionar desde sus asas. |
| **Piso** | `1` | Arrastra horizontalmente para pintar suelo firme o rellenar huecos. |
| **Pivote** | `2` | Pinta una plataforma inestable que gira al pisarla y cae a los 325 ms. |
| **Resbaladizo** | `3` | Pinta suelo mojado/encerado (reduce la fricción y hace patinar al personaje). |
| **Quebradizo** | `4` | Pinta baldosas flojas que tiemblan al pisarlas, se rompen tras `420 ms` y se regeneran luego. |
| **Hueco** | `5` o `H` | Abre un vacío en el suelo. El editor calcula si Juan y Ame pueden saltarlo. |
| **Flotante** | `6` | Un clic coloca una plataforma aérea (fija, móvil, cinta o rebote). |
| **Trampa** | `7` o `T` | Un clic coloca un obstáculo activo del edificio. |
| **Elemento / Meta** | `8` o `E` | Un clic coloca una Vida, Poder Doble Salto, Café, Tarjeta, Botón/Interruptor, Checkpoint o Meta. |
| **Objeto** | `9` o `O` | Un clic coloca un mueble o prop desde `assets/props/` o del Catálogo. |

---

## 7. Plataformas de suelo y plataformas flotantes

Al seleccionar cualquier plataforma se abre el panel **Plataforma**:

- **Tipo de plataforma:**
  - **Normal:** Suelo firme estándar.
  - **Pivote:** Gira sobre su eje central al pisarla.
  - **Resbaladizo:** Suelo mojado con inercia real en el motor físico.
  - **Quebradizo:** Se agrieta al pisarla, cae y reaparece tras unos segundos.
  - **Móvil:** Se desplaza en el **Eje Horizontal (`x`)** o **Vertical (`y`)** según el **Rango (px)** y **Velocidad** configurados.
  - **Cinta:** Empuja continuamente al jugador hacia la derecha (`Velocidad > 0`) o izquierda (`Velocidad < 0`).
  - **Rebote:** Impulsa automáticamente al jugador hacia arriba con la **Fuerza de rebote** indicada (ej. `-19.5`).
- **Plataforma flotante (aérea):** Casilla que permite mover la plataforma a cualquier altura `Y` sin afectar los huecos del suelo principal.
- **Canal de interruptor y Oculta al inicio:** Permite crear puentes o plataformas secretas que aparecen al activar un botón (ver [Sección 10](#10-sistema-de-canales-botones-que-activan-puentes-o-apagan-trampas)).

---

## 8. Trampas y obstáculos del edificio

Con la herramienta **`7` Trampa** o seleccionando una trampa existente puedes configurar:

| Tipo en el Inspector | ID interno | Comportamiento en el edificio |
| :--- | :--- | :--- |
| **Mueble / Escombro Punzante** | `pinchos` | Daño fijo al contacto. Puede orientarse hacia `arriba`, `abajo`, `izquierda` o `derecha`. |
| **Chorro de Vapor / Agua** | `vapor` | Cañería rota que alterna entre reposo, aviso parpadeante (`avisoMs`) y chorro activo (`duracionMs`). |
| **Cables Pelados / Cortocircuito** | `laser` | Arco eléctrico intermitente entre dos bornes con fase de preaviso y descarga. |
| **Ventilador / Extractor** | `sierra` | Obstáculo giratorio que patrulla en el eje `X` o `Y` según su `rango` y `velocidad`. |
| **Cielo Raso / Plafón que Cae** | `aplastador` | Bloque pesado en el techo que avisa, cae de golpe al piso y vuelve a subir. |

Todas las trampas cuentan con:
- **Imagen PNG (`Elegir…`):** Para reemplazar el gráfico por defecto con tu propio PNG.
- **Canal de interruptor:** Si escribes un canal (ej. `corte_1`), al pisar un botón con ese canal la trampa quedará **apagada/desactivada**.

---

## 9. Elementos de nivel: Vidas, Doble Salto, Botones, Checkpoints y Meta

Con la herramienta **`8` Elemento / Meta**, el panel **Elemento de nivel** permite elegir entre 4 categorías:

1. **Vida / Poder / Item (`item`):**
   - **Vida Extra (`vida`):** Suma `+1 ♥` al jugador (hasta 6 corazones).
   - **Poder Doble Salto (`doble_salto`):** Desbloquea el segundo salto en el aire (`SALTO 2X ▲`) durante el resto de la partida.
   - **Café Expreso (`cafe`):** Otorga un turbo temporal de velocidad de carrera (`☕ TURBO`).
   - **Llave / Tarjeta de Ascensor (`tarjeta`):** Abre el ascensor del piso cuando la Meta tiene activada la opción *Requiere Tarjeta*.
2. **Botón / Interruptor de Piso (`interruptor`):**
   - Placa o botón que el jugador acciona al pasar por encima. Configura su **Canal**, **Modo** (`permanente` o `temporal`) y **Duración (ms)**.
3. **Checkpoint (`checkpoint`):**
   - Guarda el punto de reaparición del jugador dentro del piso si pierde una vida.
4. **Ascensor de Bajada / Meta (`meta`):**
   - Puerta de salida hacia el piso inferior. Puedes marcar **Requiere Tarjeta de Acceso** para exigir que el jugador recoja primero la tarjeta del nivel.

---

## 10. Sistema de Canales (Botones que activan puentes o apagan trampas)

El sistema de canales conecta **Botones/Interruptores** con **Plataformas** y **Trampas** sin escribir una sola línea de código:

1. **Crear un puente oculto activado por botón:**
   - Coloca una **Plataforma flotante**, márcala con **`Oculta al inicio`** y escribe `puente_1` en su campo **`Canal de interruptor`**.
   - Coloca un elemento de categoría **`Botón / Interruptor de Piso`** antes del hueco y escribe `puente_1` en su campo **`Canal que activa`**.
   - En el juego, la plataforma se verá como una silueta punteada tenue; en cuanto el jugador pise el botón, el puente se materializará para poder cruzar.
2. **Apagar una trampa (ej. cortar la corriente o cerrar una llave de vapor):**
   - Selecciona la trampa (por ejemplo unos *Cables Pelados* o *Chorro de Vapor*) y escribe `valvula_1` en su campo **`Canal de interruptor`**.
   - Coloca un **`Botón / Interruptor de Piso`** con el canal `valvula_1`. Al pisarlo, la trampa se desactivará.
3. **Interruptores con tiempo límite:**
   - Si eliges el modo **`Temporal (con tiempo)`** y pones `5000` ms, el puente o corte durará 5 segundos (mostrando una barra de cuenta regresiva sobre el botón) y luego volverá a su estado original.

---

## 11. Objetos y Catálogo de Objetos

- **Tres modos de objeto:**
  - **`Fondo` (Violeta):** Decoración detrás del jugador, sin colisión.
  - **`Encima` (Verde):** Plataforma *one-way* (el jugador puede saltar desde abajo y pararse arriba).
  - **`Sólido` (Rosa):** Bloquea por arriba, por los costados y desde abajo.
- **Catálogo de objetos:** Permite definir plantillas con **márgenes de colisión** (`izquierda`, `derecha`, `arriba`) para recortar el aire transparente de un PNG sin tener que reeditar la imagen.

---

## 12. Validación automática (Panel Problemas)

El panel **Problemas** revisa continuamente el piso activo y ofrece botones para ir directo al elemento o aplicar correcciones automáticas en un clic:
- Huecos imposibles de saltar para Juan o Ame.
- Plataformas de suelo superpuestas.
- Objetos sólidos demasiado altos que bloquean el paso.
- Rutas de imágenes PNG que aún no existen en la carpeta `assets/`.

---

## 13. Probar el piso en vivo y guardar `niveles.js`

- **▶ Probar piso:** Abre un modal interactivo con el juego cargado exactamente en el piso que estás editando, incluyendo tus cambios aún no guardados.
- **Guardar `niveles.js` (`Cmd+S` / `Ctrl+S`):** Escribe el archivo [`niveles.js`](./niveles.js) con el catálogo y los 20 pisos listos para jugar en [`index.html`](./index.html).

---

## 14. Atajos de teclado

| Tecla | Acción |
| :--- | :--- |
| `V` | Herramienta Seleccionar |
| `1` `2` `3` `4` | Pintar Piso, Pivote, Resbaladizo, Quebradizo |
| `5` o `H` | Abrir Hueco |
| `6` | Colocar Plataforma Flotante |
| `7` o `T` | Colocar Trampa del Edificio |
| `8` o `E` | Colocar Elemento (Vida, Poder, Botón, Checkpoint, Meta) |
| `9` o `O` | Colocar Objeto / Mueble |
| `Flechas` | Mover selección (`Shift` = 4 pasos) |
| `Supr` / `Backspace` | Eliminar elemento seleccionado |
| `Cmd+D` / `Ctrl+D` | Duplicar elemento seleccionado |
| `Cmd+Z` / `Shift+Cmd+Z` | Deshacer / Rehacer (hasta 100 pasos) |
| `Cmd+S` / `Ctrl+S` | Guardar `niveles.js` |
| `Alt` *(mientras arrastras)* | Desactivar imán / grilla |
| `Espacio` *(mientras arrastras)* | Desplazar la cámara por el lienzo |
