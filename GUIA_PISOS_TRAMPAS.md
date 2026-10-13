# Guia rapida: pisos, huecos y trampas

Todo se configura en `niveles.js`.

## 1. Pintar el piso

Cada nivel tiene un `tilesTema`.

```js
tilesTema: "sotano",
tilesVariantes: 2,
```

Eso hace que el juego busque:

```text
assets/tiles/piso_sotano_01.png
assets/tiles/piso_sotano_02.png
```

Si `tilesVariantes` es `3`, busca `_01`, `_02` y `_03`.

Los tiles de piso deben medir `128x64`.

## 2. Poner plataformas

Las plataformas estan en la propiedad `plataformas`.

Ejemplo simple:

```js
plataformas: [
    piso(0, 520),
    piso(700, 400)
]
```

Formato:

```js
piso(x, ancho)
```

- `x`: donde empieza la plataforma.
- `ancho`: cuanto mide horizontalmente.

## 3. Poner huecos

Usa `pisoConHueco`.

```js
plataformas: [
    pisoConHueco(0, 520, 128),
    piso(648, 400)
]
```

Formato:

```js
pisoConHueco(x, ancho, anchoHueco)
```

El hueco aparece despues de esa plataforma.

## 4. Poner trampa pivote

Usa `pivote` o `pivoteConHueco`.

```js
plataformas: [
    pisoConHueco(0, 520, 128),
    pivoteConHueco(648, 330, 112),
    piso(1090, 470)
]
```

Para que funcione como trampa, el piso tambien debe tener:

```js
trampasHabilitadas: [TRAMPAS.PIVOTE],
```

Si `TRAMPAS.PIVOTE` no esta en esa lista, la plataforma se dibuja y se comporta como piso normal.

## 5. Poner piso resbaladizo

Usa `pisoResbaladizo` o `pisoResbaladizoConHueco`.

```js
plataformas: [
    pisoConHueco(0, 520, 128),
    pisoResbaladizoConHueco(648, 330, 112),
    piso(1090, 470)
]
```

Para que el nivel lo permita, agrega:

```js
trampasHabilitadas: [TRAMPAS.RESBALADIZO],
```

## 6. Bordes de huecos

Los bordes se ponen automaticamente cuando usas `pisoConHueco`, `pivoteConHueco` o `pisoResbaladizoConHueco`.

Para el tema `sotano`, los archivos son:

```text
assets/tiles/borde_roto_der_sotano.png
assets/tiles/borde_roto_izq_sotano.png
```

- `der`: final de una plataforma, antes del hueco.
- `izq`: inicio de la siguiente plataforma, despues del hueco.

Tambien deben medir `128x64`.

## Ejemplo completo

```js
{
    id: 21,
    nombre: "Piso 21: Prueba",
    fondoRuta: "assets/fondos/fondo_21_prueba.png",
    colorPlaceholder: "#2d3a34",
    tipoPiso: TIPOS_PISO.CONCRETO,
    tilesTema: "mantenimiento",
    tilesVariantes: 3,
    trampasHabilitadas: [TRAMPAS.HUECO_ROTO, TRAMPAS.PIVOTE, TRAMPAS.RESBALADIZO],
    propsPermitidos: [PROPS.CAJAS],
    plataformas: [
        pisoConHueco(0, 520, 128),
        pivoteConHueco(648, 330, 112),
        pisoResbaladizoConHueco(1090, 470, 144),
        piso(1704, 444)
    ]
}
```

## Ajustar personaje

Cada personaje se configura en `personajes.js`.

```js
render: {
    escala: 1,
    offsetX: 0,
    offsetY: 0
},
colision: {
    ancho: 64,
    alto: 172,
    offsetX: 32,
    offsetY: 9
}
```

`render` controla como se ve:

- `escala`: tamano visual. `1` es normal, `0.9` mas chico, `1.1` mas grande.
- `offsetX`: mueve el sprite visual a izquierda/derecha.
- `offsetY`: mueve el sprite visual arriba/abajo.

`colision` controla donde pisa y choca:

- `ancho`: ancho real de apoyo del personaje.
- `alto`: altura real desde cabeza hasta pies.
- `offsetX`: separacion desde el borde izquierdo del sprite hasta la caja de colision.
- `offsetY`: separacion desde arriba del sprite hasta la caja de colision.

Si el personaje parece flotar, aumenta `offsetY` de `render`.
Si parece hundido en el piso, baja `offsetY` de `render`.
Si se cae aunque visualmente aun toca el borde, aumenta `colision.ancho`.
