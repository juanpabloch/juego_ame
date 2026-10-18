# Manual Completo: Sprites, Movimientos del Personaje e Imágenes Personalizadas

Esta guía explica paso a paso:
1. **Cómo cambiar o agregar las imágenes (*sprites*) de los personajes** (**Juan `jp`** y **Ame `ame`**).
2. **Cómo modificar la velocidad, el salto, el doble salto, el dash, la inercia en pisos resbaladizos, las vidas y la caja de colisión** en [`personajes.js`](./personajes.js) y [`motor.js`](./motor.js).
3. **Cómo colocar objetos, trampas del edificio, botones/interruptores, vidas (`+1 ♥`) y el poder de Doble Salto (`2X ▲`) donde quieras** y **cargarles cualquier imagen PNG personalizada** desde [`admin.html`](./admin.html) o [`niveles.js`](./niveles.js).

---

## 1. Imágenes del Personaje (*Sprite Sheets*)

Todos los sprites de los personajes van en una **tira horizontal (*sprite sheet*)** con **fondo transparente (PNG)**.
Por defecto, cada cuadro individual (*frame*) mide **`128 px` de ancho × `181 px` de alto**.

> **Importante:** El motor en [`personajes.js`](./personajes.js) y [`escenario.js`](./escenario.js) detecta estas imágenes **automáticamente**:
> - **Si un archivo PNG opcional aún no existe** (`agachar.png`, `dash.png`, `doble_salto.png`, `dano.png`), el juego **no falla ni se pone negro**: usa tus sprites base (`quieto.png`, `correr.png`, `salto.png`) con deformación elástica (*squash & stretch*), estelas de velocidad en el Dash, onda turquesa bajo los pies en el Doble Salto y destello rojo con empujón al perder una vida.
> - **En cuanto guardes un PNG nuevo** en su carpeta y recargues el navegador, el juego empezará a usar tu dibujo automáticamente.

| Movimiento / Estado | Archivo para Juan (`jp`) | Archivo para Ame (`ame`) | Frames recomendados | Tamaño total del PNG (`Ancho × Alto`) | ¿Es obligatorio? |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Quieto (Idle)** | `assets/sprites/jp/quieto.png` | `assets/sprites/ame/quieto.png` | 2 frames | `256 × 181 px` | Sí (ya existe) |
| **Correr (Run)** | `assets/sprites/jp/correr.png` | `assets/sprites/ame/correr.png` | 4 frames | `512 × 181 px` | Sí (ya existe) |
| **Saltar (Jump)** | `assets/sprites/jp/salto.png` | `assets/sprites/ame/salto.png` | 3 frames | `384 × 181 px` | Sí (ya existe) |
| **Doble Salto (2º salto aéreo)** | `assets/sprites/jp/doble_salto.png` | `assets/sprites/ame/doble_salto.png` | **2 o 3 frames** | **`256 × 181 px`** o **`384 × 181 px`** | Opcional *(usa `salto.png` si no está)* |
| **Agacharse (Duck)** | `assets/sprites/jp/agachar.png` | `assets/sprites/ame/agachar.png` | **2 frames** *(1 a 4)* | **`256 × 181 px`** | Opcional |
| **Dash (Impulso)** | `assets/sprites/jp/dash.png` | `assets/sprites/ame/dash.png` | **2 frames** *(o 3)* | **`256 × 181 px`** | Opcional |
| **Daño (Perder 1 vida)** | `assets/sprites/jp/dano.png` | `assets/sprites/ame/dano.png` | **2 frames** *(o 1)* | **`256 × 181 px`** | Opcional |

> **Autodetección de Frames:** Si haces `agachar.png` o `doble_salto.png` de 1 solo frame (`128×181`), de 2 frames (`256×181`), de 3 (`384×181`) o de 4 (`512×181`), la función [`sincronizarFramesAnimacion`](./personajes.js) divide el ancho de tu imagen por `128` y calcula sola cuántos frames tiene la animación.

---

## 2. Regla de Oro para Dibujar los Sprites (`128 × 181 px`)

Para que el personaje **no flote ni se hunda en el piso** al pasar de estar parado a correr o agacharse, todos los frames deben apoyar las suelas de los pies en la **misma línea inferior** que `quieto.png`:

```text
Lienzo de 1 Frame (128 px ancho × 181 px alto)
┌──────────────────────────┐  y = 0 (Borde superior del PNG)
│                          │
│     [ Zona libre al      │  <- Cuando el personaje se AGACHA,
│       agacharse ]        │     esta mitad superior queda transparente.
│                          │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤  y ≈ 91 px (Mitad de la altura: cabeza al agacharse)
│       ╭──────────╮       │
│       │ Personaje│       │  <- Cuerpo encogido / agachado
│       │ agachado │       │
│       ╰──🦶──🦶──╯       │
════════════════════════════  y ≈ 160-172 px (Línea donde apoyan las suelas en quieto.png)
└──────────────────────────┘  y = 181 (Borde inferior del PNG)
```

- **Orientación:** Dibuja siempre al personaje mirando hacia la **derecha**. Cuando camina a la izquierda, el motor invierte la imagen horizontalmente de forma automática.

---

## 3. Cómo Cambiar los Movimientos y Físicas del Personaje

Toda la configuración de velocidad, salto, doble salto y colisión de cada personaje está en [`personajes.js`](./personajes.js) dentro de `personajesDisponibles`:

### A. Velocidad, Salto, Doble Salto y Dash (en [`personajes.js`](./personajes.js))

Abre [`personajes.js`](./personajes.js) y busca el bloque de `juan` o `ame`:

```javascript
velocidad: 5,               // Velocidad máxima al correr en tierra
fuerzaSalto: 14,            // Impulso hacia arriba del primer salto (más alto = salta más alto)
fuerzaDobleSalto: 12.8,     // Impulso hacia arriba del 2º salto en el aire (cuando tiene el poder Doble Salto)
dobleSaltoInicial: false,   // Ponlo en `true` si quieres que empiece desde el primer nivel con Doble Salto
aceleracionTierra: 0.95,    // Qué tan rápido acelera al arrancar
friccionTierra: 0.80,       // Qué tan rápido frena al soltar la tecla (en piso resbaladizo usa 0.965 para patinar)
aceleracionAire: 0.68,      // Control en el aire
velocidadAgachado: 2.35,    // Velocidad al caminar agachado (Flecha Abajo / S)
velocidadDash: 13.5,        // Velocidad del impulso horizontal (Shift / Z / X)
dashFrames: 11,             // Duración del Dash en frames (a 60 FPS, 11 frames ≈ 0.18 seg)
dashCooldownMs: 360,        // Tiempo de espera en milisegundos antes de poder hacer otro Dash
```

### B. Cambiar la Velocidad de las Animaciones o el Tamaño del Sprite (en [`personajes.js`](./personajes.js))

Dentro de `animaciones` de cada personaje en [`personajes.js`](./personajes.js):
- **`velocidadAnimacion`**: Cuántos frames del juego dura cada dibujo antes de pasar al siguiente.
  - Un número **menor** (`4` o `5`) hace que la animación vaya **más rápido**.
  - Un número **mayor** (`10` o `12`) hace que la animación vaya **más lento**.
- **`anchoFrame` y `altoFrame`**: Si algún día decides dibujar sprites más grandes (por ejemplo `256 × 256 px` por cuadro), cambia `ANCHO_FRAME_DEFAULT` y `ALTO_FRAME_DEFAULT` arriba del todo en [`personajes.js`](./personajes.js).

### C. Vidas y Reinicio de Emergencia en Game Over (en [`estado.js`](./estado.js) y [`motor.js`](./motor.js))

En [`estado.js`](./estado.js) dentro del objeto `jugador`:
- **`vidaMax: 3`**: Cantidad de corazones con los que arranca el personaje (puedes subirlo a `4` o `5`, o recoger ítems de **Vida `+1 ♥`** en los niveles hasta un tope de `6` corazones).
- **Qué pasa cuando pierdes una vida**:
  - Si tocas una trampa del edificio o caes a un vacío y todavía te quedan vidas (`vida > 1`), se activa el **efecto de daño** (sacudida de cámara, destello rojo y parpadeo de invulnerabilidad temporal) o reapareces en tu último *Checkpoint* con 1 vida menos.
  - **Si pierdes todas las vidas (`vida = 0`)**: Aparece el cartel **`GAME OVER — Sin vidas · Regresando al Departamento`**, se restauran todas tus vidas al máximo (`3 ♥`) y vuelves a empezar el descenso desde el **Piso 20 (Mi Departamento)**.

---

## 4. Poder de Doble Salto y Vidas Colocables en Cualquier Piso

1. **Salto normal:** Al presionar `Espacio`, `W` o `Flecha Arriba` en el suelo, el personaje hace un salto limpio utilizando `salto.png`.
2. **Cómo se obtiene el Doble Salto:**
   - Colocando el ítem **`Poder Doble Salto (2X ▲)`** (`tipo: "doble_salto"`) en cualquier lugar de cualquier piso desde el editor [`admin.html`](./admin.html).
   - Al tocarlo en el juego, aparece un aviso **`¡PODER DESBLOQUEADO: DOBLE SALTO!`** y el indicador `SALTO 2X ▲` en el HUD superior.
   - Estando en el aire, al volver a presionar `Espacio`, `W` o `Flecha Arriba`, el personaje suelta una onda de impulso turquesa bajo los pies y realiza el segundo salto aéreo.
   - *Atajo para pruebas:* En la barra superior de [`index.html`](./index.html) tienes la casilla **`Poder Doble Salto`** (o la tecla **`P`**) para activarlo o desactivarlo en cualquier momento mientras pruebas un nivel.
3. **Cómo colocar Vidas (`+1 ♥`):**
   - Con la herramienta **`8` Elemento / Meta** en [`admin.html`](./admin.html), elige la categoría **Item / Poder** y el tipo **`Vida (+1 ♥)`** (`tipo: "vida"`).

---

## 5. Cómo Colocar Objetos, Trampas, Botones e Ítems Donde Quieras y Cargarles Tu Propia Imagen PNG

Tanto los **Objetos**, como las **Trampas** (`pinchos`, `vapor`, `laser`, `sierra`, `aplastador`), los **Ítems/Poderes** (`vida`, `doble_salto`, `tarjeta`, `cafe`), los **Botones/Interruptores**, los **Checkpoints** y el **Ascensor Meta** se pueden arrastrar libremente a cualquier coordenada `(X, Y)` y admiten **cualquier imagen PNG personalizada**.

### En el Editor Visual ([`admin.html`](./admin.html)):

1. **Mover libremente a cualquier parte:**
   - Selecciona la herramienta **`V` Seleccionar** y arrastra cualquier objeto, trampa, botón o ítem con el mouse.
   - Si mantienes presionada la tecla **`Alt`** mientras arrastras un objeto, se desactiva el imán del suelo y la grilla para dejarlo flotando en el aire en el píxel exacto que quieras.
2. **Cargar o asignar una imagen PNG a un Objeto, Trampa, Botón o Ítem:**
   - Haz clic sobre el **Objeto**, **Trampa** o **Elemento/Ítem** en el lienzo.
   - En el panel derecho (**Inspector**), verás el campo **`Imagen PNG`** junto al botón **`Elegir…`**:
     - **Opción A (Botón `Elegir…`):** Haz clic en **`Elegir…`** y selecciona tu archivo `.png` (guárdalo dentro de `assets/objetos/`, `assets/trampas/` o `assets/items/`). El editor completará la ruta automáticamente y mostrará tu imagen al instante en el lienzo.
     - **Opción B (Escribir ruta):** Escribe directamente la ruta relativa, por ejemplo `assets/trampas/ventilador_oxidado.png` o `assets/items/boton_rojo.png`.
   - Si dejas el campo **`Imagen PNG` vacío**, el juego usa el dibujo o animación integrada por defecto para esa trampa, botón o ítem.
3. **Guardar cambios:**
   - Presiona **`Guardar niveles.js`** (`Ctrl+S` / `Cmd+S`) o usa **`▶ Probar piso`** para jugarlo de inmediato dentro del editor.
