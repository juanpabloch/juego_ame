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
    return configPiso.plataformas.reduce((maximo, plataforma) => {
        const finPlataforma = plataforma.x + plataforma.ancho;
        const finHueco = plataforma.tieneHuecoDespues
            ? finPlataforma + plataforma.anchoHueco
            : finPlataforma;
        return Math.max(maximo, finHueco);
    }, 800);
}

function hexARgb(hex) {
    const limpio = hex.replace("#", "");
    const numero = parseInt(limpio, 16);
    return {
        r: (numero >> 16) & 255,
        g: (numero >> 8) & 255,
        b: numero & 255
    };
}

function ajustarColorHex(hex, cantidad) {
    const rgb = hexARgb(hex);
    const canal = (valor) => Math.max(0, Math.min(255, valor + cantidad));
    return `rgb(${canal(rgb.r)}, ${canal(rgb.g)}, ${canal(rgb.b)})`;
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
        pctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
        pctx.beginPath();
        pctx.moveTo(32, 0);
        pctx.lineTo(32, 64);
        pctx.moveTo(0, 32);
        pctx.lineTo(64, 32);
        pctx.stroke();
    }

    if (tipo === "tile") {
        pctx.fillStyle = ajustarColorHex(color, 32);
        pctx.fillRect(0, 0, 64, 8);
        pctx.fillStyle = ajustarColorHex(color, -24);
        pctx.fillRect(0, 48, 64, 16);
        pctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
        pctx.strokeRect(0.5, 0.5, 63, 63);
    }

    if (tipo === "borde") {
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
    }

    if (tipo === "trampa") {
        pctx.fillStyle = "#747c72";
        pctx.fillRect(0, 22, 64, 18);
        pctx.fillStyle = "#353c3e";
        pctx.fillRect(28, 22, 8, 18);
        pctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
        pctx.strokeRect(0.5, 22.5, 63, 17);
    }

    if (tipo === "prop") {
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
    nivel.pisoY = pisoActivoConfig.plataformas[0]?.y || 365;
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

function dibujarFondoParallax(camaraX) {
    ctx.fillStyle = pisoActivoConfig.colorPlaceholder;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imagen = obtenerFondoActivo();
    const anchoImagen = imagen.naturalWidth || imagen.width || 64;
    const altoImagen = imagen.naturalHeight || imagen.height || 64;
    const altoFondo = canvas.height;
    const anchoFondo = anchoImagen * (altoFondo / altoImagen);
    const offsetX = -((camaraX * 0.3) % anchoFondo);

    for (let x = offsetX - anchoFondo; x < canvas.width + anchoFondo; x += anchoFondo) {
        ctx.drawImage(imagen, x, 0, anchoFondo, altoFondo);
    }

    ctx.fillStyle = "rgba(20, 22, 26, 0.22)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function obtenerPropsDecorativos(configPiso) {
    const plantillas = [
        { tipo: PROPS.ESCRITORIO, x: 170, y: 291, ancho: 170 },
        { tipo: PROPS.ARCHIVADOR, x: 435, y: 243 },
        { tipo: PROPS.CAMARA_SEGURIDAD, x: 720, y: 72 },
        { tipo: PROPS.RADIADOR, x: 990, y: 303 },
        { tipo: PROPS.EXTINTOR, x: 1370, y: 286 },
        { tipo: PROPS.PLANTA_SECA, x: 1910, y: 300 },
        { tipo: PROPS.CAJAS, x: 2290, y: 318 },
        { tipo: PROPS.TUBERIAS, x: 2670, y: 92 }
    ];

    return plantillas.filter((prop) => configPiso.propsPermitidos.includes(prop.tipo));
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
    }

    if (prop.tipo === PROPS.ARCHIVADOR) {
        ctx.fillStyle = "#596463";
        ctx.fillRect(prop.x, prop.y, 58, 122);
        ctx.fillStyle = "#76817a";
        ctx.fillRect(prop.x + 6, prop.y + 8, 46, 30);
        ctx.fillRect(prop.x + 6, prop.y + 46, 46, 30);
        ctx.fillRect(prop.x + 6, prop.y + 84, 46, 30);
        ctx.strokeStyle = "#202729";
        ctx.lineWidth = 3;
        ctx.strokeRect(prop.x, prop.y, 58, 122);
    }

    if (prop.tipo === PROPS.CAMARA_SEGURIDAD) {
        ctx.fillStyle = "#d7d2bd";
        ctx.fillRect(prop.x, prop.y, 24, 8);
        ctx.fillStyle = "#3f484d";
        ctx.fillRect(prop.x + 18, prop.y + 4, 36, 18);
        ctx.fillStyle = "#151a1f";
        ctx.fillRect(prop.x + 49, prop.y + 8, 8, 10);
    }

    if (prop.tipo === PROPS.RADIADOR) {
        ctx.fillStyle = "#8b9188";
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(prop.x + i * 12, prop.y, 8, 54);
        }
        ctx.strokeStyle = "#3d4545";
        ctx.strokeRect(prop.x - 4, prop.y - 4, 66, 62);
    }

    if (prop.tipo === PROPS.EXTINTOR) {
        ctx.fillStyle = "#a9302f";
        ctx.fillRect(prop.x, prop.y, 18, 62);
        ctx.fillStyle = "#d8d0b4";
        ctx.fillRect(prop.x + 3, prop.y + 20, 12, 12);
        ctx.fillStyle = "#2c3030";
        ctx.fillRect(prop.x + 4, prop.y - 7, 10, 9);
    }

    if (prop.tipo === PROPS.PLANTA_SECA) {
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
    }

    if (prop.tipo === PROPS.CAJAS) {
        ctx.fillStyle = "#a66a37";
        ctx.fillRect(prop.x, prop.y, 52, 42);
        ctx.fillStyle = "#80512e";
        ctx.fillRect(prop.x + 56, prop.y + 14, 42, 28);
        ctx.strokeStyle = "#513525";
        ctx.strokeRect(prop.x, prop.y, 52, 42);
        ctx.strokeRect(prop.x + 56, prop.y + 14, 42, 28);
    }

    if (prop.tipo === PROPS.TUBERIAS) {
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

function dibujarEscenario(camaraX) {
    dibujarFondoParallax(camaraX);
    dibujarProps(camaraX);
}
