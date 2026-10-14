# juego_ame

Prototipo de plataforma lateral 2D con pisos modulares, plataformas, huecos y trampas.

## Editor De Pisos

Abre `admin.html` en Chrome o Edge. Carga los pisos de `niveles.js` y permite editarlos
sin tocar codigo:

- Las herramientas pintan sobre el piso: elige Piso, Pivote, Resbaladizo o Hueco y arrastra
  en horizontal. El tramo que marques pasa a ser de ese tipo (o queda vacio, si es Hueco).
  Pintar Piso sobre un hueco lo rellena.
- Con Seleccionar, un clic elige una plataforma: arrastrala para moverla y arrastra sus
  bordes para cambiarle el ancho.
- Con Objeto, un clic coloca un objeto (una imagen de `assets/props/`). En el panel "Objeto"
  se elige la imagen y si es de fondo, para saltar encima o solido. Con Seleccionar se mueve
  arrastrando y se le cambia el tamano desde la esquina superior derecha.
- Un hueco es el espacio que queda entre dos plataformas. El editor lo mide y marca en rojo
  los que ningun personaje puede saltar.
- El panel "Problemas" lista errores y avisos del piso (huecos imposibles, plataformas
  superpuestas, imagenes que no existen) y ofrece arreglos de un clic.
- "Probar" abre el juego con el piso tal como esta, aunque no este guardado.
- "Guardar niveles.js" escribe el archivo. La primera vez pregunta donde: elige el
  `niveles.js` de esta carpeta. En navegadores sin esa funcion (Firefox, Safari) descarga
  el archivo y hay que reemplazarlo a mano.

`niveles.js` contiene solo los datos y el editor lo reescribe completo al guardar. Las
constantes y funciones (`TIPOS_PISO`, `TRAMPAS`, `piso()`, `pisoConHueco()`, ...) estan en
`niveles_base.js`: el codigo propio va ahi, no en `niveles.js`.

## Idea Principal

El juego separa tres tipos de imagenes:

- Fondos de pared o habitacion: van en `assets/fondos/` y se cargan desde `fondoRuta`.
- Tiles de suelo y trampas: van en `assets/tiles/` y se usan para dibujar plataformas.
- Props decorativos: van en `assets/props/` y se dibujan sobre o detras del suelo.

Si una imagen no existe todavia, `AssetManager` dibuja un fallback procedural. Esto permite
seguir programando aunque el arte final aun no este exportado.

## Arbol Recomendado

```text
juego_ame/
├── index.html
├── admin.html        (editor de pisos, con admin.js y admin.css)
├── personajes.js
├── controles.js
├── motor.js
├── niveles_base.js   (constantes y funciones para describir pisos)
├── niveles.js        (datos de los pisos; lo escribe el editor)
├── escenario.js
├── assets/
│   ├── sprites/
│   ├── fondos/
│   ├── tiles/
│   └── props/
```

## Fondos vs Pisos

No confundas estas dos cosas:

```text
assets/fondos/fondo_02_archivo.png
```

Ese archivo debe ser el fondo de pared/habitacion. Es lo que se ve atras del jugador.

```text
assets/fondos/piso_02_archivo.png
```

Ese archivo, por como esta armado ahora, es una plancha/atlas de piezas de piso. No deberia
usarse como `fondoRuta`, porque contiene plataformas recortables, no una pared seamless.

En otras palabras:

- `fondo_XX_*.png` = fondo visual del piso.
- `piso_XX_*.png` = hoja fuente para extraer tiles/plataformas.

## Como Cargar Un Fondo

1. Exporta o copia el fondo a:

```text
assets/fondos/fondo_02_archivo.png
```

2. Abre `niveles.js`.

3. Busca el piso correspondiente:

```js
{
    id: 2,
    nombre: "Piso 02: Archivo Central",
    fondoRuta: "assets/fondos/fondo_02_archivo.png",
    colorPlaceholder: "#30342d",
    tipoPiso: TIPOS_PISO.LINOLEO,
    ...
}
```

4. Asegurate de que `fondoRuta` coincida exactamente con el nombre del archivo.

5. Recarga `index.html`.

Si el archivo existe, el fondo aparece. Si no existe, se muestra un placeholder con
`colorPlaceholder`.

## Como Debe Ser Un Fondo

Recomendado:

- PNG horizontal.
- Idealmente seamless/repetible en X.
- Sin jugador, sin piso jugable y sin plataformas.
- Puede incluir paredes, puertas, ventanas, luces, grietas, muebles lejanos.
- Tamano recomendado: `1376x768`, `1600x900` o similar.

El motor lo repite horizontalmente con parallax:

```js
dibujarFondoParallax(camaraX)
```

Por eso conviene que el borde izquierdo y derecho del fondo conecten bien.

## Como Usar Tus Planchas De Piso

Tus imagenes como:

```text
assets/fondos/piso_02_archivo.png
assets/fondos/piso_14_biblioteca.png
```

son atlas/planchas. Sirven como materia prima, pero no como tile directo.

Debes abrirlas en Photopea, Photoshop, Aseprite, GIMP u otro editor y separar piezas:

- Un tile de suelo normal.
- Un borde roto izquierdo.
- Un borde roto derecho.
- Una trampilla pivote, si aplica.
- Props sueltos, si quieres reutilizarlos como decoracion.

Luego exportas esas piezas con fondo transparente.

## Como Borrar El Fondo Oscuro Del Atlas

Metodo recomendado en Photopea/GIMP:

1. Abre `piso_02_archivo.png`.
2. Duplica la capa original.
3. Usa seleccion por color sobre el fondo oscuro.
4. Usa una tolerancia baja/media. Empieza con `10` o `15`.
5. Borra el fondo seleccionado o conviertelo en mascara.
6. Revisa los bordes a mano, porque el pixel art puede tener sombras oscuras que no debes borrar.
7. Exporta como PNG con transparencia.

Consejo importante: no uses una tolerancia demasiado alta. Si borras los negros internos,
vas a perder contornos, grietas y sombras del arte.

## Archivos De Tiles Que Espera El Motor

El motor usa `tilesTema` de cada piso en `niveles.js`. Con ese tema arma
automaticamente estos nombres:

```text
assets/tiles/piso_<tema>.png
assets/tiles/borde_roto_izq_<tema>.png
assets/tiles/borde_roto_der_<tema>.png
assets/tiles/trampa_pivote_<tema>.png
```

Ejemplo para pasillo:

```text
assets/tiles/piso_pasillo.png
assets/tiles/borde_roto_izq_pasillo.png
assets/tiles/borde_roto_der_pasillo.png
assets/tiles/trampa_pivote_pasillo.png
```

Y en `niveles.js`:

```js
tilesTema: "pasillo",
```

Si tienes mas de una variante recta para evitar monotonia, agrega `tilesVariantes`:

```js
tilesTema: "sotano",
tilesVariantes: 2,
```

El motor buscara:

```text
assets/tiles/piso_sotano_01.png
assets/tiles/piso_sotano_02.png
```

Las variantes se alternan automaticamente al dibujar plataformas largas.

Si alguno falta, el juego dibuja un fallback procedural.

## Formato Recomendado Para Tiles

Para que el render se vea bien, usa este estandar:

- `piso_<tema>.png`: `128x64`.
- `piso_<tema>_01.png`, `piso_<tema>_02.png`: `128x64`.
- `borde_roto_izq_<tema>.png`: `128x64`, fondo transparente.
- `borde_roto_der_<tema>.png`: `128x64`, fondo transparente.
- `trampa_pivote_<tema>.png`: `128x64`, fondo transparente.

El suelo se repite horizontalmente sobre cada plataforma. Por eso el tile debe poder
repetirse bien en X.

La colision del jugador ocurre en el borde superior del tile. Es decir: en un PNG
de `128x64`, la parte caminable debe estar alineada con la fila superior de la imagen.

## Como Extraer Un Tile Desde Tu Atlas

Ejemplo con `piso_02_archivo.png`:

1. Elige una zona limpia del piso verde, sin papeles ni roturas grandes.
2. Recorta un bloque de `128x64`.
3. Ajusta el borde izquierdo y derecho para que conecten al repetirse.
4. Borra el fondo oscuro si quedo incluido.
5. Exporta como:

```text
assets/tiles/piso_archivo.png
```

Para `piso_14_biblioteca.png`, puedes extraer un tile rojo y exportarlo como:

```text
assets/tiles/piso_biblioteca.png
```

Despues aseguras que el piso correspondiente tenga `tilesTema: "archivo"` o
`tilesTema: "biblioteca"`.

## Como Crear Bordes Rotos

Desde el atlas:

1. Busca un extremo roto de plataforma.
2. Recorta el borde izquierdo y exporta:

```text
assets/tiles/borde_roto_izq_archivo.png
```

3. Recorta el borde derecho y exporta:

```text
assets/tiles/borde_roto_der_archivo.png
```

Si solo tienes un lado, puedes duplicarlo y espejarlo horizontalmente para crear el otro.

## Como Crear Una Trampilla Pivote

La trampilla debe ser una pieza horizontal con transparencia:

```text
assets/tiles/trampa_pivote_archivo.png
```

Recomendado:

- Ancho: `64px`.
- Alto: `32px` o `64px`.
- El pivote visual debe estar cerca del centro.
- No incluyas fondo.

El motor la rota de `0` a `90` grados. La colision se apaga cuando llega a `45` grados.

## Como Agregar Un Piso Nuevo

1. Pon el fondo en `assets/fondos/`:

```text
assets/fondos/fondo_21_laboratorio.png
```

2. Agrega la configuracion en `niveles.js`:

```js
{
    id: 21,
    nombre: "Piso 21: Laboratorio",
    fondoRuta: "assets/fondos/fondo_21_laboratorio.png",
    colorPlaceholder: "#263840",
    tipoPiso: TIPOS_PISO.CONCRETO,
    tilesTema: "laboratorio",
    trampasHabilitadas: [TRAMPAS.HUECO_ROTO, TRAMPAS.PIVOTE],
    propsPermitidos: [PROPS.CAJAS, PROPS.TUBERIAS],
    plataformas: crearPlataformasBase(21)
}
```

3. Si quieres plataformas personalizadas, reemplaza `crearPlataformasBase(21)` por:

```js
plataformas: [
    crearPlataforma(0, 520, TIPOS_PLATAFORMA.NORMAL, {
        tieneHuecoDespues: true,
        anchoHueco: 128
    }),
    crearPlataforma(648, 330, TIPOS_PLATAFORMA.PIVOTE, {
        tieneHuecoDespues: true,
        anchoHueco: 112
    }),
    crearPlataforma(1090, 520, TIPOS_PLATAFORMA.RESBALADIZO)
]
```

4. Agrega el piso al selector si el codigo ya no lo genera automaticamente. Actualmente
el selector se llena leyendo `PISOS_CONFIG`, asi que basta con agregar el objeto.

## Como Agregar Props

Los props finales deberian ir en:

```text
assets/props/
```

Ejemplos:

```text
assets/props/radiador.png
assets/props/extintor.png
assets/props/planta_seca.png
```

Por ahora el juego dibuja props procedurales. Cuando quieras usar PNGs reales, el siguiente
paso es hacer que `dibujarPropProcedural()` intente cargar `assets/props/<tipo>.png` y use
fallback si falta.

## Checklist Antes De Probar

- El fondo esta en `assets/fondos/`.
- `fondoRuta` apunta a ese archivo exacto.
- Los tiles estan en `assets/tiles/`.
- Los tiles tienen transparencia si vienen de una plancha.
- Los bordes rotos no tienen fondo oscuro.
- La trampilla no tiene fondo.
- Ejecuta una revision rapida de sintaxis:

```bash
node --check juego_ame/niveles_base.js
node --check juego_ame/niveles.js
node --check juego_ame/escenario.js
node --check juego_ame/motor.js
```

## Problemas Comunes

Si veo cuadros de colores:

- La imagen no existe.
- La ruta esta mal escrita.
- El nombre tiene mayusculas, tildes o espacios diferentes.
- El archivo esta en `assets/fondos/` pero el codigo lo busca en `assets/tiles/`, o al reves.

Si el atlas se ve como fondo:

- Ese archivo esta puesto en `fondoRuta`, pero deberia ser una plancha fuente.
- Cambia `fondoRuta` a un archivo `fondo_XX_*.png`.

Si el piso se ve repetido raro:

- Estas usando una plancha completa como tile.
- Recorta un tile chico y seamless.

Si desaparecen contornos al borrar fondo:

- La tolerancia de seleccion era demasiado alta.
- Usa mascara y limpia a mano los bordes oscuros importantes.
