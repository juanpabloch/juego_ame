# Guia del editor de pisos (admin)

El editor es `admin.html`. Sirve para armar los pisos del juego sin escribir codigo: se
dibujan las plataformas, los huecos, las trampas y los objetos, y al guardar el editor
escribe el archivo `niveles.js`, que es el que lee el juego.

## Indice

1. [Como abrirlo y que archivos usa](#1-como-abrirlo-y-que-archivos-usa)
2. [La pantalla](#2-la-pantalla)
3. [Lista de pisos](#3-lista-de-pisos)
4. [Datos del piso](#4-datos-del-piso)
5. [El lienzo: moverse y hacer zoom](#5-el-lienzo-moverse-y-hacer-zoom)
6. [Herramientas para pintar el piso](#6-herramientas-para-pintar-el-piso)
7. [Seleccionar y editar una plataforma](#7-seleccionar-y-editar-una-plataforma)
8. [Huecos y saltos](#8-huecos-y-saltos)
9. [Objetos](#9-objetos)
10. [Panel de problemas](#10-panel-de-problemas)
11. [Probar el piso](#11-probar-el-piso)
12. [Guardar](#12-guardar)
13. [Deshacer, rehacer y borrador automatico](#13-deshacer-rehacer-y-borrador-automatico)
14. [Atajos de teclado](#14-atajos-de-teclado)
15. [Que escribe el editor en niveles.js](#15-que-escribe-el-editor-en-nivelesjs)
16. [Limites y cosas a tener en cuenta](#16-limites-y-cosas-a-tener-en-cuenta)

---

## 1. Como abrirlo y que archivos usa

Abre `admin.html` con doble clic, en **Chrome o Edge**. No hace falta servidor ni instalar
nada. En Firefox y Safari tambien funciona, pero guardar es menos comodo (ver
[capitulo 12](#12-guardar)).

| Archivo | Para que sirve | Quien lo escribe |
| --- | --- | --- |
| `admin.html`, `admin.js`, `admin.css` | El editor | Codigo |
| `niveles.js` | Los datos de todos los pisos | **El editor**, al guardar |
| `niveles_base.js` | Constantes y funciones (`piso()`, `objeto()`, `TRAMPAS`...) | Codigo |
| `personajes.js` | Velocidad, salto y tamano de cada personaje | Codigo |
| `index.html` | El juego. El editor lo abre para probar | Codigo |
| `assets/fondos/`, `assets/tiles/`, `assets/props/` | Imagenes | Tu |

Al abrirse, el editor lee `niveles.js` y muestra los pisos tal como estan guardados.

**Importante:** `niveles.js` se reescribe completo cada vez que guardas. Si agregas codigo
propio a mano en ese archivo (funciones, comentarios), se pierde. El codigo propio va en
`niveles_base.js`.

---

## 2. La pantalla

```text
+--------------------------------------------------------------------------+
| Editor de pisos · estado      [Deshacer][Rehacer] [Probar][Ver codigo][Guardar] |
+-----------+------------------------------------------+-------------------+
|           | Herramientas · Iman · Personaje · Zoom   | PISO              |
| PISOS     +------------------------------------------+ (datos del piso)  |
|           | Pista de la herramienta activa           +-------------------+
| 01 ...    +------------------------------------------+ PLATAFORMA        |
| 02 ...    | Regla (px)                               +-------------------+
| 03 ...    |                                          | OBJETO            |
|           |            LIENZO                        +-------------------+
|           |                                          | PROBLEMAS         |
|           +------------------------------------------+                   |
|           | Minimapa                                 |                   |
|           | Cursor x/y · tamano del mundo · ayuda    |                   |
+-----------+------------------------------------------+-------------------+
```

- **Barra superior:** estado de guardado y las acciones generales.
- **Columna izquierda:** la lista de pisos.
- **Centro:** las herramientas, el lienzo donde se dibuja y el minimapa.
- **Columna derecha:** cuatro paneles. *Piso* siempre visible; *Plataforma* y *Objeto*
  muestran sus campos solo cuando hay algo seleccionado; *Problemas* lista lo que hay que
  revisar.

El texto junto al titulo dice `Sin cambios` o `● Cambios sin guardar (N pisos)`, y cuantos
pisos tienen errores.

---

## 3. Lista de pisos

Cada fila muestra el color base, el ID, el nombre y, si corresponde:

- un **punto amarillo**: el piso tiene cambios sin guardar;
- un **numero rojo**: cantidad de errores;
- un **numero amarillo**: cantidad de avisos (solo si no hay errores).

Haz clic en una fila para editar ese piso.

| Boton | Que hace |
| --- | --- |
| `＋` | Crea un piso nuevo al final. Copia fondo, tema de tiles y props del piso activo, y arranca con una sola plataforma de 1280px. |
| `⧉` | Duplica el piso activo, con plataformas y objetos. Le pone un ID nuevo y agrega "(copia)" al nombre. |
| `↑` `↓` | Mueve el piso en la lista. El orden de la lista es el orden del selector del juego. |
| `✕` | Elimina el piso. Se puede deshacer. |

---

## 4. Datos del piso

Panel **Piso**, arriba a la derecha.

| Campo | Que es | Notas |
| --- | --- | --- |
| **ID** | Numero del piso | Entero mayor que cero y unico. Si se repite, el juego solo carga el primero. |
| **Nombre** | Texto del selector del juego | Por ejemplo `Piso 02: Archivo Central`. |
| **Fondo** | Ruta de la imagen de fondo | Por ejemplo `assets/fondos/fondo_02_archivo.png`. Al lado dice `✓ existe` o `✕ no existe`. Sugiere los fondos que ya usan otros pisos. |
| **Tipo de piso** | Linoleo, Parque, Concreto o Azulejo | Solo define el color de relleno cuando falta la imagen del tile. |
| **Color base** | Color del piso | Se ve detras del fondo y cuando falta la imagen de fondo. |
| **Tema de tiles** | Nombre del juego de tiles | Con `archivo`, el juego busca `assets/tiles/piso_archivo_01.png`, los bordes `borde_roto_izq_archivo.png` / `borde_roto_der_archivo.png` y `trampa_pivote_archivo.png`. |
| **Variantes** | Cuantos tiles `_01`, `_02`... tiene el tema | El editor cuenta los que encuentra. Si el numero no coincide, ofrece un boton **Usar N**. |
| **Trampas habilitadas** | `HUECO_ROTO`, `PIVOTE`, `RESBALADIZO` | Clic para activar o desactivar. Ver nota abajo. |
| **Props permitidos** | Decoracion vieja, fija | Dibujos hechos por codigo en posiciones fijas. No se ven en el editor. Para decorar conviene usar objetos ([capitulo 9](#9-objetos)). |

**Sobre las trampas habilitadas:** la unica que cambia el juego es `PIVOTE`. Si un piso
tiene plataformas pivote pero `PIVOTE` no esta activada, se comportan como piso normal.
`HUECO_ROTO` y `RESBALADIZO` son informativas. Al pintar una trampa con las herramientas,
el editor la activa solo.

Los cambios en los campos se aplican al salir del campo o al apretar Enter.

---

## 5. El lienzo: moverse y hacer zoom

El lienzo muestra el piso completo: fondo, plataformas, huecos, objetos y la posicion de
**INICIO**, que es donde aparece el jugador (sobre la primera plataforma).

Elementos de referencia:

- **Marco azul:** los limites del mundo (720px de alto).
- **Linea punteada horizontal:** la altura normal del piso, `y = 560`.
- **Lineas verticales tenues:** cada 128px, el ancho de un tile.
- **Regla superior:** posicion en pixeles. La marca azul sigue al cursor.
- **Pie:** posicion del cursor, cantidad de plataformas y objetos, y ancho del mundo en
  pixeles y en pantallas (una pantalla = 1280px).

| Para | Como |
| --- | --- |
| Desplazarse a los lados | Rueda del mouse, o arrastrar el fondo vacio con Seleccionar |
| Desplazarse con cualquier herramienta | `Espacio` + arrastrar, o arrastrar con el boton derecho o el del medio |
| Zoom | `Cmd`/`Ctrl` + rueda, o los botones `−` y `＋` (de 8% a 400%) |
| Ver el alto completo | **Ajustar** o tecla `F` |
| Ver el piso entero | **Ver todo** o tecla `A` |
| Saltar a otra zona | Clic o arrastrar en el **minimapa** |

En el minimapa, el recuadro azul es lo que se ve en el lienzo. Las plataformas aparecen con
el color de su tipo, los huecos con el color de su dificultad y los objetos con el color de
su modo.

Opciones de la barra de herramientas:

- **Iman:** tamano de la grilla a la que se pega lo que mueves (8, 16, 32, 64 o 128px).
  Mantener `Alt` mientras arrastras lo desactiva.
- **Personaje:** con que personaje se calculan los arcos de salto y se dibuja el INICIO.
- **Arcos de salto:** muestra u oculta la trayectoria del salto sobre cada hueco.
- **Fondo:** muestra u oculta la imagen de fondo, para ver mejor el piso.

---

## 6. Herramientas para pintar el piso

Las herramientas **pintan**: arrastras en horizontal y ese tramo pasa a ser del tipo
elegido. Lo que habia en ese tramo se recorta y se reemplaza.

| Herramienta | Tecla | Que hace |
| --- | --- | --- |
| **Seleccionar** | `V` | Elegir, mover y redimensionar ([capitulo 7](#7-seleccionar-y-editar-una-plataforma)) |
| **Piso** | `1` | Pinta piso normal. Rellena huecos y reemplaza trampas. |
| **Pivote** | `2` | Convierte el tramo en una trampa que gira y se cae al pisarla. |
| **Resbaladizo** | `3` | Convierte el tramo en piso resbaladizo. |
| **Hueco** | `4` o `H` | Abre un hueco del ancho arrastrado. |
| **Objeto** | `5` o `O` | Coloca un objeto con un clic ([capitulo 9](#9-objetos)). |

Como se comportan:

- **Altura:** el tramo se pinta a la altura de la plataforma que tengas bajo el cursor. Si
  no hay ninguna, a la altura normal (`y = 560`).
- **Un clic sin arrastrar:** Piso, Pivote y Resbaladizo crean un tramo de 384px. Hueco abre
  uno de 128px centrado en el clic.
- **Union automatica:** dos tramos pegados, del mismo tipo y a la misma altura, se unen en
  una sola plataforma. Los pivotes no se unen: cada uno gira por separado.
- **Iman:** los extremos se pegan a los bordes de otras plataformas cercanas y, si no hay
  ninguno, a la grilla.
- **Trampas:** pintar Pivote, Resbaladizo o Hueco activa la trampa correspondiente en el
  piso.

Si el tramo ya era de ese tipo, o intentas abrir un hueco donde no hay piso, el editor avisa
y no cambia nada.

En el lienzo, los pivotes se ven con un tinte naranja y una barra en el centro (el eje de
giro), y el resbaladizo con un tinte celeste.

---

## 7. Seleccionar y editar una plataforma

Con **Seleccionar**, haz clic en una plataforma. Queda con borde azul y dos asas blancas.

| Para | Como |
| --- | --- |
| Moverla a los lados | Arrastrarla |
| Cambiarle el ancho | Arrastrar un asa blanca (minimo 64px) |
| Moverla con el teclado | `←` `→` un paso de iman; con `Shift`, cuatro pasos |
| Subirla o bajarla | `↑` `↓`, de a 16px, o el campo **Y** |
| Duplicarla | Boton **Duplicar** o `Cmd+D`. La copia aparece al final del piso. |
| Eliminarla | Boton **Eliminar**, `Supr` o `Backspace` |
| Quitar la seleccion | `Esc` o clic en el fondo |

El panel **Plataforma** muestra:

- **Tipo:** Normal, Pivote o Resbaladizo. Cambia el tipo sin repintar.
- **X:** donde empieza.
- **Ancho.**
- **Y:** altura. `560` es el piso normal; un numero menor queda mas arriba. Sirve para
  hacer plataformas elevadas.
- **Hueco despues (px):** el espacio hasta la plataforma siguiente. Cambiarlo **mueve todas
  las plataformas que siguen**, sin tocar sus anchos.

Las plataformas se ordenan siempre de izquierda a derecha, y ese orden es su numero (la
etiqueta bajo cada una dice `numero · tipo · ancho`).

---

## 8. Huecos y saltos

En el editor **un hueco no es un dato aparte**: es el espacio vacio entre una plataforma y
la siguiente. Se crea de tres formas: pintando con Hueco, separando dos plataformas, o
escribiendo el campo "Hueco despues".

El editor calcula cuanto salta cada personaje (con su velocidad y fuerza de salto de
`personajes.js`, y el desnivel entre las dos plataformas) y pinta cada hueco segun el
resultado:

| Color | Significado |
| --- | --- |
| Verde | Todos los personajes llegan con margen. |
| Amarillo | Queda muy justo (a menos del 10% del limite), o solo llega alguno de los personajes. |
| Rojo | Nadie llega. Es un error. |

Sobre cada hueco se ve su ancho y, si **Arcos de salto** esta activo, la trayectoria del
personaje elegido: verde si llega, roja si no.

Al seleccionar una plataforma, debajo del campo "Hueco despues" aparece el alcance exacto
de cada personaje para ese hueco.

---

## 9. Objetos

Un objeto es una imagen suelta que se coloca en cualquier parte del piso. Puede ser
decoracion o tener colision.

### 9.1 La imagen

```text
assets/props/<nombre>.png
```

PNG con fondo transparente, del tamano que quieras. El nombre es libre: minusculas, sin
tildes ni espacios. Si el archivo no existe, el editor y el juego dibujan una caja de color
con el nombre, asi se puede armar el piso antes de tener el arte.

### 9.2 Los tres modos

| Modo | Color en el editor | Que hace en el juego |
| --- | --- | --- |
| **Fondo** | Violeta, borde punteado | Solo se ve. Se dibuja detras del piso y del jugador. |
| **Encima** | Verde | El jugador se para encima. De costado y desde abajo lo atraviesa. |
| **Solido** | Rosa | El jugador se para encima y ademas choca de costado y con la cabeza. |

Los objetos con colision tienen una franja gruesa en el borde de arriba: ahi pisa el
jugador.

La colision es **el rectangulo completo de la imagen**. Si el PNG tiene aire transparente
arriba o a los lados, el jugador va a parecer que flota o que choca con nada. Recorta la
imagen al ras del dibujo.

### 9.3 Colocar un objeto

1. Elige **Objeto** (tecla `5`).
2. Haz clic en el lienzo. Si el clic cae cerca del piso, el objeto queda apoyado; si cae
   mas arriba, queda flotando donde hiciste clic.
3. El editor vuelve solo a Seleccionar, con el objeto nuevo elegido.

El objeto nuevo usa la ultima imagen y el ultimo modo que elegiste, para colocar varios
iguales seguidos. Si la imagen existe, nace con su tamano real; si no, de 96x96.

### 9.4 Editar un objeto

Con **Seleccionar**, haz clic en el objeto.

| Para | Como |
| --- | --- |
| Moverlo | Arrastrarlo, en cualquier direccion |
| Cambiarle el tamano | Arrastrar el cuadrado blanco de la esquina superior derecha. La esquina inferior izquierda queda fija, asi no se despega del piso. |
| Mantener la proporcion | `Shift` mientras cambias el tamano |
| Moverlo con el teclado | `←` `→` un paso de iman; `↑` `↓` de a 16px |
| Duplicarlo | **Duplicar** o `Cmd+D`. La copia aparece al lado. |
| Eliminarlo | **Eliminar**, `Supr` o `Backspace` |

Al moverlo, la base del objeto se pega sola al piso o a otro objeto con colision que tenga
debajo. `Alt` desactiva el iman.

El panel **Objeto** muestra:

- **Imagen:** el nombre del archivo, sin `.png`. Acepta tambien la ruta completa y la
  limpia. Debajo aparece la ruta real y, si la imagen existe, su tamano.
- **Modo:** Fondo, Encima o Solido.
- **X, Y:** la esquina superior izquierda.
- **Ancho, Alto:** tamano con que se dibuja y colisiona. La imagen se estira a ese tamano.
- **Tamano original:** vuelve al tamano real del PNG.
- **Apoyar en el piso:** baja el objeto hasta la plataforma que tiene debajo.

### 9.5 Que se selecciona al hacer clic

Cuando hay cosas superpuestas, el clic elige en este orden: primero los objetos con
colision, despues las plataformas y por ultimo los objetos de fondo. Asi un objeto de fondo
grande no impide seleccionar el piso que tiene delante.

### 9.6 Alturas utiles

Medidas desde el piso hasta la parte de arriba del objeto:

| Altura | Quien sube |
| --- | --- |
| Hasta 114px | Juan y Ame |
| Hasta 156px | Solo Juan |
| Mas de 156px | Nadie de un salto |

Un objeto **solido** mas alto que el salto de un personaje le corta el paso. El editor lo
marca como aviso.

---

## 10. Panel de problemas

Lista lo que el editor encuentra en el piso activo. Se actualiza con cada cambio.

| Nivel | Color | Significado |
| --- | --- | --- |
| **Error** | Rojo | El piso no funciona bien asi. |
| **Aviso** | Amarillo | Funciona, pero probablemente no es lo que querias. |
| **Info** | Gris | Dato para tener en cuenta. |

Cada problema puede traer dos botones:

- **Ver plataforma N** / **Ver objeto N:** lleva la vista a ese elemento y lo selecciona.
- **Un arreglo de un clic**, cuando el editor sabe como resolverlo.

Que revisa:

| Problema | Nivel | Arreglo de un clic |
| --- | --- | --- |
| ID invalido o repetido | Error | Usar el siguiente ID libre |
| Piso sin nombre | Error | – |
| Piso sin plataformas | Error | – |
| Dos plataformas superpuestas | Error | **Separar** |
| Hueco que nadie puede saltar | Error | **Reducir a N px** |
| Hueco que solo salta un personaje | Aviso | **Reducir a N px** |
| Hueco muy justo | Aviso | – |
| El jugador aparece sobre un pivote | Aviso | – |
| Plataforma mas angosta que un tile (128px) | Aviso | – |
| Plataforma fuera de la pantalla (Y menor que 190 o mayor que 656) | Aviso | – |
| Hay pivotes pero `PIVOTE` no esta habilitada | Aviso | **Habilitar** |
| Piso sin fondo, o falta una imagen de fondo, tile o borde | Aviso | – |
| Objeto sin imagen asignada | Aviso | – |
| Objeto solido que corta el paso | Aviso | – |
| Falta `trampa_pivote_<tema>.png` | Info | – |
| Falta la imagen de un objeto | Info | – |
| Objeto al que algun personaje no llega de un salto | Info | – |
| Hay resbaladizo o huecos sin su trampa en la lista | Info | **Habilitar** |
| El piso mide menos que una pantalla | Info | – |
| `niveles.js` declaraba un hueco distinto al espacio real | Info | – |

El ultimo aparece solo al abrir el editor, en pisos escritos a mano, y desaparece al editar
o guardar el piso.

Los errores **no impiden guardar**: el editor guarda igual y avisa cuantos pisos tienen
errores.

---

## 11. Probar el piso

El boton **▶ Probar** abre el juego dentro del editor, en el piso activo y **con los
cambios actuales, aunque no esten guardados**.

- Flechas para correr, `Espacio` para saltar.
- `Esc` o `✕` vuelve al editor.
- **Reiniciar** vuelve a cargar el piso desde el comienzo.

Probar no guarda nada y no modifica `niveles.js`.

---

## 12. Guardar

**Guardar niveles.js** (o `Cmd+S` / `Ctrl+S`) escribe el archivo completo con todos los
pisos.

**En Chrome y Edge:**

1. La primera vez se abre una ventana para elegir el archivo. Elige el `niveles.js` de la
   carpeta del juego y acepta reemplazarlo.
2. Desde ahi, cada guardado escribe directo en ese archivo, sin preguntar, hasta que
   cierres o recargues la pagina.

Si eliges otro nombre, el editor guarda ahi y te recuerda que el juego solo lee
`niveles.js`.

**En Firefox y Safari:** el editor descarga un `niveles.js`. Hay que moverlo a mano a la
carpeta del juego, reemplazando el anterior.

**Ver codigo** muestra el archivo que se va a guardar, con botones para copiarlo o
descargarlo. Sirve para revisar antes de guardar.

Despues de guardar, recarga `index.html` para ver los cambios en el juego.

---

## 13. Deshacer, rehacer y borrador automatico

**Deshacer y rehacer:** botones `↶` `↷`, o `Cmd+Z` y `Shift+Cmd+Z` (tambien `Cmd+Y`).
Guarda hasta 100 pasos y cubre todo: plataformas, objetos, datos del piso, y crear, mover o
eliminar pisos. El historial se pierde al recargar la pagina.

**Borrador automatico:** mientras haya cambios sin guardar, el editor guarda una copia en
el navegador. Si cierras o recargas sin guardar, al volver aparece una franja:

> Hay cambios del (fecha) que no estan en niveles.js. **[Restaurar] [Descartar]**

- **Restaurar** recupera esos cambios. Todavia falta guardarlos en `niveles.js`.
- **Descartar** los borra y sigue con lo que esta en el archivo.

El borrador vive en ese navegador y en esa computadora: no viaja con la carpeta del juego.

---

## 14. Atajos de teclado

Los atajos no funcionan mientras el cursor esta dentro de un campo de texto (salvo guardar).

| Tecla | Accion |
| --- | --- |
| `V` | Herramienta Seleccionar |
| `1` `2` `3` | Piso, Pivote, Resbaladizo |
| `4` o `H` | Hueco |
| `5` o `O` | Objeto |
| `←` `→` | Mover lo seleccionado un paso de iman (`Shift`: cuatro pasos) |
| `↑` `↓` | Subir o bajar lo seleccionado 16px |
| `Supr` / `Backspace` | Eliminar lo seleccionado |
| `Cmd+D` | Duplicar lo seleccionado |
| `Esc` | Quitar la seleccion, o cerrar la ventana abierta |
| `Cmd+Z` | Deshacer |
| `Shift+Cmd+Z` o `Cmd+Y` | Rehacer |
| `Cmd+S` | Guardar |
| `F` | Ajustar al alto |
| `A` | Ver todo el piso |
| `Espacio` + arrastrar | Mover la vista |
| `Cmd` + rueda | Zoom |
| `Alt` al arrastrar | Sin iman |
| `Shift` al redimensionar un objeto | Mantener la proporcion |

En Windows, `Ctrl` reemplaza a `Cmd`.

---

## 15. Que escribe el editor en niveles.js

Un piso guardado se ve asi:

```js
{
    id: 2,
    nombre: "Piso 02: Archivo Central",
    fondoRuta: "assets/fondos/fondo_02_archivo.png",
    colorPlaceholder: "#30342d",
    tipoPiso: TIPOS_PISO.LINOLEO,
    tilesTema: "archivo",
    tilesVariantes: 3,
    trampasHabilitadas: [TRAMPAS.HUECO_ROTO],
    propsPermitidos: [PROPS.ARCHIVADOR, PROPS.ESTANTES, PROPS.CAJAS],
    objetos: [
        objeto("cajas", 400, 496, 96, 64, MODOS_OBJETO.SOLIDO)
    ],
    plataformas: [
        piso(0, 1090),
        pisoConHueco(1090, 446, 192),
        pivoteConHueco(1728, 384, 192),
        piso(2304, 896, { y: 464 })
    ]
}
```

Como traduce cada cosa:

| En el editor | En `niveles.js` |
| --- | --- |
| Plataforma normal | `piso(x, ancho)` |
| Plataforma normal seguida de un hueco | `pisoConHueco(x, ancho, anchoHueco)` |
| Pivote | `pivote(...)` / `pivoteConHueco(...)` |
| Resbaladizo | `pisoResbaladizo(...)` / `pisoResbaladizoConHueco(...)` |
| Plataforma a otra altura | Se agrega `{ y: N }` al final |
| Objeto | `objeto(nombre, x, y, ancho, alto, modo)` |

- La lista `objetos` solo se escribe si el piso tiene objetos.
- El hueco se calcula solo, como el espacio hasta la plataforma siguiente.
- Si un piso tiene propiedades extra que el editor no conoce, las conserva al guardar.
- Los comentarios y el formato escritos a mano no se conservan.

Tambien se puede editar `niveles.js` a mano y despues abrir el editor: lo lee igual. El
detalle de cada funcion esta en `GUIA_PISOS_TRAMPAS.md`.

---

## 16. Limites y cosas a tener en cuenta

- **No sube ni copia imagenes.** El editor solo guarda nombres y rutas. Los PNG se copian a
  mano a `assets/fondos/`, `assets/tiles/` y `assets/props/`.
- **No lista las carpetas.** Los campos de fondo, tema e imagen sugieren lo que ya usan
  otros pisos, no lo que hay en el disco. Si el nombre esta bien escrito, el editor lo
  confirma con `✓ existe`.
- **Los props viejos no se ven.** Los de "Props permitidos" se dibujan en el juego pero no
  en el editor.
- **El resbaladizo es solo visual por ahora.** El juego lo dibuja con un brillo celeste
  pero no cambia el movimiento del jugador.
- **El inicio no se elige.** El jugador aparece siempre sobre la primera plataforma (la de
  mas a la izquierda).
- **El ancho del mundo lo dan las plataformas.** Un objeto mas alla de la ultima plataforma
  queda fuera del alcance del jugador.
- **Al morir, el jugador reaparece** en la ultima plataforma normal que piso, nunca sobre
  un pivote ni sobre un objeto.
- **Dos pestanas del editor a la vez** se pisan entre si al guardar. Usa una sola.
