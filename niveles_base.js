// ============================================================================
// NIVELES_BASE.JS — Constantes, constructores y utilidades de niveles
// ============================================================================
// Define los tipos de pisos, plataformas, trampas, botones/interruptores,
// coleccionables y objetos. Los datos de cada piso están en niveles.js,
// que es el archivo que reescribe admin.html al guardar.
// ============================================================================

const TIPOS_PISO = {
    LINOLEO: "linoleo",
    PARQUE: "parque",
    CONCRETO: "concreto",
    AZULEJO: "azulejo"
};

const TIPOS_PLATAFORMA = {
    NORMAL: "normal",           // Piso o plataforma firme común
    PIVOTE: "pivote",           // Plataforma floja que gira al pisarla
    RESBALADIZO: "resbaladizo", // Piso mojado / jabonoso con inercia
    QUEBRADIZO: "quebradizo",   // Tablón / losa que tiembla, cae y se regenera
    MOVIL: "movil",             // Montacargas o plataforma móvil en eje X o Y
    CINTA: "cinta",             // Cinta transportadora que empuja al jugador
    REBOTE: "rebote"            // Colchón / sillón / resorte que impulsa alto
};

const TRAMPAS = {
    HUECO_ROTO: "hueco_roto",
    PIVOTE: "pivote",
    RESBALADIZO: "resbaladizo",
    QUEBRADIZO: "quebradizo",
    PINCHOS: "pinchos",
    VAPOR: "vapor",
    LASER: "laser",
    APLASTADOR: "aplastador",
    SIERRA: "sierra"
};

const TIPOS_TRAMPA_ACTIVA = {
    PINCHOS: "pinchos",         // Cables eléctricos pelados / escombros filosos
    VAPOR: "vapor",             // Caño roto con chorro de vapor/agua caliente por ciclos
    LASER: "laser",             // Alarma láser de seguridad (horizontal o vertical)
    APLASTADOR: "aplastador",   // Archivador / bloque pesado que cae del techo
    SIERRA: "sierra"            // Chispa eléctrica / ventilador móvil patrullando en X o Y
};

const TIPOS_ITEM = {
    VIDA: "vida",               // Cartón de leche / Café / Corazón (+1 ♥ de vida)
    DOBLE_SALTO: "doble_salto", // Poder desbloqueable de Doble Salto en el aire
    TARJETA: "tarjeta",         // Llave / Tarjeta del edificio para abrir la salida del piso
    CAFE: "cafe"                // Alias compatible de vida extra (+1 ♥)
};

const TIPOS_INTERRUPTOR = {
    BOTON_PISO: "boton_piso",   // Botón de presión en el suelo (se activa al pisarlo)
    PALANCA: "palanca",         // Tablero eléctrico / palanca de pared (se activa al tocar)
    VALVULA: "valvula"          // Llave de paso de tubería (corta el vapor o despliega puentes)
};

const MODOS_INTERRUPTOR = {
    ACTIVAR: "activar",         // Queda encendido permanentemente al tocarlo
    ALTERNAR: "alternar",       // Cambia entre encendido y apagado cada vez que se toca
    TIEMPO: "tiempo",           // Se mantiene activo durante duracionMs y luego se apaga
    TEMPORIZADO: "tiempo"       // Alias compatible con temporizador
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

// Modos de colisión de los objetos colocados en el escenario:
// - fondo: solo decorativo (no tiene colisión).
// - plataforma: se puede pisar por arriba y atravesar de costado o bajar con Abajo+Espacio.
// - solido: bloquea por arriba, de costado y desde abajo (ej. heladera, cajas grandes).
const MODOS_OBJETO = {
    FONDO: "fondo",
    PLATAFORMA: "plataforma",
    SOLIDO: "solido"
};

const TEMA_TILES_DEFAULT = "generico";
const ALTURA_PLATAFORMA_DEFAULT = 600;

// ============================================================================
// 1. CONSTRUCTORES DE PLATAFORMAS
// ============================================================================

function crearPlataforma(x, ancho, tipo = TIPOS_PLATAFORMA.NORMAL, opciones = {}) {
    const plat = {
        x: Math.round(x),
        y: opciones.y ?? ALTURA_PLATAFORMA_DEFAULT,
        ancho: Math.round(ancho),
        tipo,
        tieneHuecoDespues: Boolean(opciones.tieneHuecoDespues),
        anchoHueco: opciones.anchoHueco || 0
    };

    if (opciones.flotante) plat.flotante = true;
    if (opciones.movil) {
        plat.movil = {
            eje: opciones.movil.eje || "x",
            rango: opciones.movil.rango ?? 140,
            velocidad: opciones.movil.velocidad ?? 2.1,
            fase: opciones.movil.fase ?? 0
        };
    }
    if (opciones.velocidadCinta !== undefined) {
        plat.velocidadCinta = opciones.velocidadCinta;
    }
    if (opciones.fuerzaRebote !== undefined) {
        plat.fuerzaRebote = opciones.fuerzaRebote;
    }
    // Vinculación opcional con un Botón / Interruptor:
    // - canal: identificador del botón que controla esta plataforma (ej. "1", "puente")
    // - ocultaInicial: si es true, la plataforma empieza apagada/invisible hasta activar el botón
    if (opciones.canal) {
        plat.canal = String(opciones.canal).trim();
    }
    if (opciones.ocultaInicial) {
        plat.ocultaInicial = true;
    }

    return plat;
}

function piso(x, ancho, opciones = {}) {
    return crearPlataforma(x, ancho, TIPOS_PLATAFORMA.NORMAL, opciones);
}

function pisoConHueco(x, ancho, anchoHueco = 128, opciones = {}) {
    return piso(x, ancho, { ...opciones, tieneHuecoDespues: true, anchoHueco });
}

function pivote(x, ancho, opciones = {}) {
    return crearPlataforma(x, ancho, TIPOS_PLATAFORMA.PIVOTE, opciones);
}

function pivoteConHueco(x, ancho, anchoHueco = 128, opciones = {}) {
    return pivote(x, ancho, { ...opciones, tieneHuecoDespues: true, anchoHueco });
}

function pisoResbaladizo(x, ancho, opciones = {}) {
    return crearPlataforma(x, ancho, TIPOS_PLATAFORMA.RESBALADIZO, opciones);
}

function pisoResbaladizoConHueco(x, ancho, anchoHueco = 128, opciones = {}) {
    return pisoResbaladizo(x, ancho, { ...opciones, tieneHuecoDespues: true, anchoHueco });
}

function pisoQuebradizo(x, ancho, opciones = {}) {
    return crearPlataforma(x, ancho, TIPOS_PLATAFORMA.QUEBRADIZO, opciones);
}

function pisoQuebradizoConHueco(x, ancho, anchoHueco = 128, opciones = {}) {
    return pisoQuebradizo(x, ancho, { ...opciones, tieneHuecoDespues: true, anchoHueco });
}

function plataformaFlotante(x, y, ancho, tipo = TIPOS_PLATAFORMA.NORMAL, opciones = {}) {
    return crearPlataforma(x, ancho, tipo, {
        ...opciones,
        y,
        flotante: true,
        tieneHuecoDespues: false,
        anchoHueco: 0
    });
}

function plataformaMovil(x, y, ancho, opcionesMovil = {}, opciones = {}) {
    return crearPlataforma(x, ancho, TIPOS_PLATAFORMA.MOVIL, {
        ...opciones,
        y,
        flotante: true,
        movil: {
            eje: opcionesMovil.eje || "x",
            rango: opcionesMovil.rango ?? 140,
            velocidad: opcionesMovil.velocidad ?? 2.1,
            fase: opcionesMovil.fase ?? 0
        }
    });
}

function cintaTransportadora(x, ancho, velocidadCinta = 2.6, opciones = {}) {
    return crearPlataforma(x, ancho, TIPOS_PLATAFORMA.CINTA, {
        ...opciones,
        velocidadCinta
    });
}

function plataformaRebote(x, y, ancho = 96, fuerzaRebote = 1.38, opciones = {}) {
    return crearPlataforma(x, ancho, TIPOS_PLATAFORMA.REBOTE, {
        ...opciones,
        y: y ?? ALTURA_PLATAFORMA_DEFAULT,
        fuerzaRebote
    });
}

// ============================================================================
// 2. CONSTRUCTORES DE TRAMPAS, BOTONES/INTERRUPTORES, ITEMS, CHECKPOINTS Y META
// ============================================================================

function trampa(tipo, x, y, ancho = 64, alto = 48, opciones = {}) {
    const obj = {
        tipo: tipo || TIPOS_TRAMPA_ACTIVA.PINCHOS,
        x: Math.round(x),
        y: Math.round(y),
        ancho: Math.max(16, Math.round(ancho)),
        alto: Math.max(16, Math.round(alto)),
        orientacion: opciones.orientacion || "arriba",
        intervaloMs: opciones.intervaloMs ?? 2200,
        duracionMs: opciones.duracionMs ?? 1100,
        avisoMs: opciones.avisoMs ?? 550,
        desfaseMs: opciones.desfaseMs ?? 0,
        eje: opciones.eje || "x",
        rango: opciones.rango ?? 140,
        velocidad: opciones.velocidad ?? 2.6
    };
    if (opciones.canal) obj.canal = String(opciones.canal).trim();
    if (opciones.imagen) obj.imagen = opciones.imagen;
    return obj;
}

function interruptor(x, y, canal = "1", opciones = {}) {
    const estilo = opciones.estilo || opciones.tipo || TIPOS_INTERRUPTOR.BOTON_PISO;
    const esBotonPiso = estilo === TIPOS_INTERRUPTOR.BOTON_PISO;
    const modoCrudo = opciones.modo || MODOS_INTERRUPTOR.ACTIVAR;
    const modo = modoCrudo === "permanente"
        ? MODOS_INTERRUPTOR.ACTIVAR
        : (modoCrudo === "temporal" || modoCrudo === "temporizado")
            ? MODOS_INTERRUPTOR.TIEMPO
            : modoCrudo;
    const obj = {
        x: Math.round(x),
        y: Math.round(y),
        ancho: opciones.ancho || (esBotonPiso ? 52 : 44),
        alto: opciones.alto || (esBotonPiso ? 22 : 56),
        canal: String(canal || "1").trim(),
        estilo,
        tipo: estilo,
        modo,
        duracionMs: opciones.duracionMs ?? 5000
    };
    if (opciones.etiqueta) obj.etiqueta = String(opciones.etiqueta);
    if (opciones.imagen) obj.imagen = opciones.imagen;
    return obj;
}

function item(tipo, x, y, opciones = {}) {
    const obj = {
        tipo: tipo || TIPOS_ITEM.VIDA,
        x: Math.round(x),
        y: Math.round(y),
        ancho: opciones.ancho || 40,
        alto: opciones.alto || 40
    };
    if (opciones.imagen) obj.imagen = opciones.imagen;
    return obj;
}

function checkpoint(x, y, opciones = {}) {
    const obj = {
        x: Math.round(x),
        y: Math.round(y),
        ancho: opciones.ancho || 48,
        alto: opciones.alto || 110,
        nombre: opciones.nombre || "Descanso"
    };
    if (opciones.imagen) obj.imagen = opciones.imagen;
    return obj;
}

function metaPiso(x, y, opciones = {}) {
    const obj = {
        x: Math.round(x),
        y: Math.round(y),
        ancho: opciones.ancho || 92,
        alto: opciones.alto || 144,
        requiereLlave: Boolean(opciones.requiereLlave),
        etiqueta: opciones.etiqueta || "BAJAR ▼"
    };
    if (opciones.imagen) obj.imagen = opciones.imagen;
    return obj;
}

function objeto(tipo, x, y, ancho, alto, modo = MODOS_OBJETO.FONDO, opciones = {}) {
    const obj = { tipo, x, y, ancho, alto, modo };
    if (opciones.imagen) obj.imagen = opciones.imagen;
    return obj;
}

// ============================================================================
// 3. RESOLUCIÓN DE RUTAS DE IMAGEN (TILES, OBJETOS, TRAMPAS, BOTONES, ITEMS)
// ============================================================================

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

function obtenerRutaObjeto(tipo, imagenPersonalizada = "") {
    if (imagenPersonalizada) return imagenPersonalizada;
    return `assets/props/${tipo}.png`;
}

function obtenerRutaTrampa(trampaObj) {
    if (trampaObj?.imagen) return trampaObj.imagen;
    return `assets/trampas/${trampaObj?.tipo || "pinchos"}.png`;
}

function obtenerRutaItem(itemObj) {
    if (itemObj?.imagen) return itemObj.imagen;
    const tipo = itemObj?.tipo === TIPOS_ITEM.CAFE ? TIPOS_ITEM.VIDA : (itemObj?.tipo || TIPOS_ITEM.VIDA);
    return `assets/items/${tipo}.png`;
}

function obtenerRutaInterruptor(intObj) {
    if (intObj?.imagen) return intObj.imagen;
    return `assets/props/${intObj?.estilo || intObj?.tipo || "boton_piso"}.png`;
}

// ============================================================================
// 4. CATÁLOGO DE OBJETOS Y CÁLCULO DE CAJAS DE COLISIÓN
// ============================================================================

function tipoObjeto(id, nombre, ancho, alto, modo = MODOS_OBJETO.SOLIDO, opciones = {}) {
    const margenes = opciones.margenes || {};
    return {
        id,
        nombre: nombre || id,
        ancho,
        alto,
        modo,
        margenes: {
            izquierda: margenes.izquierda || 0,
            derecha: margenes.derecha || 0,
            arriba: margenes.arriba || 0
        }
    };
}

let catalogoObjetosPrueba = null;

function obtenerCatalogoObjetos() {
    if (catalogoObjetosPrueba) return catalogoObjetosPrueba;
    return typeof CATALOGO_OBJETOS !== "undefined" ? CATALOGO_OBJETOS : [];
}

function buscarTipoObjeto(id, catalogo = obtenerCatalogoObjetos()) {
    return catalogo.find((tipo) => tipo.id === id) || null;
}

function cajaColisionObjeto(objeto, catalogo = obtenerCatalogoObjetos()) {
    const tipo = buscarTipoObjeto(objeto.tipo, catalogo);
    const m = tipo?.margenes;
    if (!m || (!m.izquierda && !m.derecha && !m.arriba)) {
        return { x: objeto.x, y: objeto.y, ancho: objeto.ancho, alto: objeto.alto };
    }

    const escalaX = objeto.ancho / (tipo.ancho || objeto.ancho);
    const escalaY = objeto.alto / (tipo.alto || objeto.alto);
    const izquierda = Math.round(m.izquierda * escalaX);
    const arriba = Math.round(m.arriba * escalaY);
    return {
        x: objeto.x + izquierda,
        y: objeto.y + arriba,
        ancho: Math.max(1, objeto.ancho - izquierda - Math.round(m.derecha * escalaX)),
        alto: Math.max(1, objeto.alto - arriba)
    };
}

function obtenerPisoConfig(id) {
    return PISOS_CONFIG.find((piso) => piso.id === Number(id)) || PISOS_CONFIG[0];
}

function decorarPisoFase2(pisoObj) {
    if (!pisoObj || !Array.isArray(pisoObj.plataformas)) return pisoObj;
    const platBase = pisoObj.plataformas.filter((p) => !p.flotante);
    const ultimaPlat = platBase[platBase.length - 1] || { x: 0, y: ALTURA_PLATAFORMA_DEFAULT, ancho: 1366 };
    const finPisoX = Math.max(1800, ultimaPlat.x + ultimaPlat.ancho);
    const pisoY = ultimaPlat.y || ALTURA_PLATAFORMA_DEFAULT;
    const idPiso = Number(pisoObj.id) || 1;
    const estilosSw = [TIPOS_INTERRUPTOR.BOTON_PISO, TIPOS_INTERRUPTOR.PALANCA, TIPOS_INTERRUPTOR.VALVULA];
    const estiloElegido = estilosSw[(idPiso - 1) % estilosSw.length];
    const altoSw = estiloElegido === TIPOS_INTERRUPTOR.BOTON_PISO ? 22 : 56;

    pisoObj.plataformas = [
        ...platBase,
        plataformaFlotante(Math.round(finPisoX * 0.25), pisoY - 135, 160, idPiso % 2 === 0 ? TIPOS_PLATAFORMA.QUEBRADIZO : TIPOS_PLATAFORMA.NORMAL),
        plataformaMovil(Math.round(finPisoX * 0.52), pisoY - 145, 148, {
            eje: idPiso % 3 === 0 ? "y" : "x",
            rango: idPiso % 3 === 0 ? 75 : 130,
            velocidad: 2.0
        }, { canal: "A", ocultaInicial: idPiso % 2 === 0 }),
        idPiso % 2 === 1
            ? plataformaRebote(Math.round(finPisoX * 0.74), pisoY - 18, 96, 1.36, { flotante: true })
            : cintaTransportadora(Math.round(finPisoX * 0.72), 220, idPiso % 4 === 0 ? -2.7 : 2.7, { y: pisoY - 125, flotante: true, canal: "A" })
    ];

    pisoObj.interruptores = [
        interruptor(Math.round(finPisoX * 0.31), pisoY - altoSw, "A", {
            estilo: estiloElegido,
            modo: idPiso % 4 === 0 ? MODOS_INTERRUPTOR.TIEMPO : MODOS_INTERRUPTOR.ALTERNAR,
            duracionMs: 6000,
            etiqueta: "CANAL A"
        })
    ];

    pisoObj.trampas = [
        trampa(TIPOS_TRAMPA_ACTIVA.LASER, Math.round(finPisoX * 0.18), pisoY - 134, 130, 24, { orientacion: "horizontal" }),
        trampa(TIPOS_TRAMPA_ACTIVA.VAPOR, Math.round(finPisoX * 0.37), pisoY - 130, 48, 130, { orientacion: "arriba", canal: "A" }),
        trampa(TIPOS_TRAMPA_ACTIVA.SIERRA, Math.round(finPisoX * 0.54), pisoY - 52, 52, 52, { eje: "x", rango: 120, velocidad: 2.3 }),
        trampa(TIPOS_TRAMPA_ACTIVA.APLASTADOR, Math.round(finPisoX * 0.68), pisoY - 230, 72, 84, { rango: 146 }),
        trampa(TIPOS_TRAMPA_ACTIVA.PINCHOS, Math.round(finPisoX * 0.83), pisoY - 26, 88, 26, { orientacion: "arriba" })
    ];

    pisoObj.checkpoints = [
        checkpoint(Math.round(finPisoX * 0.45), pisoY - 110, { nombre: "Descanso Escalera" })
    ];

    pisoObj.items = [
        item(TIPOS_ITEM.VIDA, Math.round(finPisoX * 0.25) + 55, pisoY - 190),
        item(TIPOS_ITEM.DOBLE_SALTO, Math.round(finPisoX * 0.52) + 45, pisoY - 205),
        item(TIPOS_ITEM.TARJETA, Math.round(finPisoX * 0.74), pisoY - 185)
    ];

    pisoObj.meta = metaPiso(Math.max(420, finPisoX - 170), pisoY - 144, {
        requiereLlave: true,
        etiqueta: idPiso >= 20 ? "SALIDA CALLE ▼" : "BAJAR PISO ▼"
    });

    return pisoObj;
}

