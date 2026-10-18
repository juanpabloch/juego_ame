# ¡Sin Leche! — Juego de Plataformas 2D (`juego_ame`)

Juego de plataformas lateral 2D con **20 pisos temáticos de un edificio en emergencia**, editor visual integrado ([`admin.html`](./admin.html)) y arquitectura modular en JavaScript puro (sin dependencias externas ni bundlers).

---

## 🥛 Historia y Objetivo del Juego

El protagonista está en su departamento (**Piso 20: Mi Departamento**) preparando el desayuno cuando descubre que **se quedó sin leche**. Justo antes de salir a comprar al kiosco de la esquina, ocurre un desperfecto general en el edificio: se cortan los ascensores directos, revientan cañerías, saltan chispas de los tableros eléctricos y varios pisos quedan bloqueados.

**El objetivo:** Ir bajando piso por piso —desde el **Piso 20 (Departamento)** hasta el **Piso 01 (Recepción / Salida a la Calle)**— superando los obstáculos de cada sector del edificio, activando **botones/interruptores** para desplegar puentes o cortar trampas, encontrando **tarjetas de acceso** y llegando al ascensor de bajada de cada nivel.

---

## 🗂️ Arquitectura del Proyecto

El código está dividido en módulos con responsabilidades claras y orden de carga explícito en [`index.html`](./index.html) y [`admin.html`](./admin.html):

```text
juego_ame/
├── index.html                  # Juego principal (pantalla de historia, controles, HUD y canvas 1360×768)
├── admin.html                  # Editor visual de pisos, plataformas, trampas, botones y catálogo
├── admin.css                   # Estilos del editor visual
├── constantes.js               # Dimensiones del lienzo, física global, tiempos y parámetros de cámara
├── estado.js                   # Estado global reactivo (jugador, piso activo, cámara, partículas, trampas)
├── niveles_base.js             # Constantes y constructores de pisos, plataformas, trampas, ítems y botones
├── niveles.js                  # Datos de los 20 pisos y CATALOGO_OBJETOS (generado/guardado por admin.html)
├── personajes.js               # Configuración de personajes (Juan y Ame), físicas y sprite sheets
├── controles.js                # Entrada de teclado (movimiento, salto, doble salto, agacharse, dash)
├── motor.js                    # Bucle de física, colisiones, plataformas especiales, trampas, canales y vidas
├── escenario.js                # Renderizado en Canvas 2D (fondos parallax, tiles, props, trampas, HUD)
├── main.js                     # Inicialización del selector de personajes/pisos, modales y puente con el editor
├── admin.js                    # Lógica completa del editor visual (inspector, lienzo, validación y guardado)
├── GUIA_ADMIN.md               # Manual completo del editor de niveles (admin.html)
├── GUIA_PISOS_TRAMPAS.md       # Referencia técnica de plataformas, trampas, canales, ítems y funciones
├── GUIA_SPRITES_MOVIMIENTOS.md # Manual de sprites de personajes, físicas e imágenes PNG personalizadas
└── assets/
    ├── fondos/                 # Fondos horizontales repetibles (parallax) de cada piso
    ├── tiles/                  # Tiles de suelo (128×64), bordes rotos y trampillas pivote
    ├── props/                  # Objetos decorativos, muebles y plataformas con colisión
    ├── trampas/                # PNGs opcionales para pinchos, vapor, láser, sierra y aplastador
    ├── items/                  # PNGs opcionales para vidas, doble salto, café, tarjeta y botones
    └── sprites/                # Hojas de sprites (sprite sheets) para Juan (jp) y Ame (ame)
```

### Flujo de Carga de Scripts (`index.html`)

1. **[`constantes.js`](./constantes.js)**: Define `ANCHO_LIENZO` (`1360`), `ALTO_LIENZO` (`768`), `ALTURA_PISO_BASE` (`600`), gravedad y constantes de jugabilidad.
2. **[`estado.js`](./estado.js)**: Inicializa `jugador`, `plataformasNivel`, `trampasNivel`, `itemsNivel`, `interruptoresNivel`, `canalesActivosNivel` y efectos visuales.
3. **[`niveles_base.js`](./niveles_base.js)**: Declara `TIPOS_PISO`, `TIPOS_PLATAFORMA`, `TIPOS_TRAMPA_ACTIVA`, `TIPOS_ITEM` y los helpers constructores (`piso()`, `plataformaFlotante()`, `trampaVapor()`, `interruptor()`, etc.).
4. **[`niveles.js`](./niveles.js)**: Define `CATALOGO_OBJETOS` y los 20 niveles en `PISOS_CONFIG` (en orden de descenso del Piso 20 al Piso 01).
5. **[`personajes.js`](./personajes.js)**: Registra `personajesDisponibles` (`juan` y `ame`) con autodetección de frames por imagen.
6. **[`controles.js`](./controles.js)**: Escucha eventos de teclado y gestiona *jump buffer*, *coyote time*, doble salto aéreo y *dash*.
7. **[`motor.js`](./motor.js)**: Ejecuta `actualizarJuego()` y `gameLoop()`: físicas, colisiones, canales de interruptores, daño, vidas, checkpoints y transición entre pisos.
8. **[`escenario.js`](./escenario.js)**: Dibuja el mundo, indicadores de peligro, botones/canales, HUD superior y pantallas de transición/victoria.
9. **[`main.js`](./main.js)**: Conecta la interfaz HTML con el motor y recibe niveles en vivo desde [`admin.html`](./admin.html) vía `postMessage`.

---

## 🎮 Controles del Juego

| Acción | Teclas | Descripción |
| :--- | :--- | :--- |
| **Moverse** | `←` `→` o `A` `D` | Corre a izquierda o derecha (con inercia sobre pisos mojados/resbaladizos). |
| **Saltar** | `Espacio`, `↑` o `W` | Salto principal (incluye *coyote time* al salir de un borde y *jump buffer*). |
| **Doble Salto** | `Espacio`, `↑` o `W` *(en el aire)* | Segundo impulso aéreo cuando el jugador obtuvo el poder **`doble_salto` (`2X ▲`)**. |
| **Agacharse** | `↓` o `S` | Reduce la altura de la caja de colisión a la mitad para esquivar chorros altos o láseres. |
| **Dash (Impulso)** | `Shift`, `Z` o `X` | Impulso horizontal rápido con estela; permite cruzar huecos largos y recuperar impulso. |
| **Ver Colisiones** | `C` | Muestra u oculta en tiempo real todas las cajas de colisión (hitboxes). |
| **Toggle Doble Salto** | `P` | Activa o desactiva el poder de Doble Salto para pruebas rápidas. |

---

## 🛠️ Cómo Editar Niveles Sin Tocar Código (`admin.html`)

Abre **[`admin.html`](./admin.html)** en **Chrome o Edge**:

1. **Seleccionar un piso:** En la columna izquierda tienes los 20 pisos del edificio (desde *Piso 20: Mi Departamento* hasta *Piso 01: Recepción*).
2. **Pintar suelos y mecánicas:**
   - **`1` Piso normal**, **`2` Pivote (trampilla que gira)**, **`3` Resbaladizo (piso encerado/mojado con baja fricción)**, **`4` Quebradizo (baldosa floja que se rompe tras pisarla)**, **`5` Hueco**.
   - **`6` Plataforma flotante**: Crea plataformas aéreas fijas, **móviles** (ascensores/montacargas en eje X o Y), **cintas transportadoras** o **trampolines de rebote**. También puedes marcarlas como **Oculta al inicio** y asignarles un **Canal** para que aparezcan al pisar un botón.
3. **Colocar obstáculos del edificio (`7` Trampa):**
   - **Mueble / Escombro Punzante (`pinchos`)**, **Chorro de Vapor / Agua (`vapor`)**, **Cables Pelados / Cortocircuito (`laser`)**, **Ventilador / Extractor (`sierra`)**, **Cielo Raso / Plafón que Cae (`aplastador`)**.
   - A cualquier trampa puedes asignarle un **Canal de interruptor** para que un botón del piso la apague.
4. **Colocar ítems, botones y ascensor (`8` Elemento / Meta):**
   - **Ítems:** **Vida Extra (`+1 ♥`)**, **Poder Doble Salto (`2X ▲`)**, **Café Expreso (Velocidad)** y **Llave / Tarjeta de Ascensor**.
   - **Botón / Interruptor (`interruptor`):** Activa plataformas ocultas o desactiva trampas que compartan el mismo nombre de **Canal** (ej. `puente_1`), de forma **permanente** o **temporal**.
   - **Checkpoint** y **Ascensor de Bajada (Meta)**.
5. **Cargar imágenes PNG personalizadas:** Todo objeto, trampa, ítem, botón, checkpoint o meta tiene un campo **`Imagen PNG`** con botón **`Elegir…`** para usar tu propio gráfico. Si se deja vacío, el motor dibuja su versión animada por defecto.
6. **Probar y Guardar:**
   - **▶ Probar piso** abre el nivel actual dentro del editor sin necesidad de guardar antes.
   - **Guardar `niveles.js`** (`Cmd+S` / `Ctrl+S`) escribe directamente el archivo [`niveles.js`](./niveles.js).

---

## 📚 Documentación Detallada

- **[`GUIA_ADMIN.md`](./GUIA_ADMIN.md)**: Guía paso a paso del editor visual [`admin.html`](./admin.html), paneles del inspector, botones/canales, catálogo de objetos y atajos.
- **[`GUIA_PISOS_TRAMPAS.md`](./GUIA_PISOS_TRAMPAS.md)**: Referencia completa de funciones de [`niveles_base.js`](./niveles_base.js), tipos de plataformas, trampas del edificio, interruptores y formato de archivos de arte.
- **[`GUIA_SPRITES_MOVIMIENTOS.md`](./GUIA_SPRITES_MOVIMIENTOS.md)**: Cómo cambiar los sprites de los personajes, ajustar velocidad/salto/vidas y asignar imágenes PNG a cualquier elemento.

---

## ✅ Verificación Rápida de Sintaxis

Si editas archivos `.js` manualmente, puedes verificar que no existan errores de sintaxis ejecutando:

```bash
node --check constantes.js
node --check estado.js
node --check niveles_base.js
node --check niveles.js
node --check personajes.js
node --check motor.js
node --check escenario.js
node --check main.js
node --check admin.js
```
