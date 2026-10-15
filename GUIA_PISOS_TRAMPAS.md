# Guia rapida: pisos, huecos y trampas

Todo se configura en `niveles.js`, a mano o con el editor (`admin.html`), que reescribe ese
archivo al guardar. Las funciones `piso()`, `pisoConHueco()`, etc. estan en `niveles_base.js`.

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

### Nombre de la imagen del pivote

Una sola imagen por tema, en `assets/tiles/`:

```text
assets/tiles/trampa_pivote_<tema>.png
```

`<tema>` es exactamente el `tilesTema` del piso. Ejemplos:

```text
tilesTema: "recepcion"   ->  assets/tiles/trampa_pivote_recepcion.png
tilesTema: "biblioteca"  ->  assets/tiles/trampa_pivote_biblioteca.png
```

- Tamano: `128x64`, fondo transparente, la parte caminable pegada a la fila de arriba.
- No lleva `_01`, `_02`: el pivote no usa variantes.
- No es una hoja de animacion. Es una imagen quieta; el giro lo hace el codigo.
- Se dibuja encima del piso normal y se repite cada 128px. Si la plataforma tiene hueco a un
  lado, ese extremo (128px) lo ocupa el borde roto y la imagen del pivote solo cubre el resto.
  Por eso conviene que el ancho del pivote sea multiplo de 128 (256, 384...); con otros anchos
  la ultima pieza se ve aplastada.
- Si el archivo falta, el pivote se ve como un bloque gris con una barra oscura en el centro.

Hoy no existe ningun `trampa_pivote_*.png` en `assets/tiles/`, y ningun piso de `niveles.js`
usa `pivote()`: los pisos 4, 6, 7, 9, 11, 14, 15, 18, 19 y 20 tienen `TRAMPAS.PIVOTE`
habilitada pero sin plataformas pivote.

### Secuencia del pivote

1. El jugador apoya los pies sobre la plataforma (al menos 40% del ancho de su colision).
2. La trampa se activa y la plataforma entera empieza a girar sobre su centro.
3. Gira de 0 a 90 grados en 650 ms.
4. A los 45 grados (unos 325 ms) deja de sostener: el jugador cae.
5. Al salir por debajo de la pantalla pierde 1 vida y reaparece en la ultima plataforma
   que no sea pivote.
6. Al reaparecer, todos los pivotes del piso vuelven a su posicion inicial.

Para pasar hay que cruzarla o saltar antes de los 325 ms. El pivote no vuelve solo: una vez
activado queda caido hasta que el jugador muere o cambia de piso.

Cada plataforma pivote gira por separado. Dos pivotes pegados son dos trampas, no una larga.

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

El resbaladizo no tiene imagen propia: usa los tiles normales del tema con un brillo celeste
encima. Por ahora es solo visual: `motor.js` no cambia el movimiento del jugador sobre ese
piso, este o no `TRAMPAS.RESBALADIZO` en la lista.

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

## 7. Resumen de nombres de archivo

Todo en minusculas, sin tildes ni espacios, con `_` entre palabras.

| Que es | Nombre | Tamano |
| --- | --- | --- |
| Fondo | `assets/fondos/fondo_<NN>_<nombre>.png` (el que diga `fondoRuta`) | `1376x768` o similar |
| Piso | `assets/tiles/piso_<tema>_01.png`, `_02`, `_03`... | `128x64` |
| Borde antes del hueco | `assets/tiles/borde_roto_der_<tema>.png` | `128x64` |
| Borde despues del hueco | `assets/tiles/borde_roto_izq_<tema>.png` | `128x64` |
| Trampa pivote | `assets/tiles/trampa_pivote_<tema>.png` | `128x64` |
| Objeto | `assets/props/<objeto>_<tema>_<NN>.png` (`caja_sotano_01.png`) | libre |
| Resbaladizo | no lleva archivo | - |
| Hueco | no lleva archivo (se pinta un degradado negro) | - |

Temas en uso: `sotano`, `archivo`, `mantenimiento`, `recepcion`, `banios`, `pasillo`,
`pasillo_departamentos`, `oficinas_abandonadas`, `terraza_tecnica`, `lavanderia`,
`biblioteca`, `pasillo_ejecutivo`. Todos tienen ya sus pisos y sus dos bordes.

Lo que falta:

- `trampa_pivote_<tema>.png` para todos los temas.
- Fondos de los pisos 8, 12, 13, 16, 19 y 20 (`fondo_08_almacen_limpieza.png`,
  `fondo_12_cocina.png`, `fondo_13_enfermeria.png`, `fondo_16_cuarto_electrico.png`,
  `fondo_19_servidores.png`, `fondo_20_cuarto_calderas.png`).

`borde_roto_izq_bibioteca.png` y `borde_roto_der_bibioteca.png` (sin la `l`) no los usa nadie:
el juego lee los de `biblioteca`.

## 8. Plataformas elevadas (algo donde saltar encima)

Toda plataforma acepta una altura `y` como ultima opcion. El piso normal esta en `y: 560`;
un numero menor queda mas arriba.

```js
plataformas: [
    piso(0, 1090),
    piso(500, 256, { y: 464 }),
    pisoConHueco(1090, 470, 144)
]
```

En el editor: selecciona la plataforma y cambia el campo de altura, o usa flecha arriba/abajo
(mueve de a 16px).

Como se comporta:

- El jugador solo se apoya cuando cae desde arriba. Desde abajo y por los costados la
  atraviesa, asi que puede saltar desde el piso y quedar parado encima.
- Se dibuja con los mismos tiles del piso (un bloque de 64px de alto), no con otra imagen.
- Sirve con `pivote()` y `pisoResbaladizo()` igual que con `piso()`.

Altura maxima que alcanza cada personaje desde el piso:

| Personaje | Salto maximo | `y` mas alto alcanzable desde `y: 560` | Largo del salto |
| --- | --- | --- | --- |
| Juan | 156px | `404` | 184px |
| Ame | 114px | `446` | 200px |

Para que suban los dos, usa `y: 464` (96px de alto) o mas abajo.

## 9. Objetos (de fondo, para saltar encima o solidos)

Un objeto es una imagen suelta que se coloca en cualquier parte del piso.

### Imagen

```text
assets/props/<nombre>.png
```

PNG con fondo transparente, del tamano que quieras. Si el archivo no existe, el juego
dibuja una caja de color con el nombre.

Nombre: `<objeto>_<tema>_<NN>.png`, en minusculas, sin tildes ni espacios. Ejemplos:
`caja_sotano_01.png`, `caja_sotano_02.png`, `archivador_archivo_01.png`,
`estante_biblioteca_01.png`. El tema es el de los tiles del piso y el numero distingue
variantes (otro dibujo u otra altura).

### Los tres modos

| Modo | En el editor | Que hace |
| --- | --- | --- |
| `MODOS_OBJETO.FONDO` | Fondo (violeta, borde punteado) | Solo se ve. Se dibuja detras del piso y del jugador. |
| `MODOS_OBJETO.PLATAFORMA` | Encima (verde) | El jugador se para encima. De costado y desde abajo lo atraviesa. |
| `MODOS_OBJETO.SOLIDO` | Solido (rosa) | El jugador se para encima y ademas choca de costado y con la cabeza. |

La colision es el rectangulo de la imagen: el jugador pisa en el borde de arriba. Si el PNG
tiene aire transparente arriba o a los lados, recorta la imagen al ras del dibujo o ponle
margenes de colision en el catalogo (ver abajo).

### Catalogo de objetos

Cada tipo de objeto se define una vez en `CATALOGO_OBJETOS` (en `niveles.js`, arriba de
los pisos) y despues se coloca con `objeto(...)` en los pisos:

```js
const CATALOGO_OBJETOS = [
    tipoObjeto("caja_sotano_01", "Caja de carton", 96, 96, MODOS_OBJETO.SOLIDO, { margenes: { izquierda: 8, derecha: 8, arriba: 12 } }),
    tipoObjeto("caja_sotano_02", "Caja alta", 96, 160, MODOS_OBJETO.SOLIDO)
];
```

```js
tipoObjeto(archivo, nombre, ancho, alto, modo, { margenes: { izquierda, derecha, arriba } })
```

- `archivo`: nombre del PNG en `assets/props/`, sin `.png`. Es el mismo que se pone en
  `objeto(...)`.
- `ancho`, `alto`, `modo`: con que tamano y modo nace al colocarlo en el editor.
- `margenes`: px que se recortan de la caja de colision respecto de la imagen. La base no se
  recorta. Si el objeto se coloca mas grande o mas chico, se escalan en proporcion.

En el editor se maneja desde el panel **Catalogo de objetos**. Esta explicado en
`GUIA_ADMIN.md`, seccion 9.7. Un objeto que no esta en el catalogo funciona igual, pero sin
margenes.

### En el editor (`admin.html`)

1. Elige la herramienta **Objeto** (tecla `5`) y haz clic en el piso. Si el clic cae cerca
   del piso, el objeto queda apoyado.
2. En el panel **Objeto** escribe el nombre de la imagen (sin `.png`) y elige el modo. O
   mejor: elige un tipo en el panel **Catalogo de objetos** y haz clic en el piso, que nace
   con su tamano y modo.
3. Con **Seleccionar**, arrastra el objeto para moverlo. El cuadrado blanco de la esquina
   superior derecha cambia el tamano (con Shift mantiene la proporcion).
4. **Tamano original** usa el tamano real del PNG. **Apoyar en el piso** lo baja hasta la
   plataforma que tiene debajo.
5. Flechas para mover, `Supr` para eliminar, `Cmd+D` para duplicar, `Alt` para mover sin iman.

El panel "Problemas" avisa si falta la imagen y si un objeto solido es mas alto que el salto
de algun personaje y le corta el paso.

### A mano en `niveles.js`

```js
objetos: [
    objeto("planta_seca", 250, 480, 48, 80, MODOS_OBJETO.FONDO),
    objeto("cajas", 400, 496, 96, 64, MODOS_OBJETO.SOLIDO),
    objeto("escritorio", 700, 464, 160, 96, MODOS_OBJETO.PLATAFORMA)
],
```

Formato:

```js
objeto(nombre, x, y, ancho, alto, modo)
```

- `x`, `y`: esquina superior izquierda. Para apoyarlo en el piso normal: `y = 560 - alto`.
- `ancho`, `alto`: tamano con que se dibuja y colisiona (la imagen se estira a ese tamano).

Alturas utiles sobre el piso normal: hasta 114px de alto suben Juan y Ame; hasta 156px solo
Juan. Un solido mas alto que eso no se puede pasar.

Si el jugador muere, reaparece en la ultima plataforma que piso, no sobre un objeto.

### Diferencia con `propsPermitidos`

Los props de `propsPermitidos` (cajas, escritorio, archivador...) son la decoracion vieja:
dibujos hechos por codigo, en posiciones fijas, sin colision y que no se ven en el editor.
Siguen funcionando. Para decorar un piso nuevo conviene usar objetos en modo Fondo.

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

Para ver las dos cajas mientras juegas, aprieta `C` (o abre `index.html?colisiones`): el
cuadro blanco punteado es el sprite (`render`) y el amarillo, la colision. Los pies del
dibujo tienen que tocar la linea de abajo del cuadro amarillo.

Si el personaje parece flotar, aumenta `offsetY` de `render`.
Si parece hundido en el piso, baja `offsetY` de `render`.
Si se cae aunque visualmente aun toca el borde, aumenta `colision.ancho`.
