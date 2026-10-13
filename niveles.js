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

function crearPlataformasBase(variante = 0) {
    const desplazamiento = variante % 2 === 0 ? 0 : 40;
    const pisoDelMedio = variante % 3 === 0 ? pisoResbaladizoConHueco : pisoConHueco;
    const pisoFinal = variante % 2 === 0 ? piso : pisoResbaladizo;

    console.log("DESPLAZAMIENTO: ", desplazamiento)
    console.log("MEDIO: ", pisoDelMedio)
    console.log("FINAL: ", pisoFinal)

    return [
        pisoConHueco(0, 1090 + desplazamiento, 128),
        // pivoteConHueco(648 + desplazamiento, 330, 112),
        pisoDelMedio(1090 + desplazamiento, 470, 144),
        pisoConHueco(1704 + desplazamiento, 390, 128),
        pisoFinal(2756 + desplazamiento, 444)
    ];
}

const PISOS_CONFIG = [
    {
        id: 1,
        nombre: "Piso 01: Sotano de Oficinas",
        fondoRuta: "assets/fondos/fondo_01_sotano.png",
        colorPlaceholder: "#2d3a34",
        tipoPiso: TIPOS_PISO.LINOLEO,
        tilesTema: "sotano",
        tilesVariantes: 2, // cantidada de imagenes de pisos
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO],
        propsPermitidos: [PROPS.ARCHIVADOR, PROPS.ESCRITORIO, PROPS.CAMARA_SEGURIDAD],
        // plataformas: crearPlataformasBase(1)
        plataformas: [
            piso(0, 3200),
        ]
    },
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
        plataformas: crearPlataformasBase(2)
    },
    {
        id: 3,
        nombre: "Piso 03: Pasillo de Servicio",
        fondoRuta: "assets/fondos/fondo_03_pasillo_servicio.png",
        colorPlaceholder: "#29363d",
        tipoPiso: TIPOS_PISO.CONCRETO,
        tilesTema: "mantenimiento",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO, TRAMPAS.RESBALADIZO],
        propsPermitidos: [PROPS.TUBERIAS, PROPS.CAJAS, PROPS.CAMARA_SEGURIDAD],
        plataformas: crearPlataformasBase(3)
    },
    {
        id: 4,
        nombre: "Piso 04: Recepcion Cerrada",
        fondoRuta: "assets/fondos/fondo_04_recepcion.png",
        colorPlaceholder: "#394032",
        tipoPiso: TIPOS_PISO.PARQUE,
        tilesTema: "recepcion",
        tilesVariantes: 2,
        trampasHabilitadas: [TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.ESCRITORIO, PROPS.ARCHIVADOR, PROPS.CAMARA_SEGURIDAD],
        plataformas: crearPlataformasBase(4)
    },
    {
        id: 5,
        nombre: "Piso 05: Banios Antiguos",
        fondoRuta: "assets/fondos/fondo_05_banios.png",
        colorPlaceholder: "#2f4650",
        tipoPiso: TIPOS_PISO.AZULEJO,
        tilesTema: "banios",
        tilesVariantes: 1,
        trampasHabilitadas: [TRAMPAS.RESBALADIZO, TRAMPAS.HUECO_ROTO],
        propsPermitidos: [PROPS.LAVABO, PROPS.TUBERIAS],
        plataformas: crearPlataformasBase(5)
    },
    {
        id: 6,
        nombre: "Piso 06: Pasillo Principal",
        fondoRuta: "assets/fondos/fondo_06_pasillo.png",
        colorPlaceholder: "#3e3833",
        tipoPiso: TIPOS_PISO.PARQUE,
        tilesTema: "pasillo",
        tilesVariantes: 2,
        trampasHabilitadas: [TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.ESCRITORIO, PROPS.ARCHIVADOR],
        plataformas: crearPlataformasBase(6)
    },
    {
        id: 7,
        nombre: "Piso 07: Pasillo Departamentos",
        fondoRuta: "assets/fondos/fondo_07_pasillo_departamentos.png",
        colorPlaceholder: "#2d3a34",
        tipoPiso: TIPOS_PISO.LINOLEO,
        tilesTema: "pasillo_departamentos",
        tilesVariantes: 2,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO, TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.ARCHIVADOR, PROPS.ESCRITORIO, PROPS.CAMARA_SEGURIDAD],
        plataformas: crearPlataformasBase(7)
    },
    {
        id: 8,
        nombre: "Piso 08: Almacen de Limpieza",
        fondoRuta: "assets/fondos/fondo_08_almacen_limpieza.png",
        colorPlaceholder: "#3a4035",
        tipoPiso: TIPOS_PISO.CONCRETO,
        tilesTema: "mantenimiento",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.RESBALADIZO],
        propsPermitidos: [PROPS.CAJAS, PROPS.TUBERIAS, PROPS.EXTINTOR],
        plataformas: crearPlataformasBase(8)
    },
    {
        id: 9,
        nombre: "Piso 09: Oficinas Abandonadas",
        fondoRuta: "assets/fondos/fondo_09_oficinas_abandonadas.png",
        colorPlaceholder: "#353932",
        tipoPiso: TIPOS_PISO.LINOLEO,
        tilesTema: "oficinas_abandonadas",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO, TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.ARCHIVADOR, PROPS.ESCRITORIO, PROPS.PLANTA_SECA],
        plataformas: crearPlataformasBase(9)
    },
    {
        id: 10,
        nombre: "Piso 10: Terraza Tecnica",
        fondoRuta: "assets/fondos/fondo_10_terraza_tecnica.png",
        colorPlaceholder: "#26333a",
        tipoPiso: TIPOS_PISO.CONCRETO,
        tilesTema: "terraza_tecnica",
        tilesVariantes: 2,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO],
        propsPermitidos: [PROPS.TUBERIAS, PROPS.CAJAS, PROPS.CAMARA_SEGURIDAD],
        plataformas: crearPlataformasBase(10)
    },
    {
        id: 11,
        nombre: "Piso 11: Sala Comun",
        fondoRuta: "assets/fondos/fondo_11_sala.png",
        colorPlaceholder: "#3f3b2f",
        tipoPiso: TIPOS_PISO.AZULEJO,
        tilesTema: "banios",
        tilesVariantes: 1,
        trampasHabilitadas: [TRAMPAS.RESBALADIZO, TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.ESCRITORIO, PROPS.NEVERA, PROPS.RADIADOR],
        plataformas: crearPlataformasBase(11)
    },
    {
        id: 12,
        nombre: "Piso 12: Cocina Antigua",
        fondoRuta: "assets/fondos/fondo_12_cocina.png",
        colorPlaceholder: "#3b4138",
        tipoPiso: TIPOS_PISO.AZULEJO,
        tilesTema: "lavanderia",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.RESBALADIZO, TRAMPAS.HUECO_ROTO],
        propsPermitidos: [PROPS.NEVERA, PROPS.TUBERIAS, PROPS.CAJAS],
        plataformas: crearPlataformasBase(12)
    },
    {
        id: 13,
        nombre: "Piso 13: Enfermeria",
        fondoRuta: "assets/fondos/fondo_13_enfermeria.png",
        colorPlaceholder: "#33424a",
        tipoPiso: TIPOS_PISO.AZULEJO,
        tilesTema: "banios",
        tilesVariantes: 1,
        trampasHabilitadas: [TRAMPAS.RESBALADIZO],
        propsPermitidos: [PROPS.ARCHIVADOR, PROPS.LAVABO],
        plataformas: crearPlataformasBase(13)
    },
    {
        id: 14,
        nombre: "Piso 14: Biblioteca Tecnica",
        fondoRuta: "assets/fondos/fondo_14_biblioteca.png",
        colorPlaceholder: "#3c3229",
        tipoPiso: TIPOS_PISO.PARQUE,
        tilesTema: "biblioteca",
        tilesVariantes: 2,
        trampasHabilitadas: [TRAMPAS.PIVOTE, TRAMPAS.HUECO_ROTO],
        propsPermitidos: [PROPS.ESTANTES, PROPS.ESCRITORIO],
        plataformas: crearPlataformasBase(14)
    },
    {
        id: 15,
        nombre: "Piso 15: Pasillo Ejecutivo",
        fondoRuta: "assets/fondos/fondo_15_pasillo_ejecutivo.png",
        colorPlaceholder: "#2f353d",
        tipoPiso: TIPOS_PISO.PARQUE,
        tilesTema: "pasillo_ejecutivo",
        tilesVariantes: 2,
        trampasHabilitadas: [TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.ESCRITORIO, PROPS.ARCHIVADOR, PROPS.CAMARA_SEGURIDAD],
        plataformas: crearPlataformasBase(15)
    },
    {
        id: 16,
        nombre: "Piso 16: Cuarto Electrico",
        fondoRuta: "assets/fondos/fondo_16_cuarto_electrico.png",
        colorPlaceholder: "#2b3840",
        tipoPiso: TIPOS_PISO.CONCRETO,
        tilesTema: "mantenimiento",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO],
        propsPermitidos: [PROPS.TUBERIAS, PROPS.CAJAS, PROPS.CAMARA_SEGURIDAD],
        plataformas: crearPlataformasBase(16)
    },
    {
        id: 17,
        nombre: "Piso 17: Lavanderia",
        fondoRuta: "assets/fondos/fondo_17_lavanderia.png",
        colorPlaceholder: "#31464a",
        tipoPiso: TIPOS_PISO.AZULEJO,
        tilesTema: "lavanderia",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.RESBALADIZO, TRAMPAS.HUECO_ROTO],
        propsPermitidos: [PROPS.TUBERIAS, PROPS.CAJAS],
        plataformas: crearPlataformasBase(17)
    },
    {
        id: 18,
        nombre: "Piso 18: Pasillo de Mantenimiento",
        fondoRuta: "assets/fondos/fondo_18_mantenimiento.png",
        colorPlaceholder: "#2d3530",
        tipoPiso: TIPOS_PISO.CONCRETO,
        tilesTema: "mantenimiento",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO, TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.TUBERIAS, PROPS.CAJAS, PROPS.CAMARA_SEGURIDAD],
        plataformas: crearPlataformasBase(18)
    },
    {
        id: 19,
        nombre: "Piso 19: Sala de Servidores",
        fondoRuta: "assets/fondos/fondo_19_servidores.png",
        colorPlaceholder: "#263846",
        tipoPiso: TIPOS_PISO.LINOLEO,
        tilesTema: "archivo",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.CAMARA_SEGURIDAD, PROPS.TUBERIAS],
        plataformas: crearPlataformasBase(19)
    },
    {
        id: 20,
        nombre: "Piso 20: Cuarto de Calderas",
        fondoRuta: "assets/fondos/fondo_20_cuarto_calderas.png",
        colorPlaceholder: "#402f2a",
        tipoPiso: TIPOS_PISO.CONCRETO,
        tilesTema: "mantenimiento",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO, TRAMPAS.PIVOTE, TRAMPAS.RESBALADIZO],
        propsPermitidos: [PROPS.TUBERIAS, PROPS.CAJAS, PROPS.RADIADOR],
        plataformas: crearPlataformasBase(20)
    }
];

function obtenerPisoConfig(id) {
    return PISOS_CONFIG.find((piso) => piso.id === Number(id)) || PISOS_CONFIG[0];
}
