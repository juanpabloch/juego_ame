// ============================================================================
// ESCENARIO.JS — Gestión de Assets y Renderizado Visual del Mundo y HUD
// ============================================================================
// Centraliza la carga segura de imágenes (con placeholders automáticos si aún
// no existe un archivo PNG) y el dibujo del escenario, plataformas, trampas,
// botones/interruptores, coleccionables, partículas, HUD y cajas de colisión.
// ============================================================================

const TILE_SIZE = 64;
const TILE_PISO_ANCHO = 128;
const TILE_PISO_ALTO = 64;
const PISO_INICIAL_ID = 1;

let pisoActivoConfig = obtenerPisoConfig(PISO_INICIAL_ID);

const nivel = {
    pisoY: ALTURA_PLATAFORMA_DEFAULT,
    tileSize: TILE_SIZE,
    respawnX: 100,
    respawnY: 184,
    anchoMundo: calcularAnchoMundo(pisoActivoConfig)
};

const COLORES_PISO_POR_TIPO = {
    linoleo: "#9ca58e",
    parque: "#7b533c",
    concreto: "#838982",
    azulejo: "#8fb5b3"
};

// ============================================================================
// 1. GESTOR DE IMÁGENES Y PLACEHOLDERS (ASSET MANAGER)
// ============================================================================

const AssetManager = {
    cache: new Map(),
    cargando: new Map(),

    obtenerImagen(ruta, opciones = {}) {
        if (this.cache.has(ruta)) {
            return this.cache.get(ruta);
        }

        const placeholder = crearPlaceholderAsset({
            color: opciones.color || "#394044",
            tipo: opciones.tipo || "generico",
            etiqueta: opciones.etiqueta || ""
        });

        this.cache.set(ruta, placeholder);
        this.cargarImagenSegura(ruta, opciones);
        return placeholder;
    },

    cargarImagenSegura(ruta, opciones = {}) {
        if (this.cargando.has(ruta)) {
            return this.cargando.get(ruta);
        }

        const promesa = new Promise((resolve) => {
            const imagen = new Image();
            imagen.onload = () => {
                imagen.esFallback = false;
                this.cache.set(ruta, imagen);
                this.cargando.delete(ruta);
                resolve(imagen);
            };
            imagen.onerror = () => {
                const fallback = this.cache.get(ruta) || crearPlaceholderAsset({
                    color: opciones.color || "#394044",
                    tipo: opciones.tipo || "generico",
                    etiqueta: opciones.etiqueta || ""
                });
                this.cache.set(ruta, fallback);
                this.cargando.delete(ruta);
                resolve(fallback);
            };
            imagen.src = ruta;
        });

        this.cargando.set(ruta, promesa);
        return promesa;
    }
};

function calcularAnchoMundo(configPiso) {
    return (configPiso.plataformas || []).reduce((maximo, plataforma) => {
        const finPlataforma = plataforma.x + plataforma.ancho;
        const finHueco = plataforma.tieneHuecoDespues
            ? finPlataforma + plataforma.anchoHueco
            : finPlataforma;
        return Math.max(maximo, finHueco);
    }, 800);
}

function hexARgb(hex) {
    const limpio = (hex || "#394044").replace("#", "");
    const numero = parseInt(limpio, 16) || 0;
    return {
        r: (numero >> 16) & 255,
        g: (numero >> 8) & 255,
        b: numero & 255
    };
}

function ajustarColorHex(hex, cantidad) {
    const rgb = hexARgb(hex);
    const limitar = (v) => Math.max(0, Math.min(255, v + cantidad));
    return `rgb(${limitar(rgb.r)}, ${limitar(rgb.g)}, ${limitar(rgb.b)})`;
}

function obtenerColorPiso() {
    return COLORES_PISO_POR_TIPO[pisoActivoConfig.tipoPiso] || pisoActivoConfig.colorPlaceholder;
}

function obtenerRutasPisoActivo() {
    const totalVariantes = pisoActivoConfig.tilesVariantes;
    if (!totalVariantes) {
        return [obtenerRutaPisoTema(pisoActivoConfig.tilesTema)];
    }

    const rutas = [];
    for (let variante = 1; variante <= totalVariantes; variante++) {
        rutas.push(obtenerRutaPisoTema(pisoActivoConfig.tilesTema, variante));
    }
    return rutas;
}

function obtenerRutaPisoParaBloque(indiceBloque) {
    const rutas = obtenerRutasPisoActivo();
    return rutas[indiceBloque % rutas.length];
}

function crearPlaceholderAsset({ color, tipo, etiqueta }) {
    const canvasPlaceholder = document.createElement("canvas");
    canvasPlaceholder.width = 64;
    canvasPlaceholder.height = 64;
    canvasPlaceholder.esFallback = true;

    const pctx = canvasPlaceholder.getContext("2d");
    pctx.fillStyle = color;
    pctx.fillRect(0, 0, 64, 64);

    if (tipo === "fondo") {
        pctx.fillStyle = ajustarColorHex(color, 22);
        pctx.fillRect(0, 0, 32, 32);
        pctx.fillRect(32, 32, 32, 32);
        pctx.strokeStyle = "rgba(255, 255, 255, 0.13)";
        pctx.strokeRect(0.5, 0.5, 63, 63);
    } else if (tipo === "tile") {
        pctx.fillStyle = ajustarColorHex(color, 32);
        pctx.fillRect(0, 0, 64, 8);
        pctx.fillStyle = ajustarColorHex(color, -24);
        pctx.fillRect(0, 48, 64, 16);
        pctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
        pctx.strokeRect(0.5, 0.5, 63, 63);
    } else if (tipo === "borde") {
        pctx.fillStyle = ajustarColorHex(color, 18);
        pctx.beginPath();
        pctx.moveTo(0, 0);
        pctx.lineTo(64, 0);
        pctx.lineTo(48, 15);
        pctx.lineTo(60, 28);
        pctx.lineTo(40, 42);
        pctx.lineTo(64, 64);
        pctx.lineTo(0, 64);
        pctx.closePath();
        pctx.fill();
    } else if (tipo === "trampa") {
        pctx.fillStyle = "#747c72";
        pctx.fillRect(0, 22, 64, 18);
        pctx.fillStyle = "#353c3e";
        pctx.fillRect(28, 22, 8, 18);
    } else if (tipo === "prop") {
        pctx.fillStyle = ajustarColorHex(color, 30);
        pctx.fillRect(14, 12, 36, 44);
        pctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
        pctx.strokeRect(14.5, 12.5, 35, 43);
    }

    if (etiqueta) {
        pctx.fillStyle = "rgba(255, 255, 255, 0.72)";
        pctx.font = "8px monospace";
        pctx.fillText(etiqueta.slice(0, 8), 5, 58);
    }

    return canvasPlaceholder;
}

function obtenerFondoActivo() {
    return AssetManager.obtenerImagen(pisoActivoConfig.fondoRuta, {
        color: pisoActivoConfig.colorPlaceholder,
        tipo: "fondo",
        etiqueta: `P${pisoActivoConfig.id}`
    });
}

function cambiarPisoActivo(idPiso) {
    pisoActivoConfig = obtenerPisoConfig(idPiso);
    nivel.pisoY = pisoActivoConfig.plataformas[0]?.y || ALTURA_PLATAFORMA_DEFAULT;
    nivel.anchoMundo = calcularAnchoMundo(pisoActivoConfig);
    inicializarEstadosPlataformas();

    AssetManager.cargarImagenSegura(pisoActivoConfig.fondoRuta, {
        color: pisoActivoConfig.colorPlaceholder,
        tipo: "fondo",
        etiqueta: `P${pisoActivoConfig.id}`
    });

    const rutasTiles = obtenerRutasTilesTema(pisoActivoConfig.tilesTema);
    const rutasPiso = obtenerRutasPisoActivo();
    [
        ...rutasPiso.map((ruta) => ({ ruta, tipo: "tile" })),
        { ruta: rutasTiles.bordeRotoIzq, tipo: "borde" },
        { ruta: rutasTiles.bordeRotoDer, tipo: "borde" },
        { ruta: rutasTiles.trampaPivote, tipo: "trampa" }
    ].forEach((asset) => {
        AssetManager.cargarImagenSegura(asset.ruta, {
            color: pisoActivoConfig.colorPlaceholder,
            tipo: asset.tipo,
            etiqueta: pisoActivoConfig.tilesTema
        });
    });
}

function cargarAssetsEscenario() {
    const rutasTiles = obtenerRutasTilesTema(pisoActivoConfig.tilesTema);
    const rutasIniciales = [
        pisoActivoConfig.fondoRuta,
        ...obtenerRutasPisoActivo(),
        rutasTiles.bordeRotoIzq,
        rutasTiles.bordeRotoDer,
        rutasTiles.trampaPivote
    ];

    return Promise.all(rutasIniciales.map((ruta) => AssetManager.cargarImagenSegura(ruta, {
        color: pisoActivoConfig.colorPlaceholder,
        tipo: ruta.includes("borde") ? "borde" : ruta.includes("trampa") ? "trampa" : "tile"
    })));
}

// ============================================================================
// 2. FONDO PARALLAX Y DECORACIÓN DEL EDIFICIO (PROPS Y OBJETOS)
// ============================================================================

function dibujarFondoParallax(camaraX) {
    const limitePisoY = typeof nivel !== "undefined" && Number.isFinite(nivel.pisoY) ? nivel.pisoY : 600;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, limitePisoY);
    ctx.clip();

    ctx.fillStyle = pisoActivoConfig.colorPlaceholder;
    ctx.fillRect(0, 0, canvas.width, limitePisoY);

    const imagen = obtenerFondoActivo();
    const anchoImagen = imagen.naturalWidth || imagen.width || 64;
    const altoImagen = imagen.naturalHeight || imagen.height || 64;
    const altoFondo = 720;
    const anchoFondo = anchoImagen * (altoFondo / altoImagen);
    const offsetX = -((camaraX * 0.3) % anchoFondo);

    for (let x = offsetX - anchoFondo; x < canvas.width + anchoFondo; x += anchoFondo) {
        ctx.drawImage(imagen, x, 0, anchoFondo, altoFondo);
    }

    ctx.fillStyle = "rgba(20, 22, 26, 0.22)";
    ctx.fillRect(0, 0, canvas.width, limitePisoY);
    ctx.restore();

    // Todo por debajo de la línea de piso es negro absoluto
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, limitePisoY, canvas.width, Math.max(0, canvas.height - limitePisoY));
}

function obtenerPropsDecorativos(configPiso) {
    const ajustePiso = nivel.pisoY - 365;
    const plantillas = [
        { tipo: PROPS.ESCRITORIO, x: 170, y: 291 + ajustePiso, ancho: 170 },
        { tipo: PROPS.ARCHIVADOR, x: 435, y: 243 + ajustePiso },
        { tipo: PROPS.CAMARA_SEGURIDAD, x: 720, y: 72 },
        { tipo: PROPS.RADIADOR, x: 990, y: 303 + ajustePiso },
        { tipo: PROPS.EXTINTOR, x: 1370, y: 286 + ajustePiso },
        { tipo: PROPS.PLANTA_SECA, x: 1910, y: 300 + ajustePiso },
        { tipo: PROPS.CAJAS, x: 2290, y: 318 + ajustePiso },
        { tipo: PROPS.TUBERIAS, x: 2670, y: 92 }
    ];

    return plantillas.filter((prop) => (configPiso.propsPermitidos || []).includes(prop.tipo));
}

function dibujarPropProcedural(prop) {
    ctx.save();

    if (prop.tipo === PROPS.ESCRITORIO) {
        ctx.fillStyle = "#6e4634";
        ctx.fillRect(prop.x, prop.y + 16, prop.ancho, 12);
        ctx.fillStyle = "#a36a3d";
        ctx.fillRect(prop.x - 5, prop.y + 8, prop.ancho + 10, 10);
        ctx.fillStyle = "#3b2e2b";
        ctx.fillRect(prop.x + 14, prop.y + 28, 10, 46);
        ctx.fillRect(prop.x + prop.ancho - 24, prop.y + 28, 10, 46);
    } else if (prop.tipo === PROPS.ARCHIVADOR) {
        ctx.fillStyle = "#596463";
        ctx.fillRect(prop.x, prop.y, 58, 122);
        ctx.fillStyle = "#76817a";
        ctx.fillRect(prop.x + 6, prop.y + 8, 46, 30);
        ctx.fillRect(prop.x + 6, prop.y + 46, 46, 30);
        ctx.fillRect(prop.x + 6, prop.y + 84, 46, 30);
        ctx.strokeStyle = "#202729";
        ctx.lineWidth = 3;
        ctx.strokeRect(prop.x, prop.y, 58, 122);
    } else if (prop.tipo === PROPS.CAMARA_SEGURIDAD) {
        ctx.fillStyle = "#d7d2bd";
        ctx.fillRect(prop.x, prop.y, 24, 8);
        ctx.fillStyle = "#3f484d";
        ctx.fillRect(prop.x + 18, prop.y + 4, 36, 18);
        ctx.fillStyle = "#151a1f";
        ctx.fillRect(prop.x + 49, prop.y + 8, 8, 10);
    } else if (prop.tipo === PROPS.RADIADOR) {
        ctx.fillStyle = "#8b9188";
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(prop.x + i * 12, prop.y, 8, 54);
        }
        ctx.strokeStyle = "#3d4545";
        ctx.strokeRect(prop.x - 4, prop.y - 4, 66, 62);
    } else if (prop.tipo === PROPS.EXTINTOR) {
        ctx.fillStyle = "#a9302f";
        ctx.fillRect(prop.x, prop.y, 18, 62);
        ctx.fillStyle = "#d8d0b4";
        ctx.fillRect(prop.x + 3, prop.y + 20, 12, 12);
        ctx.fillStyle = "#2c3030";
        ctx.fillRect(prop.x + 4, prop.y - 7, 10, 9);
    } else if (prop.tipo === PROPS.PLANTA_SECA) {
        ctx.fillStyle = "#554134";
        ctx.fillRect(prop.x, prop.y + 38, 34, 18);
        ctx.strokeStyle = "#7d6a47";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(prop.x + 17, prop.y + 38);
        ctx.lineTo(prop.x + 8, prop.y + 10);
        ctx.moveTo(prop.x + 17, prop.y + 38);
        ctx.lineTo(prop.x + 28, prop.y + 15);
        ctx.stroke();
    } else if (prop.tipo === PROPS.CAJAS) {
        ctx.fillStyle = "#a66a37";
        ctx.fillRect(prop.x, prop.y, 52, 42);
        ctx.fillStyle = "#80512e";
        ctx.fillRect(prop.x + 56, prop.y + 14, 42, 28);
        ctx.strokeStyle = "#513525";
        ctx.strokeRect(prop.x, prop.y, 52, 42);
        ctx.strokeRect(prop.x + 56, prop.y + 14, 42, 28);
    } else if (prop.tipo === PROPS.TUBERIAS) {
        ctx.strokeStyle = "#8b9188";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(prop.x, prop.y);
        ctx.lineTo(prop.x, prop.y + 120);
        ctx.lineTo(prop.x + 90, prop.y + 120);
        ctx.stroke();
    }

    ctx.restore();
}

function dibujarProps(camaraX) {
    ctx.save();
    ctx.translate(-camaraX, 0);
    obtenerPropsDecorativos(pisoActivoConfig).forEach(dibujarPropProcedural);
    ctx.restore();
}

function dibujarObjeto(objeto) {
    const imagen = AssetManager.obtenerImagen(obtenerRutaObjeto(objeto.tipo, objeto.imagen), {
        color: pisoActivoConfig.colorPlaceholder,
        tipo: "prop",
        etiqueta: objeto.tipo
    });

    if (!imagen.esFallback) {
        ctx.drawImage(imagen, objeto.x, objeto.y, objeto.ancho, objeto.alto);
        return;
    }

    ctx.fillStyle = ajustarColorHex(pisoActivoConfig.colorPlaceholder, 46);
    ctx.fillRect(objeto.x, objeto.y, objeto.ancho, objeto.alto);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    ctx.strokeRect(objeto.x + 0.5, objeto.y + 0.5, objeto.ancho - 1, objeto.alto - 1);
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "10px monospace";
    ctx.fillText(objeto.tipo, objeto.x + 5, objeto.y + 14, objeto.ancho - 10);
}

function dibujarObjetos(camaraX, deFondo) {
    const objetos = (pisoActivoConfig.objetos || [])
        .filter((objeto) => (objeto.modo === MODOS_OBJETO.FONDO) === deFondo);
    if (!objetos.length) return;

    ctx.save();
    ctx.translate(-camaraX, 0);
    objetos.forEach(dibujarObjeto);
    ctx.restore();
}

function dibujarEscenario(camaraX) {
    dibujarFondoParallax(camaraX);
    dibujarProps(camaraX);
    dibujarObjetos(camaraX, true);
}

// ============================================================================
// 3. DIBUJO DE PLATAFORMAS, HUECOS Y PUENTES ACCIONADOS POR BOTÓN
// ============================================================================

function dibujarTileFallback(ctx, x, y, ancho, alto, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, ancho, alto);
    ctx.fillStyle = ajustarColorHex(color, -26);
    ctx.fillRect(x, y + 4, ancho, 4);
    ctx.fillStyle = ajustarColorHex(color, -44);
    ctx.fillRect(x, y + alto - 12, ancho, 12);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.strokeRect(x + 0.5, y + 0.5, ancho - 1, alto - 1);
}

function obtenerBordeHueco(lado) {
    const rutasTiles = obtenerRutasTilesTema(pisoActivoConfig.tilesTema);
    const ruta = lado === "izq" ? rutasTiles.bordeRotoIzq : rutasTiles.bordeRotoDer;
    return AssetManager.obtenerImagen(ruta, {
        color: obtenerColorPiso(),
        tipo: "borde",
        etiqueta: lado
    });
}

function dibujarBordeHuecoFallback(ctx, x, y, lado) {
    const direccion = lado === "izq" ? 1 : -1;
    ctx.fillStyle = ajustarColorHex(obtenerColorPiso(), 8);
    ctx.beginPath();
    ctx.moveTo(x, y - 7);
    ctx.lineTo(x + direccion * 18, y);
    ctx.lineTo(x + direccion * 8, y + 11);
    ctx.lineTo(x + direccion * 22, y + 24);
    ctx.lineTo(x, y + 38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
    ctx.stroke();
}

function dibujarBordeHuecoComoTile(ctx, x, y, lado, ancho = TILE_PISO_ANCHO) {
    const borde = obtenerBordeHueco(lado);
    const alto = TILE_PISO_ALTO;

    if (!borde.esFallback) {
        ctx.drawImage(borde, 0, 0, borde.naturalWidth, borde.naturalHeight, x, y, ancho, alto);
        return;
    }

    dibujarTileFallback(ctx, x, y, ancho, alto, obtenerColorPiso());
    dibujarBordeHuecoFallback(ctx, lado === "der" ? x + ancho : x, y, lado);
}

function dibujarTramoPlataforma(ctx, plataforma, xLocal = plataforma.x, yLocal = plataforma.y, opciones = {}, tiempoActual = 0) {
    const color = obtenerColorPiso();
    const altoTile = opciones.altoPersonalizado || TILE_PISO_ALTO;
    const anchoBordeIzq = opciones.bordeIzq ? Math.min(TILE_PISO_ANCHO, plataforma.ancho) : 0;
    const anchoBordeDer = opciones.bordeDer ? Math.min(TILE_PISO_ANCHO, Math.max(0, plataforma.ancho - anchoBordeIzq)) : 0;
    const inicioTilesNormales = anchoBordeIzq;
    const finTilesNormales = plataforma.ancho - anchoBordeDer;

    if (anchoBordeIzq > 0) {
        dibujarBordeHuecoComoTile(ctx, xLocal, yLocal, "izq", anchoBordeIzq);
    }

    for (let x = inicioTilesNormales, indicePieza = 0; x < finTilesNormales; indicePieza++) {
        const rutaTile = obtenerRutaPisoParaBloque(indicePieza);
        const tile = AssetManager.obtenerImagen(rutaTile, {
            color,
            tipo: "tile",
            etiqueta: pisoActivoConfig.tilesTema
        });
        const anchoTile = Math.min(TILE_PISO_ANCHO, finTilesNormales - x);
        if (tile.esFallback) {
            dibujarTileFallback(ctx, xLocal + x, yLocal, anchoTile, altoTile, color);
        } else {
            ctx.drawImage(tile, 0, 0, tile.naturalWidth, tile.naturalHeight, xLocal + x, yLocal, anchoTile, altoTile);
        }
        x += anchoTile;
    }

    if (anchoBordeDer > 0) {
        dibujarBordeHuecoComoTile(ctx, xLocal + plataforma.ancho - anchoBordeDer, yLocal, "der", anchoBordeDer);
    }

    // Overlays visuales según el tipo de plataforma
    if (plataforma.tipo === TIPOS_PLATAFORMA.RESBALADIZO) {
        ctx.fillStyle = "rgba(130, 238, 255, 0.36)";
        ctx.fillRect(xLocal + 4, yLocal + 1, plataforma.ancho - 8, 8);
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        for (let bx = xLocal + 18; bx < xLocal + plataforma.ancho - 20; bx += 46) {
            ctx.fillRect(bx, yLocal + 3, 18, 3);
        }
    } else if (plataforma.tipo === TIPOS_PLATAFORMA.QUEBRADIZO) {
        ctx.strokeStyle = "#2b1d14";
        ctx.lineWidth = 2;
        for (let gx = xLocal + 24; gx < xLocal + plataforma.ancho - 16; gx += 42) {
            ctx.beginPath();
            ctx.moveTo(gx, yLocal + 2);
            ctx.lineTo(gx - 7, yLocal + 14);
            ctx.lineTo(gx + 5, yLocal + 26);
            ctx.stroke();
        }
        ctx.fillStyle = "rgba(255, 166, 77, 0.22)";
        ctx.fillRect(xLocal + 2, yLocal + 2, plataforma.ancho - 4, 6);
    } else if (plataforma.tipo === TIPOS_PLATAFORMA.MOVIL || plataforma.movil) {
        ctx.strokeStyle = "#5ce1e6";
        ctx.lineWidth = 2;
        ctx.strokeRect(xLocal + 1, yLocal + 1, plataforma.ancho - 2, altoTile - 2);
        ctx.fillStyle = "#5ce1e6";
        ctx.fillRect(xLocal + 10, yLocal + altoTile - 6, 14, 4);
        ctx.fillRect(xLocal + plataforma.ancho - 24, yLocal + altoTile - 6, 14, 4);
    } else if (plataforma.tipo === TIPOS_PLATAFORMA.CINTA) {
        ctx.fillStyle = "#252930";
        ctx.fillRect(xLocal + 4, yLocal + 2, plataforma.ancho - 8, 12);
        const activa = !plataforma.canal
            ? true
            : (plataforma.ocultaInicial
                ? canalInterruptorActivo(plataforma.canal, tiempoActual)
                : !canalInterruptorActivo(plataforma.canal, tiempoActual));
        const dir = (plataforma.velocidadCinta ?? 2.6) >= 0 ? 1 : -1;
        const offsetAnim = activa ? (((tiempoActual * 0.06 * dir) % 24 + 24) % 24) : 0;
        ctx.strokeStyle = activa ? "#ffe14d" : "#7a828a";
        ctx.lineWidth = 2;
        for (let cx = xLocal + 10 + offsetAnim; cx < xLocal + plataforma.ancho - 14; cx += 24) {
            ctx.beginPath();
            ctx.moveTo(cx - 4 * dir, yLocal + 4);
            ctx.lineTo(cx + 3 * dir, yLocal + 8);
            ctx.lineTo(cx - 4 * dir, yLocal + 12);
            ctx.stroke();
        }
    } else if (plataforma.tipo === TIPOS_PLATAFORMA.REBOTE) {
        const comp = opciones.compresionRebote || 0;
        const yPad = yLocal + comp * 8;
        ctx.fillStyle = "#ff3b5c";
        ctx.fillRect(xLocal + 6, yPad - 6, plataforma.ancho - 12, 8);
        ctx.fillStyle = "#ffe14d";
        ctx.fillRect(xLocal + 12, yPad - 4, plataforma.ancho - 24, 3);
    }

    // Indicador de vínculo a botón si la plataforma tiene canal
    if (plataforma.canal) {
        ctx.fillStyle = "rgba(16, 24, 32, 0.8)";
        ctx.fillRect(xLocal + plataforma.ancho / 2 - 22, yLocal + 4, 44, 13);
        ctx.fillStyle = "#48ff9b";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`BTN ${plataforma.canal}`, xLocal + plataforma.ancho / 2, yLocal + 14);
        ctx.textAlign = "left";
    }
}

function dibujarHuecoDespues(ctx, plataforma) {
    if (plataforma.flotante || !plataforma.tieneHuecoDespues || plataforma.anchoHueco <= 0) return;

    const inicioHueco = plataforma.x + plataforma.ancho;
    const inicioSombraHueco = inicioHueco - CONFIG_HUECO.extensionBordeDer;
    const anchoSombraHueco = plataforma.anchoHueco + CONFIG_HUECO.extensionBordeDer + CONFIG_HUECO.extensionBordeIzq;
    const y = plataforma.y;
    ctx.fillStyle = "#000000";
    ctx.fillRect(inicioSombraHueco, y, anchoSombraHueco, Math.max(0, canvas.height - y));
}

function dibujarPlataformas(ctx, nivelActual, camaraActualX, tiempoActual = performance.now()) {
    ctx.save();
    ctx.translate(-camaraActualX, 0);

    // Base negra absoluta desde la línea de piso hacia abajo
    ctx.fillStyle = "#000000";
    ctx.fillRect(camaraActualX - 40, nivel.pisoY, canvas.width + 80, Math.max(0, canvas.height - nivel.pisoY));

    plataformasNivel.forEach((plataforma) => {
        dibujarHuecoDespues(ctx, plataforma);
    });

    let ultimaPlataformaSuelo = null;
    plataformasNivel.forEach((plataforma, indice) => {
        const estado = obtenerEstadoPlataforma(indice);
        const esFlotante = Boolean(
            plataforma.flotante || plataforma.movil || Math.abs((plataforma.y || ALTURA_PLATAFORMA_DEFAULT) - ALTURA_PLATAFORMA_DEFAULT) > 14
        );
        const altoDibujo = esFlotante ? 26 : TILE_PISO_ALTO;

        // Si la plataforma depende de un botón (ocultaInicial) y el canal aún está apagado,
        // se muestra el contorno punteado indicando qué botón la despliega
        if (plataforma.ocultaInicial && plataforma.canal && !canalInterruptorActivo(plataforma.canal)) {
            ctx.save();
            ctx.strokeStyle = "rgba(92, 225, 230, 0.55)";
            ctx.setLineDash([6, 4]);
            ctx.lineWidth = 2;
            ctx.strokeRect(estado.xActual + 1, estado.yActual + 1, plataforma.ancho - 2, altoDibujo - 2);
            ctx.setLineDash([]);
            ctx.fillStyle = "rgba(92, 225, 230, 0.85)";
            ctx.font = "bold 10px monospace";
            ctx.textAlign = "center";
            ctx.fillText(`[BOTÓN ${plataforma.canal}]`, estado.xActual + plataforma.ancho / 2, estado.yActual + altoDibujo / 2 + 3);
            ctx.restore();
            return;
        }

        const opcionesBordes = esFlotante
            ? { bordeIzq: false, bordeDer: false, altoPersonalizado: 26, compresionRebote: estado.compresionRebote }
            : {
                bordeIzq: Boolean(ultimaPlataformaSuelo?.tieneHuecoDespues),
                bordeDer: Boolean(plataforma.tieneHuecoDespues),
                compresionRebote: estado.compresionRebote
            };

        if (!esFlotante) {
            ultimaPlataformaSuelo = plataforma;
        }

        // Si es quebradiza y ya colapsó, se dibuja cayendo translúcida
        if (plataforma.tipo === TIPOS_PLATAFORMA.QUEBRADIZO && !estado.colisionActiva) {
            const avanceCaida = Math.min(1, (tiempoActual - estado.caidaEn) / 420);
            if (avanceCaida < 1) {
                ctx.save();
                ctx.globalAlpha = 1 - avanceCaida;
                dibujarTramoPlataforma(ctx, plataforma, estado.xActual, estado.yActual + avanceCaida * 55, opcionesBordes, tiempoActual);
                ctx.restore();
            }
            return;
        }

        // Riel guía para plataformas móviles
        if (plataforma.tipo === TIPOS_PLATAFORMA.MOVIL || plataforma.movil) {
            const m = plataforma.movil || { eje: "x", rango: 140 };
            ctx.save();
            ctx.strokeStyle = "rgba(92, 225, 230, 0.28)";
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (m.eje === "y") {
                ctx.moveTo(estado.xBase + plataforma.ancho / 2, estado.yBase - m.rango);
                ctx.lineTo(estado.xBase + plataforma.ancho / 2, estado.yBase + m.rango);
            } else {
                ctx.moveTo(estado.xBase - m.rango + plataforma.ancho / 2, estado.yBase + 12);
                ctx.lineTo(estado.xBase + m.rango + plataforma.ancho / 2, estado.yBase + 12);
            }
            ctx.stroke();
            ctx.restore();
        }

        if (plataforma.tipo === TIPOS_PLATAFORMA.PIVOTE) {
            const rutasTiles = obtenerRutasTilesTema(pisoActivoConfig.tilesTema);
            const trampaImg = AssetManager.obtenerImagen(rutasTiles.trampaPivote, {
                color: obtenerColorPiso(),
                tipo: "trampa",
                etiqueta: pisoActivoConfig.tilesTema
            });

            ctx.save();
            ctx.translate(estado.xActual + plataforma.ancho / 2, estado.yActual);
            ctx.rotate(estado.angulo);

            const temporal = { ...plataforma, x: -plataforma.ancho / 2, y: 0 };
            dibujarTramoPlataforma(ctx, temporal, -plataforma.ancho / 2, 0, opcionesBordes, tiempoActual);

            if (!trampaImg.esFallback) {
                const inicioTrampa = opcionesBordes.bordeIzq ? -plataforma.ancho / 2 + TILE_PISO_ANCHO : -plataforma.ancho / 2;
                const finTrampa = opcionesBordes.bordeDer ? plataforma.ancho / 2 - TILE_PISO_ANCHO : plataforma.ancho / 2;
                for (let x = inicioTrampa; x < finTrampa; x += TILE_PISO_ANCHO) {
                    const ancho = Math.min(TILE_PISO_ANCHO, finTrampa - x);
                    ctx.drawImage(trampaImg, x, 0, ancho, TILE_PISO_ALTO);
                }
            } else {
                const inicioTrampa = opcionesBordes.bordeIzq ? -plataforma.ancho / 2 + TILE_PISO_ANCHO : -plataforma.ancho / 2;
                const anchoTrampa = plataforma.ancho
                    - (opcionesBordes.bordeIzq ? TILE_PISO_ANCHO : 0)
                    - (opcionesBordes.bordeDer ? TILE_PISO_ANCHO : 0);
                ctx.fillStyle = estado.activada ? "#9f8053" : "#747c72";
                ctx.fillRect(inicioTrampa, 0, anchoTrampa, TILE_PISO_ALTO);
                ctx.fillStyle = "#353c3e";
                ctx.fillRect(-4, 0, 8, TILE_PISO_ALTO);
            }

            ctx.restore();
            return;
        }

        const xDibujo = estado.xActual + (estado.offsetTemblorX || 0);
        dibujarTramoPlataforma(ctx, plataforma, xDibujo, estado.yActual, opcionesBordes, tiempoActual);
    });

    ctx.fillStyle = "#e0d6a8";
    ctx.font = "10px monospace";
    ctx.fillText(`${pisoActivoConfig.nombre.toUpperCase()} // ${pisoActivoConfig.tipoPiso.toUpperCase()}`, 24, nivel.pisoY - 16);
    ctx.restore();
}

// ============================================================================
// 4. DIBUJO DE TRAMPAS ACTIVAS
// ============================================================================

function dibujarTrampasActivas(ctx, camaraActualX, tiempoActual) {
    if (!trampasNivel.length) return;
    ctx.save();
    ctx.translate(-camaraActualX, 0);

    trampasNivel.forEach((t) => {
        const rutaImg = typeof obtenerRutaTrampa === "function" ? obtenerRutaTrampa(t) : (t.imagen || "");
        const imgPersonalizada = rutaImg ? AssetManager.obtenerImagen(rutaImg, { tipo: "trampa", etiqueta: t.tipo }) : null;
        const usarImagen = Boolean(imgPersonalizada && !imgPersonalizada.esFallback && imgPersonalizada.naturalWidth > 0);
        const desactivadaPorBoton = Boolean(t.canal && canalInterruptorActivo(t.canal));

        ctx.save();
        if (desactivadaPorBoton) {
            ctx.globalAlpha = 0.35;
        }

        if (t.tipo === TIPOS_TRAMPA_ACTIVA.PINCHOS) {
            if (usarImagen) {
                ctx.drawImage(imgPersonalizada, t.xBase, t.yBase, t.ancho, t.alto);
            } else {
                ctx.fillStyle = "#2b2f36";
                ctx.fillRect(t.xBase, t.yBase + t.alto - 8, t.ancho, 8);
                const numPinchos = Math.max(2, Math.floor(t.ancho / 18));
                const paso = t.ancho / numPinchos;
                for (let i = 0; i < numPinchos; i++) {
                    const px = t.xBase + i * paso;
                    ctx.fillStyle = i % 2 === 0 ? "#d9e2ec" : "#ff6b6b";
                    ctx.beginPath();
                    ctx.moveTo(px + 2, t.yBase + t.alto - 6);
                    ctx.lineTo(px + paso / 2, t.yBase + 2);
                    ctx.lineTo(px + paso - 2, t.yBase + t.alto - 6);
                    ctx.closePath();
                    ctx.fill();
                }
                if (!desactivadaPorBoton && Math.floor(tiempoActual / 90) % 2 === 0) {
                    ctx.strokeStyle = "#ffe14d";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(t.xBase + 8, t.yBase + 8);
                    ctx.lineTo(t.xBase + t.ancho / 2, t.yBase + 2);
                    ctx.lineTo(t.xBase + t.ancho - 8, t.yBase + 9);
                    ctx.stroke();
                }
            }
        } else if (t.tipo === TIPOS_TRAMPA_ACTIVA.VAPOR) {
            if (usarImagen) {
                if (t.estadoCiclo === "reposo") ctx.globalAlpha *= 0.45;
                else if (t.estadoCiclo === "aviso") ctx.globalAlpha *= 0.72;
                ctx.drawImage(imgPersonalizada, t.xBase, t.yBase, t.ancho, t.alto);
            } else {
                const baseY = t.yBase + t.alto;
                if (!desactivadaPorBoton && t.estadoCiclo === "activa") {
                    const grad = ctx.createLinearGradient(0, baseY, 0, t.yBase);
                    grad.addColorStop(0, "rgba(255, 190, 110, 0.92)");
                    grad.addColorStop(0.5, "rgba(235, 245, 255, 0.85)");
                    grad.addColorStop(1, "rgba(255, 255, 255, 0.15)");
                    ctx.fillStyle = grad;
                    ctx.fillRect(t.xBase + 6, t.yBase, t.ancho - 12, t.alto - 18);
                } else if (!desactivadaPorBoton && t.estadoCiclo === "aviso") {
                    ctx.fillStyle = "rgba(255, 225, 77, 0.35)";
                    ctx.fillRect(t.xBase + 10, baseY - 38, t.ancho - 20, 22);
                }
                ctx.fillStyle = "#56636a";
                ctx.fillRect(t.xBase + 4, baseY - 22, t.ancho - 8, 22);
                ctx.strokeStyle = "#222";
                ctx.lineWidth = 2;
                ctx.strokeRect(t.xBase + 4, baseY - 22, t.ancho - 8, 22);
            }
        } else if (t.tipo === TIPOS_TRAMPA_ACTIVA.LASER) {
            if (usarImagen) {
                if (t.estadoCiclo === "reposo") ctx.globalAlpha *= 0.35;
                else if (t.estadoCiclo === "aviso") ctx.globalAlpha *= 0.68;
                ctx.drawImage(imgPersonalizada, t.xBase, t.yBase, t.ancho, t.alto);
            } else {
                const esHorizontal = t.orientacion !== "vertical" && t.ancho >= t.alto;
                ctx.fillStyle = "#3a4149";
                ctx.fillRect(t.xBase, t.yBase, 22, 22);
                ctx.strokeStyle = "#1b1f23";
                ctx.lineWidth = 2;
                ctx.strokeRect(t.xBase, t.yBase, 22, 22);

                if (!desactivadaPorBoton && t.estadoCiclo === "activa") {
                    ctx.fillStyle = "rgba(255, 45, 85, 0.32)";
                    ctx.fillRect(t.xBase, t.yBase, t.ancho, t.alto);
                    ctx.fillStyle = "#ff2d55";
                    if (esHorizontal) {
                        ctx.fillRect(t.xBase + 18, t.yBase + t.alto / 2 - 4, t.ancho - 20, 8);
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(t.xBase + 18, t.yBase + t.alto / 2 - 1.5, t.ancho - 20, 3);
                    } else {
                        ctx.fillRect(t.xBase + t.ancho / 2 - 4, t.yBase + 18, 8, t.alto - 20);
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(t.xBase + t.ancho / 2 - 1.5, t.yBase + 18, 3, t.alto - 20);
                    }
                } else if (!desactivadaPorBoton && t.estadoCiclo === "aviso") {
                    ctx.strokeStyle = "rgba(255, 90, 120, 0.75)";
                    ctx.setLineDash([6, 4]);
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    if (esHorizontal) {
                        ctx.moveTo(t.xBase + 18, t.yBase + t.alto / 2);
                        ctx.lineTo(t.xBase + t.ancho, t.yBase + t.alto / 2);
                    } else {
                        ctx.moveTo(t.xBase + t.ancho / 2, t.yBase + 18);
                        ctx.lineTo(t.xBase + t.ancho / 2, t.yBase + t.alto);
                    }
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }
        } else if (t.tipo === TIPOS_TRAMPA_ACTIVA.APLASTADOR) {
            const shakeX = !desactivadaPorBoton && t.estadoCiclo === "aviso" ? Math.sin(tiempoActual * 0.12) * 3 : 0;
            const xDib = t.xBase + shakeX;
            const yDib = t.yActual;

            ctx.fillStyle = "#394248";
            ctx.fillRect(t.xBase + t.ancho / 2 - 7, t.yBase - 28, 14, Math.max(10, yDib - (t.yBase - 28)));

            if (usarImagen) {
                ctx.drawImage(imgPersonalizada, xDib, yDib, t.ancho, t.alto);
            } else {
                ctx.fillStyle = "#525d66";
                ctx.fillRect(xDib, yDib, t.ancho, t.alto);
                ctx.strokeStyle = "#1c2226";
                ctx.lineWidth = 3;
                ctx.strokeRect(xDib + 1, yDib + 1, t.ancho - 2, t.alto - 2);
                ctx.fillStyle = "#ffe14d";
                ctx.fillRect(xDib + 4, yDib + t.alto - 14, t.ancho - 8, 10);
                ctx.fillStyle = "#ff4d6d";
                ctx.fillRect(xDib + 12, yDib + 14, t.ancho - 24, 8);
            }
        } else if (t.tipo === TIPOS_TRAMPA_ACTIVA.SIERRA) {
            if (usarImagen) {
                ctx.drawImage(imgPersonalizada, t.xActual, t.yActual, t.ancho, t.alto);
            } else {
                const cx = t.xActual + t.ancho / 2;
                const cy = t.yActual + t.alto / 2;
                const radio = Math.min(t.ancho, t.alto) / 2;
                const angulo = desactivadaPorBoton ? 0 : (tiempoActual * 0.012) % (Math.PI * 2);

                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(angulo);

                const dientes = 10;
                ctx.fillStyle = "#ff5252";
                ctx.beginPath();
                for (let i = 0; i < dientes * 2; i++) {
                    const r = i % 2 === 0 ? radio + 4 : radio - 5;
                    const a = (i * Math.PI) / dientes;
                    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                }
                ctx.closePath();
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#ffffff";
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(0, 0, radio * 0.42, 0, Math.PI * 2);
                ctx.fillStyle = "#2b2f36";
                ctx.fill();
                ctx.restore();
            }
        }

        ctx.restore();

        if (t.canal) {
            const tx = (t.xActual ?? t.xBase) + t.ancho / 2;
            const ty = (t.yActual ?? t.yBase) - 14;
            ctx.fillStyle = "rgba(16, 24, 32, 0.82)";
            ctx.fillRect(tx - 24, ty - 9, 48, 13);
            ctx.fillStyle = desactivadaPorBoton ? "#48ff9b" : "#ffe14d";
            ctx.font = "bold 9px monospace";
            ctx.textAlign = "center";
            ctx.fillText(desactivadaPorBoton ? `OFF [${t.canal}]` : `BTN ${t.canal}`, tx, ty);
            ctx.textAlign = "left";
        }
    });

    ctx.restore();
}

// ============================================================================
// 5. DIBUJO DE BOTONES/INTERRUPTORES, CHECKPOINTS, COLECCIONABLES Y META
// ============================================================================

function dibujarInterruptor(ctx, sw, tiempoActual) {
    const activo = canalInterruptorActivo(sw.canal, tiempoActual);
    const estilo = sw.estilo || sw.tipo || TIPOS_INTERRUPTOR.BOTON_PISO;
    const rutaImg = typeof obtenerRutaInterruptor === "function" ? obtenerRutaInterruptor(sw) : (sw.imagen || "");
    if (rutaImg) {
        const imgSw = AssetManager.obtenerImagen(rutaImg, { tipo: "prop", etiqueta: estilo });
        if (!imgSw.esFallback && imgSw.naturalWidth > 0) {
            ctx.drawImage(imgSw, sw.x, sw.y, sw.ancho, sw.alto);
            return;
        }
    }

    const cx = sw.x + sw.ancho / 2;

    if (estilo === TIPOS_INTERRUPTOR.PALANCA) {
        // Tablero eléctrico con palanca
        ctx.fillStyle = "#2d353c";
        ctx.fillRect(sw.x, sw.y, sw.ancho, sw.alto);
        ctx.strokeStyle = activo ? "#48ff9b" : "#ff6b6b";
        ctx.lineWidth = 2;
        ctx.strokeRect(sw.x + 1, sw.y + 1, sw.ancho - 2, sw.alto - 2);

        ctx.strokeStyle = "#e6edf3";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx, sw.y + sw.alto / 2);
        ctx.lineTo(cx + (activo ? 10 : -10), sw.y + (activo ? 12 : sw.alto - 12));
        ctx.stroke();
    } else if (estilo === TIPOS_INTERRUPTOR.VALVULA) {
        // Llave de paso / válvula redonda de tubería
        const cy = sw.y + sw.alto / 2;
        const r = Math.min(sw.ancho, sw.alto) * 0.42;
        ctx.save();
        ctx.translate(cx, cy);
        if (activo) ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.lineWidth = 5;
        ctx.strokeStyle = activo ? "#48ff9b" : "#ff5252";
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-r, 0);
        ctx.lineTo(r, 0);
        ctx.moveTo(0, -r);
        ctx.lineTo(0, r);
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    } else {
        // Botón de piso por defecto
        const hundimiento = activo ? 6 : 0;
        ctx.fillStyle = "#353c42";
        ctx.fillRect(sw.x, sw.y + sw.alto - 8, sw.ancho, 8);
        ctx.fillStyle = activo ? "#48ff9b" : "#ff4d6d";
        ctx.fillRect(sw.x + 6, sw.y + 4 + hundimiento, sw.ancho - 12, Math.max(6, sw.alto - 10 - hundimiento));
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sw.x + 6, sw.y + 4 + hundimiento, sw.ancho - 12, Math.max(6, sw.alto - 10 - hundimiento));
    }

    // Etiqueta del canal sobre el botón (con cuenta regresiva si es temporizado)
    const estadoCanal = typeof estadoCanalesInterruptor !== "undefined" ? estadoCanalesInterruptor.get(String(sw.canal)) : null;
    const segRestantes = (activo && estadoCanal && !estadoCanal.permanente && Number.isFinite(estadoCanal.activoHastaMs))
        ? Math.max(1, Math.ceil((estadoCanal.activoHastaMs - tiempoActual) / 1000))
        : null;
    const textoBtn = segRestantes !== null ? `BTN ${sw.canal} (${segRestantes}s)` : `BTN ${sw.canal}`;
    const anchoCaja = Math.max(46, textoBtn.length * 6 + 8);

    ctx.fillStyle = "rgba(0, 0, 0, 0.76)";
    ctx.fillRect(cx - anchoCaja / 2, sw.y - 16, anchoCaja, 13);
    ctx.fillStyle = activo ? "#48ff9b" : "#ffe14d";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(textoBtn, cx, sw.y - 6);
    ctx.textAlign = "left";
}

function dibujarElementosFlujoNivel(ctx, camaraActualX, tiempoActual) {
    ctx.save();
    ctx.translate(-camaraActualX, 0);

    // 1. Botones / Interruptores
    interruptoresNivel.forEach((sw) => dibujarInterruptor(ctx, sw, tiempoActual));

    // 2. Checkpoints
    checkpointsNivel.forEach((cp) => {
        if (cp.imagen) {
            const imgCp = AssetManager.obtenerImagen(cp.imagen, { tipo: "checkpoint", etiqueta: "CP" });
            if (!imgCp.esFallback && imgCp.naturalWidth > 0) {
                ctx.drawImage(imgCp, cp.x, cp.y, cp.ancho, cp.alto);
                return;
            }
        }
        ctx.fillStyle = "#2b333c";
        ctx.fillRect(cp.x + cp.ancho / 2 - 5, cp.y + 24, 10, cp.alto - 24);
        ctx.fillStyle = cp.activado ? "#38f8a8" : "#ff6b6b";
        ctx.fillRect(cp.x + 4, cp.y, cp.ancho - 8, 32);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(cp.x + 4, cp.y, cp.ancho - 8, 32);

        ctx.font = "bold 9px monospace";
        ctx.fillStyle = "#10161a";
        ctx.textAlign = "center";
        ctx.fillText(cp.activado ? "OK" : "CP", cp.x + cp.ancho / 2, cp.y + 20);
        ctx.textAlign = "left";
    });

    // 3. Coleccionables (Vida/Leche +1 ♥, Poder Doble Salto, Llave/Tarjeta)
    itemsNivel.forEach((it) => {
        if (it.recolectado) return;
        const flotacionY = Math.sin(tiempoActual * 0.006 + it.x) * 5;
        const ix = it.x;
        const iy = it.y + flotacionY;

        const rutaItem = typeof obtenerRutaItem === "function" ? obtenerRutaItem(it) : (it.imagen || "");
        if (rutaItem) {
            const imgItem = AssetManager.obtenerImagen(rutaItem, { tipo: "item", etiqueta: it.tipo });
            if (!imgItem.esFallback && imgItem.naturalWidth > 0) {
                ctx.drawImage(imgItem, ix, iy, it.ancho, it.alto);
                return;
            }
        }

        if (it.tipo === TIPOS_ITEM.TARJETA) {
            ctx.fillStyle = "#ffe14d";
            ctx.fillRect(ix, iy + 4, it.ancho, it.alto - 8);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.strokeRect(ix, iy + 4, it.ancho, it.alto - 8);
            ctx.fillStyle = "#1b2838";
            ctx.fillRect(ix + 5, iy + 10, 10, 10);
            ctx.fillRect(ix + 18, iy + 11, 12, 3);
            ctx.fillRect(ix + 18, iy + 17, 9, 3);
        } else if (it.tipo === TIPOS_ITEM.DOBLE_SALTO) {
            const cx = ix + it.ancho / 2;
            const cy = iy + it.alto / 2;
            const r = Math.min(it.ancho, it.alto) / 2;
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(92, 225, 230, 0.25)";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = "#102a3a";
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#5ce1e6";
            ctx.stroke();

            ctx.fillStyle = "#ffe14d";
            ctx.font = "bold 11px monospace";
            ctx.textAlign = "center";
            ctx.fillText("2X▲", cx, cy + 4);
            ctx.restore();
        } else {
            // VIDA (+1 Corazón / Leche)
            const cx = ix + it.ancho / 2;
            const cy = iy + it.alto / 2;
            const r = Math.min(it.ancho, it.alto) / 2;
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.strokeStyle = "#ff4d6d";
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.fillStyle = "#ff4d6d";
            ctx.font = "bold 15px Arial";
            ctx.textAlign = "center";
            ctx.fillText("♥", cx, cy + 5);
            ctx.restore();
        }
    });

    // 4. Puerta de Salida / Ascensor de Descenso o Puerta a la Calle en Planta Baja
    if (metaNivel) {
        const desbloqueada = !metaNivel.requiereLlave || tarjetasRecolectadas >= totalTarjetasNivel;
        const esUltimoPiso = PISOS_CONFIG[PISOS_CONFIG.length - 1]?.id === pisoActivoConfig.id;
        const mx = metaNivel.x;
        const my = metaNivel.y;
        const mw = metaNivel.ancho;
        const mh = metaNivel.alto;

        if (metaNivel.imagen) {
            const imgMeta = AssetManager.obtenerImagen(metaNivel.imagen, { tipo: "meta", etiqueta: "META" });
            if (!imgMeta.esFallback && imgMeta.naturalWidth > 0) {
                ctx.drawImage(imgMeta, mx, my, mw, mh);
                ctx.restore();
                return;
            }
        }

        ctx.fillStyle = "#262d35";
        ctx.fillRect(mx - 8, my - 22, mw + 16, mh + 22);
        ctx.strokeStyle = desbloqueada ? "#48ff9b" : "#ffe14d";
        ctx.lineWidth = 3;
        ctx.strokeRect(mx - 8, my - 22, mw + 16, mh + 22);

        ctx.fillStyle = desbloqueada ? "#183a37" : "#3a3f47";
        ctx.fillRect(mx, my, mw, mh);

        const apertura = desbloqueada ? 18 + Math.sin(tiempoActual * 0.005) * 4 : 2;
        ctx.fillStyle = "#6c7883";
        ctx.fillRect(mx, my, Math.max(8, mw / 2 - apertura), mh);
        ctx.fillRect(mx + mw / 2 + apertura, my, Math.max(8, mw / 2 - apertura), mh);

        ctx.fillStyle = "#11161b";
        ctx.fillRect(mx - 4, my - 18, mw + 8, 15);
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = desbloqueada ? "#48ff9b" : "#ffe14d";
        const textoCartel = !desbloqueada
            ? "CON LLAVE"
            : esUltimoPiso
                ? "CALLE / SALIDA"
                : "BAJAR ▼";
        ctx.fillText(textoCartel, mx + mw / 2, my - 7);
        ctx.textAlign = "left";
    }

    // 5. Textos flotantes de feedback
    for (let i = textosFlotantes.length - 1; i >= 0; i--) {
        const tf = textosFlotantes[i];
        tf.y += tf.vy;
        tf.vida -= 0.022;
        if (tf.vida <= 0) {
            textosFlotantes.splice(i, 1);
            continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, tf.vida);
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#000000";
        ctx.fillText(tf.texto, tf.x + 1, tf.y + 1);
        ctx.fillStyle = tf.color;
        ctx.fillText(tf.texto, tf.x, tf.y);
        ctx.restore();
    }

    ctx.restore();
}

// ============================================================================
// 6. PARTÍCULAS, COLISIONES DE DEPURACIÓN Y HUD
// ============================================================================

function actualizarYDibujarParticulas(ctx, camaraActualX, factorDt) {
    ctx.save();
    ctx.translate(-camaraActualX, 0);

    for (let i = estelasDash.length - 1; i >= 0; i--) {
        const estela = estelasDash[i];
        estela.vida -= 0.085 * factorDt;
        if (estela.vida <= 0) {
            estelasDash.splice(i, 1);
            continue;
        }
        if (estela.sheet && estela.sheet.complete && estela.sheet.naturalWidth > 0) {
            ctx.save();
            ctx.globalAlpha = estela.vida * 0.38;
            ctx.filter = "brightness(1.8) saturate(0.3)";
            if (estela.direccion === "izquierda") {
                ctx.translate(estela.x + estela.ancho, estela.y);
                ctx.scale(-1, 1);
                ctx.drawImage(estela.sheet, estela.frame * estela.anchoFrame, 0, estela.anchoFrame, estela.altoFrame, 0, 0, estela.ancho, estela.alto);
            } else {
                ctx.drawImage(estela.sheet, estela.frame * estela.anchoFrame, 0, estela.anchoFrame, estela.altoFrame, estela.x, estela.y, estela.ancho, estela.alto);
            }
            ctx.restore();
        }
    }

    for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];
        p.x += p.vx * factorDt;
        p.y += p.vy * factorDt;
        p.vida -= p.decaimiento * factorDt;
        if (p.vida <= 0) {
            particulas.splice(i, 1);
            continue;
        }

        const progreso = 1 - p.vida;
        const radioActual = p.radio + (p.radioMax - p.radio) * progreso;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.vida);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radioActual, 0, Math.PI * 2);
        if (p.tipo === "onda_aire") {
            ctx.lineWidth = 3 * p.vida + 1;
            ctx.strokeStyle = p.color;
            ctx.stroke();
        } else {
            ctx.fillStyle = p.color;
            ctx.fill();
        }
        ctx.restore();
    }

    ctx.restore();
}

function rectanguloColision(x, y, ancho, alto, color, { relleno = 0.12, punteado = false, etiqueta = "" } = {}) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = relleno;
    ctx.fillRect(x, y, ancho, alto);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    if (punteado) ctx.setLineDash([6, 4]);
    ctx.strokeRect(x + 1, y + 1, ancho - 2, alto - 2);
    if (etiqueta) {
        ctx.setLineDash([]);
        ctx.font = "10px monospace";
        const anchoTexto = ctx.measureText(etiqueta).width + 6;
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(x, y - 14, anchoTexto, 13);
        ctx.fillStyle = color;
        ctx.fillText(etiqueta, x + 3, y - 4);
    }
    ctx.restore();
}

function lineaSuperficie(x, y, ancho, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 2, ancho, 4);
}

function dibujarColisiones(anim, renderPersonaje, jugadorRenderX, jugadorRenderY) {
    ctx.save();
    ctx.translate(-camaraX, 0);

    plataformasNivel.forEach((plataforma, indice) => {
        const rect = obtenerRectPlataforma(plataforma, indice);
        const activa = plataformaPermiteColision(plataforma, indice);
        const color = plataforma.tipo === TIPOS_PLATAFORMA.PIVOTE
            ? (activa ? COLORES_COLISION.pivote : COLORES_COLISION.pivoteCaido)
            : COLORES_COLISION.piso;
        rectanguloColision(rect.x, rect.y, rect.ancho, TILE_PISO_ALTO, color, {
            relleno: 0.06,
            punteado: true,
            etiqueta: `${indice + 1} ${plataforma.tipo} y=${Math.round(rect.y)}`
        });
        if (activa) lineaSuperficie(rect.x, rect.y, rect.ancho, color);
    });

    superficiesObjetos.forEach((caja) => {
        const color = COLORES_COLISION[caja.modo] || COLORES_COLISION.fondo;
        rectanguloColision(caja.x, caja.y, caja.ancho, caja.alto, color, {
            relleno: 0.18,
            etiqueta: `${caja.tipo} · ${caja.modo}`
        });
        lineaSuperficie(caja.x, caja.y, caja.ancho, color);
    });

    trampasNivel.forEach((t) => {
        if (!t.cajaPeligro) return;
        const color = t.peligrosa ? COLORES_COLISION.trampa : COLORES_COLISION.trampaInactiva;
        rectanguloColision(t.cajaPeligro.x, t.cajaPeligro.y, t.cajaPeligro.ancho, t.cajaPeligro.alto, color, {
            relleno: 0.2,
            etiqueta: `TRAMPA ${t.tipo.toUpperCase()}`
        });
    });

    interruptoresNivel.forEach((sw) => {
        rectanguloColision(sw.x, sw.y, sw.ancho, sw.alto, "#48ff9b", {
            relleno: 0.15,
            etiqueta: `BOTON ${sw.canal}`
        });
    });

    if (metaNivel) {
        rectanguloColision(metaNivel.x, metaNivel.y, metaNivel.ancho, metaNivel.alto, COLORES_COLISION.meta, {
            relleno: 0.15,
            etiqueta: "SALIDA PISO"
        });
    }

    ctx.restore();

    const jugadorEnPantallaX = jugador.x - camaraX;
    const izquierda = jugadorEnPantallaX + obtenerOffsetColisionX();
    const arriba = jugador.y + obtenerOffsetColisionY();
    const ancho = obtenerAnchoJugador();
    const alto = obtenerAlturaJugador();
    rectanguloColision(jugadorRenderX, jugadorRenderY, renderPersonaje.ancho, renderPersonaje.alto, COLORES_COLISION.sprite, { relleno: 0, punteado: true });
    rectanguloColision(izquierda, arriba, ancho, alto, COLORES_COLISION.jugador, {
        relleno: 0.15,
        etiqueta: `${configPersonaje.nombre} ${ancho}x${alto} · ${jugador.estado}`
    });
}

function dibujarBannerCentral(titulo, subtitulo, colorBorde, colorFondo, progreso) {
    ctx.save();
    ctx.fillStyle = `rgba(8, 10, 16, ${Math.min(0.75, progreso * 1.25)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const escala = progreso < 0.2
        ? 0.5 + (progreso / 0.2) * 0.6
        : 1.1 - Math.min(0.1, (progreso - 0.2) * 0.25);

    ctx.translate(canvas.width / 2, canvas.height / 2 - 10);
    ctx.scale(escala, escala);

    ctx.fillStyle = colorFondo;
    ctx.strokeStyle = colorBorde;
    ctx.lineWidth = 4;
    ctx.fillRect(-290, -60, 580, 120);
    ctx.strokeRect(-290, -60, 580, 120);

    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = colorBorde;
    ctx.fillText(titulo, 0, -8);

    ctx.font = "bold 13px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(subtitulo, 0, 26);
    ctx.restore();
}

function dibujarHud(tiempoActual = performance.now()) {
    const corazonesLlenos = "♥".repeat(jugador.vida);
    const corazonesVacios = "♡".repeat(Math.max(0, jugador.vidaMaxima - jugador.vida));

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(20, 18, 435, 42);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.strokeRect(20.5, 18.5, 434, 41);

    ctx.font = "20px Arial";
    ctx.fillStyle = tiempoActual < jugador.invulnerableHastaMs ? "#ff8585" : "#ff4d6d";
    ctx.fillText(corazonesLlenos, 30, 45);
    const anchoLlenos = ctx.measureText(corazonesLlenos).width;
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fillText(corazonesVacios, 30 + anchoLlenos, 45);

    const dashListo = jugador.enElSuelo
        ? tiempoActual >= jugador.dashCooldownHastaMs
        : jugador.dashAereoDisponible;
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = dashListo ? "#6bf5ff" : "rgba(255, 255, 255, 0.35)";
    ctx.fillText(dashListo ? "DASH ★" : "DASH ·", 142, 35);

    if (jugador.enSueloResbaladizo) {
        ctx.fillStyle = "#74eeff";
        ctx.fillText("PISO MOJADO", 142, 50);
    } else if (jugador.agachado) {
        ctx.fillStyle = "#ffe14d";
        ctx.fillText("AGACHADO", 142, 50);
    } else if (jugador.tienePoderDobleSalto) {
        const disponible = jugador.enElSuelo || jugador.saltosAereosRestantes > 0;
        ctx.fillStyle = disponible ? "#48ff9b" : "rgba(72, 255, 155, 0.42)";
        ctx.fillText(disponible ? "2X SALTO ★" : "2X USADO", 142, 50);
    } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
        ctx.fillText("2X SALTO: NO", 142, 50);
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(252, 24, 1, 30);

    ctx.fillStyle = totalTarjetasNivel > 0 && tarjetasRecolectadas >= totalTarjetasNivel ? "#48ff9b" : "#ffe14d";
    ctx.fillText(`LLAVES: ${tarjetasRecolectadas}/${totalTarjetasNivel}`, 264, 35);

    ctx.fillStyle = checkpointActivo ? "#5ce1e6" : "rgba(255, 255, 255, 0.6)";
    ctx.fillText(checkpointActivo ? "CHECKPOINT ✓" : "OBJETIVO: BAJAR ▼", 264, 50);
    ctx.restore();

    if (transicionPisoCompletado) {
        const progreso = Math.min(1, (tiempoActual - transicionPisoCompletado.inicioMs) / transicionPisoCompletado.duracionMs);
        if (transicionPisoCompletado.esFinalEdificio) {
            dibujarBannerCentral(
                "¡SALISTE A LA CALLE CON LA LECHE!",
                "LLEGASTE A LA RECEPCIÓN Y SUPERASTE TODO EL EDIFICIO",
                "#48ff9b",
                "#112622",
                progreso
            );
        } else {
            dibujarBannerCentral(
                "¡BAJANDO AL SIGUIENTE PISO!",
                `${pisoActivoConfig.nombre.toUpperCase()} SUPERADO`,
                "#ffe14d",
                "#1a1423",
                progreso
            );
        }
    }

    if (transicionGameOver) {
        const progreso = Math.min(1, (tiempoActual - transicionGameOver.inicioMs) / transicionGameOver.duracionMs);
        dibujarBannerCentral(
            "¡TE QUEDASTE SIN VIDAS!",
            "VOLVIENDO ARRIBA AL DEPARTAMENTO (NIVEL 1)...",
            "#ff4d6d",
            "#261015",
            progreso
        );
    }

    if (framesTransicionRespawn > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${framesTransicionRespawn / 28})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        framesTransicionRespawn--;
    }
}
