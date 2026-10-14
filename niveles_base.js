// Constantes y funciones para describir pisos. Los datos (PISOS_CONFIG) estan en niveles.js,
// que es el archivo que reescribe admin.html al guardar.

const TIPOS_PISO = {
    LINOLEO: "linoleo",
    PARQUE: "parque",
    CONCRETO: "concreto",
    AZULEJO: "azulejo"
};

const TIPOS_PLATAFORMA = {
    NORMAL: "normal",
    PIVOTE: "pivote",
    RESBALADIZO: "resbaladizo"
};

const TRAMPAS = {
    HUECO_ROTO: "hueco_roto",
    PIVOTE: "pivote",
    RESBALADIZO: "resbaladizo"
};

const PROPS = {
    ARCHIVADOR: "archivador",
    ESCRITORIO: "escritorio",
    CAMARA_SEGURIDAD: "camara_seguridad",
    RADIADOR: "radiador",
    EXTINTOR: "extintor",
    PLANTA_SECA: "planta_seca",
    TUBERIAS: "tuberias",
    ESTANTES: "estantes",
    NEVERA: "nevera",
    LAVABO: "lavabo",
    CAJAS: "cajas"
};

// fondo: solo se dibuja. plataforma: se puede saltar encima y atravesar de costado.
// solido: se puede saltar encima y ademas frena al jugador de costado y desde abajo.
const MODOS_OBJETO = {
    FONDO: "fondo",
    PLATAFORMA: "plataforma",
    SOLIDO: "solido"
};

const TEMA_TILES_DEFAULT = "generico";
const ALTURA_PLATAFORMA_DEFAULT = 560;

function obtenerRutasTilesTema(tema = TEMA_TILES_DEFAULT) {
    return {
        piso: `assets/tiles/piso_${tema}.png`,
        bordeRotoIzq: `assets/tiles/borde_roto_izq_${tema}.png`,
        bordeRotoDer: `assets/tiles/borde_roto_der_${tema}.png`,
        trampaPivote: `assets/tiles/trampa_pivote_${tema}.png`
    };
}

function obtenerRutaPisoTema(tema = TEMA_TILES_DEFAULT, variante = null) {
    if (variante === null || variante === undefined) {
        return `assets/tiles/piso_${tema}.png`;
    }

    return `assets/tiles/piso_${tema}_${String(variante).padStart(2, "0")}.png`;
}

function crearPlataforma(x, ancho, tipo = TIPOS_PLATAFORMA.NORMAL, opciones = {}) {
    return {
        x,
        y: opciones.y || ALTURA_PLATAFORMA_DEFAULT,
        ancho,
        tipo,
        tieneHuecoDespues: Boolean(opciones.tieneHuecoDespues),
        anchoHueco: opciones.anchoHueco || 0
    };
}

function piso(x, ancho, opciones = {}) {
    return crearPlataforma(x, ancho, TIPOS_PLATAFORMA.NORMAL, opciones);
}

function pisoConHueco(x, ancho, anchoHueco = 128, opciones = {}) {
    return piso(x, ancho, {
        ...opciones,
        tieneHuecoDespues: true,
        anchoHueco
    });
}

function pivote(x, ancho, opciones = {}) {
    return crearPlataforma(x, ancho, TIPOS_PLATAFORMA.PIVOTE, opciones);
}

function pivoteConHueco(x, ancho, anchoHueco = 128, opciones = {}) {
    return pivote(x, ancho, {
        ...opciones,
        tieneHuecoDespues: true,
        anchoHueco
    });
}

function pisoResbaladizo(x, ancho, opciones = {}) {
    return crearPlataforma(x, ancho, TIPOS_PLATAFORMA.RESBALADIZO, opciones);
}

function pisoResbaladizoConHueco(x, ancho, anchoHueco = 128, opciones = {}) {
    return pisoResbaladizo(x, ancho, {
        ...opciones,
        tieneHuecoDespues: true,
        anchoHueco
    });
}

function obtenerRutaObjeto(tipo) {
    return `assets/props/${tipo}.png`;
}

// x, y son la esquina superior izquierda. La imagen se estira a ancho x alto.
function objeto(tipo, x, y, ancho, alto, modo = MODOS_OBJETO.FONDO) {
    return { tipo, x, y, ancho, alto, modo };
}

function obtenerPisoConfig(id) {
    return PISOS_CONFIG.find((piso) => piso.id === Number(id)) || PISOS_CONFIG[0];
}
