// ============================================================================
// NIVELES.JS — Configuración de los pisos del edificio (De arriba hacia Planta Baja)
// ============================================================================
// Historia: Te quedaste sin leche en tu departamento (Piso 20). Al salir al
// pasillo ocurre un colapso en el edificio y debes bajar piso por piso
// sorteando obstáculos hasta llegar a la Recepción (Planta Baja) y salir a la calle.
// Nota: admin.html reescribe este archivo al guardar tus cambios.
// ============================================================================

const PISOS_CONFIG = [
    {
        id: 1,
        nombre: "Piso 20: Tu Departamento (¡Sin Leche!)",
        fondoRuta: "assets/fondos/fondo_07_pasillo_departamentos.png",
        colorPlaceholder: "#2d3a34",
        tipoPiso: TIPOS_PISO.PARQUE,
        tilesTema: "pasillo_departamentos",
        tilesVariantes: 2,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO, TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.NEVERA, PROPS.ESCRITORIO, PROPS.CAJAS],
        objetos: [
            objeto("cajas", 864, 464, 96, 96, MODOS_OBJETO.FONDO)
        ],
        plataformas: [
            pisoConHueco(0, 384, 192),
            pisoConHueco(576, 384, 192),
            pisoConHueco(1152, 384, 192),
            pisoConHueco(1728, 480, 192),
            pisoConHueco(2400, 352, 192),
            piso(2944, 256)
        ]
    },
    {
        id: 2,
        nombre: "Piso 19: Cocina Comunitaria",
        fondoRuta: "assets/fondos/fondo_12_cocina.png",
        colorPlaceholder: "#3b4138",
        tipoPiso: TIPOS_PISO.AZULEJO,
        tilesTema: "lavanderia",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.RESBALADIZO, TRAMPAS.HUECO_ROTO],
        propsPermitidos: [PROPS.NEVERA, PROPS.TUBERIAS, PROPS.CAJAS],
        plataformas: [
            piso(0, 1090),
            pisoResbaladizoConHueco(1090, 446, 192),
            pisoConHueco(1728, 384, 192),
            piso(2304, 896)
        ]
    },
    {
        id: 3,
        nombre: "Piso 18: Sala Común de Vecinos",
        fondoRuta: "assets/fondos/fondo_11_sala.png",
        colorPlaceholder: "#3f3b2f",
        tipoPiso: TIPOS_PISO.PARQUE,
        tilesTema: "pasillo",
        tilesVariantes: 2,
        trampasHabilitadas: [TRAMPAS.RESBALADIZO, TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.ESCRITORIO, PROPS.NEVERA, PROPS.RADIADOR],
        plataformas: [
            pisoConHueco(0, 480, 192),
            piso(672, 458),
            pisoConHueco(1130, 470, 160),
            pisoConHueco(1760, 390, 186),
            piso(2336, 904)
        ]
    },
    {
        id: 4,
        nombre: "Piso 17: Lavandería Inundada",
        fondoRuta: "assets/fondos/fondo_17_lavanderia.png",
        colorPlaceholder: "#31464a",
        tipoPiso: TIPOS_PISO.AZULEJO,
        tilesTema: "lavanderia",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.RESBALADIZO, TRAMPAS.HUECO_ROTO],
        propsPermitidos: [PROPS.TUBERIAS, PROPS.CAJAS, PROPS.LAVABO],
        plataformas: [
            piso(0, 1130),
            pisoResbaladizoConHueco(1130, 470, 144),
            pisoConHueco(1744, 390, 662),
            pisoResbaladizo(2796, 444)
        ]
    },
    {
        id: 5,
        nombre: "Piso 16: Baños Antiguos",
        fondoRuta: "assets/fondos/fondo_05_banios.png",
        colorPlaceholder: "#2f4650",
        tipoPiso: TIPOS_PISO.AZULEJO,
        tilesTema: "banios",
        tilesVariantes: 1,
        trampasHabilitadas: [TRAMPAS.RESBALADIZO, TRAMPAS.HUECO_ROTO],
        propsPermitidos: [PROPS.LAVABO, PROPS.TUBERIAS],
        plataformas: [
            piso(0, 1130),
            pisoConHueco(1130, 470, 144),
            pisoConHueco(1744, 390, 662),
            pisoResbaladizo(2796, 444)
        ]
    },
    {
        id: 6,
        nombre: "Piso 15: Terraza Técnica",
        fondoRuta: "assets/fondos/fondo_10_terraza_tecnica.png",
        colorPlaceholder: "#26333a",
        tipoPiso: TIPOS_PISO.CONCRETO,
        tilesTema: "terraza_tecnica",
        tilesVariantes: 2,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO],
        propsPermitidos: [PROPS.TUBERIAS, PROPS.CAJAS, PROPS.CAMARA_SEGURIDAD],
        plataformas: [
            piso(0, 1090),
            pisoConHueco(1090, 470, 144),
            pisoConHueco(1704, 390, 662),
            piso(2756, 444)
        ]
    },
    {
        id: 7,
        nombre: "Piso 14: Enfermería del Edificio",
        fondoRuta: "assets/fondos/fondo_13_enfermeria.png",
        colorPlaceholder: "#33424a",
        tipoPiso: TIPOS_PISO.AZULEJO,
        tilesTema: "banios",
        tilesVariantes: 1,
        trampasHabilitadas: [TRAMPAS.RESBALADIZO],
        propsPermitidos: [PROPS.ARCHIVADOR, PROPS.LAVABO],
        plataformas: [
            piso(0, 1130),
            pisoConHueco(1130, 470, 144),
            pisoConHueco(1744, 390, 662),
            pisoResbaladizo(2796, 444)
        ]
    },
    {
        id: 8,
        nombre: "Piso 13: Biblioteca Técnica",
        fondoRuta: "assets/fondos/fondo_14_biblioteca.png",
        colorPlaceholder: "#3c3229",
        tipoPiso: TIPOS_PISO.PARQUE,
        tilesTema: "biblioteca",
        tilesVariantes: 2,
        trampasHabilitadas: [TRAMPAS.PIVOTE, TRAMPAS.HUECO_ROTO],
        propsPermitidos: [PROPS.ESTANTES, PROPS.ESCRITORIO],
        plataformas: [
            piso(0, 1090),
            pisoConHueco(1090, 470, 144),
            pisoConHueco(1704, 390, 662),
            piso(2756, 444)
        ]
    },
    {
        id: 9,
        nombre: "Piso 12: Pasillo Ejecutivo",
        fondoRuta: "assets/fondos/fondo_15_pasillo_ejecutivo.png",
        colorPlaceholder: "#2f353d",
        tipoPiso: TIPOS_PISO.PARQUE,
        tilesTema: "pasillo_ejecutivo",
        tilesVariantes: 2,
        trampasHabilitadas: [TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.ESCRITORIO, PROPS.ARCHIVADOR, PROPS.CAMARA_SEGURIDAD],
        plataformas: [
            piso(0, 1130),
            pisoResbaladizoConHueco(1130, 470, 144),
            pisoConHueco(1744, 390, 662),
            pisoResbaladizo(2796, 444)
        ]
    },
    {
        id: 10,
        nombre: "Piso 11: Oficinas Abandonadas",
        fondoRuta: "assets/fondos/fondo_09_oficinas_abandonadas.png",
        colorPlaceholder: "#353932",
        tipoPiso: TIPOS_PISO.LINOLEO,
        tilesTema: "oficinas_abandonadas",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO, TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.ARCHIVADOR, PROPS.ESCRITORIO, PROPS.PLANTA_SECA],
        plataformas: [
            piso(0, 1130),
            pisoResbaladizoConHueco(1130, 470, 144),
            pisoConHueco(1744, 390, 662),
            pisoResbaladizo(2796, 444)
        ]
    },
    {
        id: 11,
        nombre: "Piso 10: Archivo Central",
        fondoRuta: "assets/fondos/fondo_02_archivo.png",
        colorPlaceholder: "#30342d",
        tipoPiso: TIPOS_PISO.LINOLEO,
        tilesTema: "archivo",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO],
        propsPermitidos: [PROPS.ARCHIVADOR, PROPS.ESTANTES, PROPS.CAJAS],
        plataformas: [
            piso(0, 1090),
            pisoConHueco(1090, 446, 192),
            pisoConHueco(1728, 384, 192),
            piso(2304, 896)
        ]
    },
    {
        id: 12,
        nombre: "Piso 09: Almacén de Limpieza",
        fondoRuta: "assets/fondos/fondo_08_almacen_limpieza.png",
        colorPlaceholder: "#3a4035",
        tipoPiso: TIPOS_PISO.CONCRETO,
        tilesTema: "mantenimiento",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.RESBALADIZO],
        propsPermitidos: [PROPS.CAJAS, PROPS.TUBERIAS, PROPS.EXTINTOR],
        plataformas: [
            piso(0, 1090),
            pisoConHueco(1090, 470, 144),
            pisoConHueco(1704, 390, 662),
            piso(2756, 444)
        ]
    },
    {
        id: 13,
        nombre: "Piso 08: Sala de Servidores",
        fondoRuta: "assets/fondos/fondo_19_servidores.png",
        colorPlaceholder: "#263846",
        tipoPiso: TIPOS_PISO.LINOLEO,
        tilesTema: "archivo",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.CAMARA_SEGURIDAD, PROPS.TUBERIAS],
        plataformas: [
            piso(0, 1130),
            pisoConHueco(1130, 470, 144),
            pisoConHueco(1744, 390, 662),
            pisoResbaladizo(2796, 444)
        ]
    },
    {
        id: 14,
        nombre: "Piso 07: Cuarto Eléctrico",
        fondoRuta: "assets/fondos/fondo_16_cuarto_electrico.png",
        colorPlaceholder: "#2b3840",
        tipoPiso: TIPOS_PISO.CONCRETO,
        tilesTema: "mantenimiento",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO],
        propsPermitidos: [PROPS.TUBERIAS, PROPS.CAJAS, PROPS.CAMARA_SEGURIDAD],
        plataformas: [
            piso(0, 1090),
            pisoConHueco(1090, 470, 144),
            pisoConHueco(1704, 390, 662),
            piso(2756, 444)
        ]
    },
    {
        id: 15,
        nombre: "Piso 06: Pasillo de Mantenimiento",
        fondoRuta: "assets/fondos/fondo_18_mantenimiento.png",
        colorPlaceholder: "#2d3530",
        tipoPiso: TIPOS_PISO.CONCRETO,
        tilesTema: "mantenimiento",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO, TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.TUBERIAS, PROPS.CAJAS, PROPS.CAMARA_SEGURIDAD],
        plataformas: [
            piso(0, 1090),
            pisoResbaladizoConHueco(1090, 470, 144),
            pisoConHueco(1704, 390, 662),
            piso(2756, 444)
        ]
    },
    {
        id: 16,
        nombre: "Piso 05: Pasillo de Servicio",
        fondoRuta: "assets/fondos/fondo_03_pasillo_servicio.png",
        colorPlaceholder: "#29363d",
        tipoPiso: TIPOS_PISO.CONCRETO,
        tilesTema: "mantenimiento",
        tilesVariantes: 2,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO, TRAMPAS.RESBALADIZO],
        propsPermitidos: [PROPS.TUBERIAS, PROPS.CAJAS, PROPS.CAMARA_SEGURIDAD],
        plataformas: [
            piso(0, 1090),
            pisoConHueco(1090, 470, 144),
            pisoConHueco(1704, 390, 662),
            piso(2756, 444)
        ]
    },
    {
        id: 17,
        nombre: "Piso 04: Cuarto de Calderas",
        fondoRuta: "assets/fondos/fondo_20_cuarto_calderas.png",
        colorPlaceholder: "#402f2a",
        tipoPiso: TIPOS_PISO.CONCRETO,
        tilesTema: "mantenimiento",
        tilesVariantes: 3,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO, TRAMPAS.PIVOTE, TRAMPAS.RESBALADIZO],
        propsPermitidos: [PROPS.TUBERIAS, PROPS.CAJAS, PROPS.RADIADOR],
        plataformas: [
            piso(0, 1090),
            pisoConHueco(1090, 470, 144),
            pisoConHueco(1704, 390, 662),
            piso(2756, 444)
        ]
    },
    {
        id: 18,
        nombre: "Piso 03: Sótano de Máquinas",
        fondoRuta: "assets/fondos/fondo_01_sotano.png",
        colorPlaceholder: "#2d3a34",
        tipoPiso: TIPOS_PISO.LINOLEO,
        tilesTema: "sotano",
        tilesVariantes: 2,
        trampasHabilitadas: [TRAMPAS.HUECO_ROTO],
        propsPermitidos: [PROPS.ARCHIVADOR, PROPS.ESCRITORIO, PROPS.CAMARA_SEGURIDAD],
        plataformas: [
            piso(0, 1090),
            pisoConHueco(1090, 470, 144),
            pisoConHueco(1704, 390, 662),
            piso(2756, 444)
        ]
    },
    {
        id: 19,
        nombre: "Piso 02: Entrepiso Principal",
        fondoRuta: "assets/fondos/fondo_06_pasillo.png",
        colorPlaceholder: "#3e3833",
        tipoPiso: TIPOS_PISO.PARQUE,
        tilesTema: "pasillo",
        tilesVariantes: 2,
        trampasHabilitadas: [TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.ESCRITORIO, PROPS.ARCHIVADOR],
        plataformas: [
            piso(0, 1090),
            pisoResbaladizoConHueco(1090, 470, 144),
            pisoConHueco(1704, 390, 662),
            piso(2756, 444)
        ]
    },
    {
        id: 20,
        nombre: "Planta Baja: Recepción y Salida a la Calle",
        fondoRuta: "assets/fondos/fondo_04_recepcion.png",
        colorPlaceholder: "#394032",
        tipoPiso: TIPOS_PISO.PARQUE,
        tilesTema: "recepcion",
        tilesVariantes: 2,
        trampasHabilitadas: [TRAMPAS.PIVOTE],
        propsPermitidos: [PROPS.ESCRITORIO, PROPS.ARCHIVADOR, PROPS.CAMARA_SEGURIDAD],
        plataformas: [
            piso(0, 1090),
            pisoConHueco(1090, 470, 144),
            pisoConHueco(1704, 390, 662),
            piso(2756, 444)
        ]
    }
];
