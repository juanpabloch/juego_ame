# Guía Técnica: Pisos, Plataformas, Trampas, Botones e Ítems

Esta guía documenta todas las estructuras de datos y funciones constructoras disponibles en [`niveles_base.js`](./niveles_base.js) y [`niveles.js`](./niveles.js), así como las convenciones de nombres para los archivos de arte en `assets/`.

---

## 1. Estructura de un Piso en `niveles.js`

Cada nivel dentro de `PISOS_CONFIG` representa un piso del edificio (ordenados en descenso desde el **Piso 20: Mi Departamento** hasta el **Piso 01: Recepción**):

```js
{
    id: 20,
    nombre: "Piso 20: Mi Departamento (¡Sin Leche!)",
    fondoRuta: "assets/fondos/fondo_20_cuarto_calderas.png",
    colorPlaceholder: "#3a3028",
    tipoPiso: TIPOS_PISO.PARQUE,
    tilesTema: "pasillo_departamentos",
    tilesVariantes: 3,
    trampasHabilitadas: [TRAMPAS.HUECO_ROTO, TRAMPAS.PIVOTE, TRAMPAS.RESBALADIZO, TRAMPAS.QUEBRADIZO],
    propsPermitidos: [PROPS.CAJAS, PROPS.PLANTA_SECA],
    objetos: [ ... ],        // Muebles y objetos con o sin colisión
    plataformas: [ ... ],    // Suelo principal y plataformas flotantes/especiales
    trampas: [ ... ],        // Obstáculos activos del edificio
    checkpoints: [ ... ],    // Puntos de control intermedios
    items: [ ... ],          // Vidas, Doble Salto, Café y Tarjeta de acceso
    interruptores: [ ... ],  // Botones que activan/desactivan canales
    meta: ascensorMeta(...)  // Ascensor de bajada al siguiente piso
}
```

---

## 2. Tipos de Plataformas y Constructores (`niveles_base.js`)

### A. Plataformas de Suelo Principal (`y = 600` por defecto)

| Función | Descripción |
| :--- | :--- |
| `piso(x, ancho, opciones)` | Tramo de suelo firme normal. |
| `pisoConHueco(x, ancho, anchoHueco, opciones)` | Suelo firme seguido de un hueco hacia el vacío. |
| `pivote(x, ancho, opciones)` / `pivoteConHueco(...)` | Trampilla que gira de `0°` a `90°` al pisarla y deja caer al jugador a los `45°`. |
| `pisoResbaladizo(x, ancho, opciones)` / `pisoResbaladizoConHueco(...)` | Piso mojado o encerado: aplica baja fricción (`0.965`) y menor aceleración en [`motor.js`](./motor.js), haciendo patinar al personaje. |
| `pisoQuebradizo(x, ancho, opciones)` / `pisoQuebradizoConHueco(...)` | Baldosa floja que vibra al pisarla, colapsa tras `420 ms` y se regenera a los `2600 ms`. |

### B. Plataformas Flotantes y Especiales

| Función | Ejemplo | Descripción |
| :--- | :--- | :--- |
| `plataformaFlotante(x, y, ancho, opciones)` | `plataformaFlotante(480, 470, 140)` | Plataforma aérea *one-way* (se puede atravesar saltando desde abajo). |
| `plataformaMovil(x, y, ancho, eje, rango, velocidad, opciones)` | `plataformaMovil(900, 460, 140, "x", 120, 2.1)` | Plataforma que se mueve en vaivén horizontal (`"x"`) o vertical (`"y"`), arrastrando al jugador con ella. |
| `plataformaCinta(x, y, ancho, velocidadCinta, opciones)` | `plataformaCinta(1200, 600, 256, 2.8)` | Cinta o pasillo rodante que empuja al jugador hacia la derecha (`+`) o izquierda (`-`). |
| `plataformaRebote(x, y, ancho, fuerzaRebote, opciones)` | `plataformaRebote(1500, 520, 96, -19.5)` | Colchón/resorte que impulsa automáticamente al jugador hacia arriba al pisarlo. |

> **Opciones de Canal en cualquier plataforma:**
> Puedes pasar `{ canal: "puente_1", ocultaInicial: true }` en `opciones` para que la plataforma comience desactivada (dibujada como silueta punteada) y se vuelva sólida cuando el jugador pise un `interruptor` con el canal `"puente_1"`.

---

## 3. Trampas y Obstáculos del Edificio (`trampas`)

Todos los constructores de trampas aceptan `opciones` adicionales como `{ imagen: "assets/trampas/mi_trampa.png", canal: "corte_1" }`:

| Función en `niveles_base.js` | Tipo (`TIPOS_TRAMPA_ACTIVA`) | Parámetros principales | Mecánica en el juego |
| :--- | :--- | :--- | :--- |
| `trampaPinchos(x, y, ancho, alto, orientacion, opciones)` | `pinchos` | `orientacion`: `"arriba"`, `"abajo"`, `"izquierda"`, `"derecha"` | Muebles rotos, vidrios o escombros punzantes que quitan 1 vida al contacto. |
| `trampaVapor(x, y, ancho, alto, intervaloMs, duracionMs, opciones)` | `vapor` | `intervaloMs` (reposo), `duracionMs` (activo), `avisoMs` | Cañería o válvula rota que avisa y lanza un chorro de vapor o agua hirviendo. |
| `trampaLaser(x, y, ancho, alto, intervaloMs, duracionMs, opciones)` | `laser` | `intervaloMs`, `duracionMs`, `orientacion` | Cables pelados o tablero en cortocircuito que descarga electricidad periódicamente. |
| `trampaSierra(x, y, tamano, eje, rango, velocidad, opciones)` | `sierra` | `eje` (`"x"` o `"y"`), `rango` (px), `velocidad` | Ventilador industrial o extractor suelto que patrulla un recorrido fijo. |
| `trampaAplastador(x, yTecho, ancho, altoCaida, intervaloMs, opciones)` | `aplastador` | `yTecho`, `altoCaida`, `intervaloMs`, `duracionMs` | Plafón de techo o contrapeso que tiembla en aviso, cae de golpe al suelo y vuelve a subir. |

---

## 4. Botones / Interruptores Interactivos (`interruptores`)

Los botones permiten accionar mecanismos del edificio al pisarlos o tocarlos:

```js
interruptor(x, y, canal, {
    ancho: 56,
    alto: 20,
    modo: "permanente", // o "temporal"
    duracionMs: 5000,   // usado cuando modo === "temporal"
    etiqueta: "PUENTE",
    imagen: ""          // ruta PNG opcional
})
```

- **Cómo funciona `canal`:**
  - Toda **plataforma** con `canal: "puente_1"` y `ocultaInicial: true` pasa a estar **activa y sólida** mientras el canal `"puente_1"` esté encendido.
  - Toda **trampa** con `canal: "puente_1"` pasa a estar **apagada/inofensiva** mientras el canal `"puente_1"` esté encendido.

---

## 5. Ítems, Poderes, Checkpoints y Meta (`items`, `checkpoints`, `meta`)

| Función | Ejemplo | Efecto |
| :--- | :--- | :--- |
| `itemNivel(TIPOS_ITEM.VIDA, x, y, opciones)` | `itemNivel(TIPOS_ITEM.VIDA, 620, 510)` | Suma `+1 ♥` de vida (máximo 6). |
| `itemNivel(TIPOS_ITEM.DOBLE_SALTO, x, y, opciones)` | `itemNivel(TIPOS_ITEM.DOBLE_SALTO, 840, 440)` | Otorga el **Poder de Doble Salto (`2X ▲`)**. |
| `itemNivel(TIPOS_ITEM.CAFE, x, y, opciones)` | `itemNivel(TIPOS_ITEM.CAFE, 1100, 520)` | Aumenta la velocidad máxima un `32%` durante `6.5` segundos. |
| `itemNivel(TIPOS_ITEM.TARJETA, x, y, opciones)` | `itemNivel(TIPOS_ITEM.TARJETA, 1850, 420)` | Recoge la llave/tarjeta necesaria para desbloquear el ascensor del piso. |
| `checkpoint(x, y, opciones)` | `checkpoint(1400, 490)` | Guarda el punto de reaparición del jugador en ese piso. |
| `ascensorMeta(x, y, opciones)` | `ascensorMeta(2950, 456, { requiereLlave: true })` | Ascensor de bajada al siguiente piso (o salida a la calle con el cartón de leche en el Piso 01). |

---

## 6. Formato y Nombres de Archivos de Arte (`assets/`)

| Categoría | Ruta esperada | Tamaño recomendado | Notas |
| :--- | :--- | :--- | :--- |
| **Fondos** | `assets/fondos/fondo_<NN>_<tema>.png` | `1376×768` o similar | Repetible horizontalmente (parallax). |
| **Tiles de suelo** | `assets/tiles/piso_<tema>_01.png`, `_02`... | `128×64` | Superficie caminable alineada al borde superior. |
| **Bordes de hueco** | `assets/tiles/borde_roto_izq_<tema>.png` y `borde_roto_der_<tema>.png` | `128×64` | PNG con transparencia. |
| **Trampilla pivote** | `assets/tiles/trampa_pivote_<tema>.png` | `128×64` | PNG con transparencia. |
| **Objetos / Muebles** | `assets/props/<id>.png` o ruta en `imagen` | Libre | Configurable en `CATALOGO_OBJETOS`. |
| **Trampas / Ítems** | Cualquier ruta en su propiedad `imagen` | Libre | Configurable desde el botón `Elegir…` en `admin.html`. |
