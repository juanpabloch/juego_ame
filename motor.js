// ============================================================================
// MOTOR.JS — Física, Movilidad, Colisiones, Botones y Flujo del Juego
// ============================================================================
// Controla la física del jugador, plataformas interactivas, botones/canales,
// trampas activas, coleccionables (vida/leche, poder de doble salto, llaves),
// checkpoints y avance de pisos en el descenso por el edificio.
// El renderizado visual del mundo y HUD se delega a escenario.js.
// ============================================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Estado inicial del jugador
let clavePersonajeActivo = "personaje1";
let configPersonaje = personajesDisponibles[clavePersonajeActivo];

// Constantes de física y movilidad del juego
const FISICA_JUEGO = {
    gravedadSubida: 0.58,
    gravedadBajada: 0.68,
    velocidadCaidaMax: 15.5,
    corteSaltoVariable: 0.46,    // Multiplicador al soltar Espacio subiendo
    coyoteTimeMs: 110,           // Gracia para saltar tras dejar un borde
    jumpBufferMs: 125,           // Gracia al presionar salto justo antes de tocar el suelo
    hitstopDanoMs: 75,           // Pausa de impacto al recibir daño
    invulnerabilidadMs: 1500,    // I-frames parpadeando tras recibir daño
    ignorarPlataformaMs: 230,    // Tiempo para atravesar una plataforma hacia abajo (Abajo + Salto)
    apoyoMinimoBorde: 2          // Basta con 2px de pie para sostenerse en un borde
};

// Alias de compatibilidad
const FISICA_CUPHEAD = FISICA_JUEGO;

const jugador = {
    x: 100,
    y: 180,
    velocidadX: 0,
    velocidadY: 0,
    enElSuelo: true,
    enSueloResbaladizo: false,
    agachado: false,
    direccion: "derecha",
    estado: "quieto",
    frameActual: 0,
    contadorTiempo: 0,
    vida: 3,
    vidaMaxima: 3,
    enSalto: false,
    enDobleSalto: false,
    saltoCortable: false,
    caidaPorHueco: false,
    plataformaObjetivo: null,
    // Poderes y timers de movilidad
    tienePoderDobleSalto: Boolean(configPersonaje?.dobleSaltoInicial),
    saltosAereosRestantes: 0,
    ultimoSueloMs: 0,
    dashHastaMs: 0,
    dashCooldownHastaMs: 0,
    dashAereoDisponible: true,
    direccionDash: 1,
    invulnerableHastaMs: 0,
    danoAnimHastaMs: 0,
    ignorarPlataformaHastaMs: 0,
    ignorarPlataformaY: null
};

function fijarPoderDobleSalto(activo) {
    jugador.tienePoderDobleSalto = Boolean(activo);
    jugador.saltosAereosRestantes = jugador.tienePoderDobleSalto ? 1 : 0;
    const casilla = document.getElementById("chkDobleSalto");
    if (casilla) casilla.checked = jugador.tienePoderDobleSalto;
}

function obtenerAlturaBaseJugador() {
    return configPersonaje?.colision?.alto || configPersonaje?.animaciones?.correr?.altoFrame || 172;
}

function obtenerAlturaJugador(forzarAgachado = jugador.agachado) {
    const altoBase = obtenerAlturaBaseJugador();
    if (forzarAgachado && jugador.enElSuelo) {
        return configPersonaje?.colision?.altoAgachado || Math.round(altoBase * 0.56);
    }
    return altoBase;
}

function obtenerAnchoJugador() {
    return configPersonaje?.colision?.ancho || configPersonaje?.animaciones?.correr?.anchoFrame || 128;
}

function obtenerOffsetColisionX() {
    return configPersonaje?.colision?.offsetX || 0;
}

function obtenerOffsetColisionY(forzarAgachado = jugador.agachado) {
    const offsetBase = configPersonaje?.colision?.offsetY || 0;
    if (forzarAgachado && jugador.enElSuelo) {
        const diferencia = obtenerAlturaBaseJugador() - obtenerAlturaJugador(true);
        return offsetBase + diferencia;
    }
    return offsetBase;
}

function obtenerRenderPersonaje(anim) {
    const render = configPersonaje?.render || {};
    const escala = render.escala || 1;
    return {
        escala,
        offsetX: render.offsetX || 0,
        offsetY: render.offsetY || 0,
        ancho: anim.anchoFrame * escala,
        alto: anim.altoFrame * escala
    };
}

// Reglas y estado global del mundo (compartido con escenario.js)
const gravedad = FISICA_JUEGO.gravedadSubida;
const CONFIG_HUECO = {
    desplazamientoY: 12,
    extensionBordeIzq: TILE_PISO_ANCHO,
    extensionBordeDer: TILE_PISO_ANCHO,
    colorSuperior: "#11161a",
    colorMedio: "#05070a",
    colorFondo: "#000000"
};

let camaraX = 0;
let ultimoTiempoFrame = 0;
let hitstopHastaMs = 0;
let sacudidaPantalla = 0;
let estadosPlataformas = new Map();
let plataformasNivel = [];
let ultimaPlataformaSolida = null;
let superficiesObjetos = [];
let trampasNivel = [];
let interruptoresNivel = [];
let estadoCanalesInterruptor = new Map();
let itemsNivel = [];
let checkpointsNivel = [];
let checkpointActivo = null;
let metaNivel = null;
let tarjetasRecolectadas = 0;
let totalTarjetasNivel = 0;
let transicionPisoCompletado = null;
let transicionGameOver = null;
let textosFlotantes = [];
let particulas = [];
let estelasDash = [];
let framesTransicionRespawn = 0;

// Modo de depuración: dibuja las cajas de colisión encima de todo. Tecla C o ?colisiones en la URL.
let verColisiones = new URLSearchParams(window.location.search).has("colisiones");
const COLORES_COLISION = {
    jugador: "#ffe14d",
    sprite: "rgba(255, 255, 255, 0.45)",
    piso: "#4fd1ff",
    pivote: "#ff9f43",
    pivoteCaido: "rgba(255, 159, 67, 0.35)",
    plataforma: "#7fd1a0",
    solido: "#ff5fc8",
    fondo: "rgba(185, 163, 245, 0.6)",
    trampa: "#ff3b3b",
    trampaInactiva: "rgba(255, 90, 90, 0.35)",
    item: "#ffe14d",
    meta: "#38f8a8",
    checkpoint: "#5ce1e6"
};

// ============================================================================
// 1. PARTÍCULAS Y FEEDBACK VISUAL
// ============================================================================

function crearTextoFlotante(x, y, texto, color = "#ffe14d") {
    textosFlotantes.push({
        x,
        y,
        vy: -1.35,
        texto,
        color,
        vida: 1
    });
}

function crearParticulaHumo(x, y, opciones = {}) {
    particulas.push({
        x,
        y,
        vx: opciones.vx ?? (Math.random() - 0.5) * 2.2,
        vy: opciones.vy ?? (-Math.random() * 1.4 - 0.3),
        radio: opciones.radio ?? (8 + Math.random() * 7),
        radioMax: opciones.radioMax ?? (18 + Math.random() * 10),
        vida: 1,
        decaimiento: opciones.decaimiento ?? (0.045 + Math.random() * 0.02),
        color: opciones.color || "rgba(238, 234, 218, 0.78)",
        tipo: opciones.tipo || "humo"
    });
}

function crearOndaSaltoAereo(x, y, color = "#5ce1e6") {
    particulas.push({
        x,
        y,
        vx: 0,
        vy: 0,
        radio: 10,
        radioMax: 44,
        vida: 1,
        decaimiento: 0.085,
        color,
        tipo: "onda_aire"
    });
    for (let i = 0; i < 6; i++) {
        crearParticulaHumo(x + (Math.random() - 0.5) * 32, y, {
            vx: (Math.random() - 0.5) * 3.2,
            vy: Math.random() * 1.6 + 0.3,
            radio: 5,
            radioMax: 11,
            decaimiento: 0.065,
            color: i % 2 === 0 ? color : "#ffffff"
        });
    }
}

// Alias para garantizar compatibilidad al recoger el poder de doble salto, saltar en el aire o tocar la meta
function crearDestelloDobleSalto(x, y, color = "#5ce1e6") {
    crearOndaSaltoAereo(x, y, color);
}

// ============================================================================
// 2. SISTEMA DE BOTONES / INTERRUPTORES POR CANAL
// ============================================================================

function canalInterruptorActivo(canal, tiempoActual = performance.now()) {
    if (!canal) return false;
    const estado = estadoCanalesInterruptor.get(String(canal));
    if (!estado) return false;
    if (estado.permanente) return true;
    return tiempoActual < estado.activoHastaMs;
}

function activarCanalInterruptor(sw, tiempoActual = performance.now()) {
    if (!sw || !sw.canal) return;
    const clave = String(sw.canal);
    const actual = estadoCanalesInterruptor.get(clave);
    const yaEstabaActivo = Boolean(actual && (actual.permanente || tiempoActual < actual.activoHastaMs));
    const modo = sw.modo || "activar";

    if (modo === "alternar" && yaEstabaActivo) {
        estadoCanalesInterruptor.delete(clave);
        sacudidaPantalla = Math.max(sacudidaPantalla, 2.8);
        crearOndaSaltoAereo(sw.x + sw.ancho / 2, sw.y + sw.alto / 2, "#ff8c42");
        crearTextoFlotante(
            sw.x + sw.ancho / 2,
            sw.y - 16,
            `¡INTERRUPTOR ${clave} DESACTIVADO!`,
            "#ff8c42"
        );
        return;
    }

    const esTemporizado = (modo === "tiempo" || modo === "temporal" || modo === "temporizado")
        && Number(sw.duracionMs) > 0;

    estadoCanalesInterruptor.set(clave, {
        permanente: !esTemporizado,
        activoHastaMs: esTemporizado ? tiempoActual + Number(sw.duracionMs) : Infinity
    });

    if (!yaEstabaActivo || esTemporizado) {
        sacudidaPantalla = Math.max(sacudidaPantalla, 3.5);
        crearOndaSaltoAereo(sw.x + sw.ancho / 2, sw.y + sw.alto / 2, "#48ff9b");
        crearTextoFlotante(
            sw.x + sw.ancho / 2,
            sw.y - 16,
            esTemporizado ? `¡CANAL ${clave} (${Math.round(sw.duracionMs / 1000)}s)!` : `¡INTERRUPTOR ${clave} ACTIVADO!`,
            "#48ff9b"
        );
    }
}

// ============================================================================
// 3. CONSTRUCCIÓN E INICIALIZACIÓN DE CADA PISO
// ============================================================================

function buscarXSeguroEnPiso(plataformasBase, xObjetivo, margenBorde = 90) {
    const candidatas = plataformasBase.filter(
        (p) => !p.flotante && p.tipo !== TIPOS_PLATAFORMA.PIVOTE && p.ancho >= margenBorde * 2
    );
    if (!candidatas.length) return { x: xObjetivo, y: ALTURA_PLATAFORMA_DEFAULT, plat: plataformasBase[0] };

    let mejorPlat = candidatas[0];
    let menorDist = Infinity;
    candidatas.forEach((p) => {
        const centro = p.x + p.ancho / 2;
        const dist = Math.abs(centro - xObjetivo);
        if (dist < menorDist) {
            menorDist = dist;
            mejorPlat = p;
        }
    });

    const xClamp = Math.max(mejorPlat.x + margenBorde, Math.min(xObjetivo, mejorPlat.x + mejorPlat.ancho - margenBorde));
    return { x: Math.round(xClamp), y: mejorPlat.y || ALTURA_PLATAFORMA_DEFAULT, plat: mejorPlat };
}

function construirElementosFase2Nivel(pisoConfig) {
    const platBase = Array.isArray(pisoConfig.plataformas) ? pisoConfig.plataformas : [];
    const ultimaPlat = platBase[platBase.length - 1] || { x: 0, y: ALTURA_PLATAFORMA_DEFAULT, ancho: 800 };
    const finPisoX = ultimaPlat.x + ultimaPlat.ancho;
    const pisoY = ultimaPlat.y || ALTURA_PLATAFORMA_DEFAULT;
    const idPiso = Number(pisoConfig.id) || 1;
    const usaInterruptoresAuto = !Array.isArray(pisoConfig.interruptores);

    // 1. Plataformas del nivel
    const tieneFlotantesPropias = platBase.some(
        (p) => p.flotante
            || p.tipo === TIPOS_PLATAFORMA.MOVIL
            || p.tipo === TIPOS_PLATAFORMA.REBOTE
            || p.tipo === TIPOS_PLATAFORMA.CINTA
            || p.tipo === TIPOS_PLATAFORMA.QUEBRADIZO
    );
    const listaPlataformas = platBase.map((p) => ({ ...p }));

    if (!tieneFlotantesPropias && !Array.isArray(pisoConfig.trampas)) {
        const p1 = buscarXSeguroEnPiso(platBase, finPisoX * 0.27, 130);
        const p2 = buscarXSeguroEnPiso(platBase, finPisoX * 0.56, 130);
        const p3 = buscarXSeguroEnPiso(platBase, finPisoX * 0.78, 130);

        listaPlataformas.push(
            plataformaFlotante(p1.x - 70, p1.y - 135, 160, idPiso % 2 === 0 ? TIPOS_PLATAFORMA.QUEBRADIZO : TIPOS_PLATAFORMA.NORMAL)
        );
        listaPlataformas.push(
            plataformaMovil(
                p2.x - 60,
                p2.y - 145,
                144,
                {
                    eje: idPiso % 3 === 0 ? "y" : "x",
                    rango: idPiso % 3 === 0 ? 75 : 130,
                    velocidad: 1.9 + (idPiso % 3) * 0.35
                },
                usaInterruptoresAuto ? { canal: "A", ocultaInicial: idPiso % 2 === 0 } : {}
            )
        );
        if (idPiso % 2 === 1) {
            listaPlataformas.push(plataformaRebote(p3.x - 48, p3.y - 18, 96, 1.36, { flotante: true }));
        } else {
            listaPlataformas.push(
                cintaTransportadora(
                    p3.x - 110,
                    220,
                    idPiso % 4 === 0 ? -2.7 : 2.7,
                    { y: p3.y - 125, flotante: true, ...(usaInterruptoresAuto ? { canal: "A" } : {}) }
                )
            );
        }
    }

    // 2. Trampas activas
    let listaTrampas = [];
    if (Array.isArray(pisoConfig.trampas)) {
        listaTrampas = pisoConfig.trampas.map((t) => ({ ...t }));
    } else {
        const t1 = buscarXSeguroEnPiso(platBase, Math.max(520, finPisoX * 0.19), 110);
        const t2 = buscarXSeguroEnPiso(platBase, finPisoX * 0.37, 120);
        const t3 = buscarXSeguroEnPiso(platBase, finPisoX * 0.52, 120);
        const t4 = buscarXSeguroEnPiso(platBase, finPisoX * 0.68, 120);
        const t5 = buscarXSeguroEnPiso(platBase, finPisoX * 0.84, 140);

        listaTrampas.push(
            trampa(TIPOS_TRAMPA_ACTIVA.LASER, t1.x - 55, t1.y - 134, 130, 24, {
                orientacion: "horizontal",
                intervaloMs: 2600,
                duracionMs: 1800,
                avisoMs: 500
            })
        );
        listaTrampas.push(
            trampa(TIPOS_TRAMPA_ACTIVA.VAPOR, t2.x - 24, t2.y - 130, 48, 130, {
                orientacion: "arriba",
                intervaloMs: 2100,
                duracionMs: 1050,
                avisoMs: 550,
                ...(usaInterruptoresAuto ? { canal: "A" } : {})
            })
        );
        listaTrampas.push(
            trampa(TIPOS_TRAMPA_ACTIVA.SIERRA, t3.x, t3.y - 52, 52, 52, {
                eje: "x",
                rango: 120,
                velocidad: 2.2 + (idPiso % 3) * 0.3
            })
        );
        listaTrampas.push(
            trampa(TIPOS_TRAMPA_ACTIVA.APLASTADOR, t4.x - 36, t4.y - 230, 72, 84, {
                rango: 146,
                intervaloMs: 2200,
                duracionMs: 700,
                avisoMs: 520,
                velocidad: 12
            })
        );
        listaTrampas.push(
            trampa(TIPOS_TRAMPA_ACTIVA.PINCHOS, t5.x - 44, t5.y - 26, 88, 26, {
                orientacion: "arriba"
            })
        );
    }

    // 3. Interruptores / Botones interactivos
    let listaInterruptores = [];
    if (Array.isArray(pisoConfig.interruptores)) {
        listaInterruptores = pisoConfig.interruptores.map((sw, idx) => {
            const estilo = sw.estilo || sw.tipo || TIPOS_INTERRUPTOR.BOTON_PISO;
            return {
                ...sw,
                id: `sw_${idx}`,
                estilo,
                tipo: estilo,
                _contactoJugador: false
            };
        });
    } else {
        const swPos = buscarXSeguroEnPiso(platBase, finPisoX * 0.31, 95);
        const estilos = [TIPOS_INTERRUPTOR.BOTON_PISO, TIPOS_INTERRUPTOR.PALANCA, TIPOS_INTERRUPTOR.VALVULA];
        const estiloAuto = estilos[(idPiso - 1) % estilos.length];
        const altoAuto = estiloAuto === TIPOS_INTERRUPTOR.BOTON_PISO ? 22 : 56;
        const swAuto = interruptor(swPos.x - 24, swPos.y - altoAuto, "A", {
            estilo: estiloAuto,
            modo: idPiso % 4 === 0 ? MODOS_INTERRUPTOR.TIEMPO : MODOS_INTERRUPTOR.ALTERNAR,
            duracionMs: 6000
        });
        listaInterruptores = [{
            ...swAuto,
            id: "sw_0",
            _contactoJugador: false
        }];
    }

    // 4. Checkpoints
    let listaCheckpoints = [];
    if (Array.isArray(pisoConfig.checkpoints)) {
        listaCheckpoints = pisoConfig.checkpoints.map((cp, idx) => ({
            ...cp,
            id: `cp_${idx}`,
            activado: false
        }));
    } else if (finPisoX >= 1400) {
        const posCp = buscarXSeguroEnPiso(platBase, finPisoX * 0.46, 100);
        listaCheckpoints.push({
            ...checkpoint(posCp.x, posCp.y - 110, { nombre: `Checkpoint P${idPiso}` }),
            id: "cp_auto_0",
            activado: false
        });
    }

    // 5. Coleccionables (Poder de Doble Salto, Vidas +1 ♥ y Tarjetas/Llaves)
    let listaItems = [];
    if (Array.isArray(pisoConfig.items)) {
        listaItems = pisoConfig.items.map((it, idx) => ({
            ...it,
            id: `item_${idx}`,
            recolectado: false
        }));
    } else {
        const posPoder = buscarXSeguroEnPiso(platBase, finPisoX * 0.27, 90);
        const posItem2 = buscarXSeguroEnPiso(platBase, finPisoX * 0.56, 90);
        const posVida = buscarXSeguroEnPiso(platBase, finPisoX * 0.72, 90);

        listaItems.push({
            ...item(TIPOS_ITEM.DOBLE_SALTO, posPoder.x - 20, posPoder.y - 210),
            id: "item_auto_doble_salto",
            recolectado: false
        });
        listaItems.push({
            ...item(TIPOS_ITEM.TARJETA, posItem2.x - 18, posItem2.y - 225),
            id: "item_auto_tarjeta",
            recolectado: false
        });
        listaItems.push({
            ...item(TIPOS_ITEM.VIDA, posVida.x - 18, posVida.y - 68),
            id: "item_auto_vida",
            recolectado: false
        });
    }

    // 6. Puerta de Salida / Ascensor Meta al final del piso
    const configMeta = pisoConfig.meta
        ? { ...pisoConfig.meta }
        : metaPiso(Math.max(320, finPisoX - 150), pisoY - 144, {
            requiereLlave: false,
            etiqueta: `PISO ${idPiso}`
        });

    return {
        plataformas: listaPlataformas,
        trampas: listaTrampas,
        interruptores: listaInterruptores,
        checkpoints: listaCheckpoints,
        items: listaItems,
        meta: configMeta
    };
}

function inicializarEstadosPlataformas(preservarProgreso = false) {
    const elementosFase2 = construirElementosFase2Nivel(pisoActivoConfig);
    plataformasNivel = elementosFase2.plataformas;

    estadosPlataformas = new Map();
    plataformasNivel.forEach((plataforma, indice) => {
        estadosPlataformas.set(indice, {
            activada: false,
            activadaEn: 0,
            caidaEn: 0,
            angulo: 0,
            colisionActiva: true,
            xBase: plataforma.x,
            yBase: plataforma.y,
            xActual: plataforma.x,
            yActual: plataforma.y,
            dxFrame: 0,
            dyFrame: 0,
            offsetTemblorX: 0,
            compresionRebote: 0
        });
    });

    trampasNivel = elementosFase2.trampas.map((t, idx) => ({
        ...t,
        id: `trampa_${idx}`,
        xBase: t.x,
        yBase: t.y,
        xActual: t.x,
        yActual: t.y,
        estadoCiclo: "reposo",
        progresoAplastador: 0
    }));

    interruptoresNivel = elementosFase2.interruptores;

    if (!preservarProgreso) {
        estadoCanalesInterruptor = new Map();
        checkpointsNivel = elementosFase2.checkpoints;
        checkpointActivo = null;
        itemsNivel = elementosFase2.items;
        tarjetasRecolectadas = 0;
        totalTarjetasNivel = itemsNivel.filter((it) => it.tipo === TIPOS_ITEM.TARJETA).length;
        metaNivel = elementosFase2.meta;
        transicionPisoCompletado = null;
        transicionGameOver = null;
        textosFlotantes = [];
    }

    superficiesObjetos = (pisoActivoConfig.objetos || [])
        .filter((objeto) => objeto.modo !== MODOS_OBJETO.FONDO)
        .map((objeto) => ({ ...objeto, ...cajaColisionObjeto(objeto), esObjeto: true, imagen: objeto }));

    if (!preservarProgreso) {
        ultimaPlataformaSolida = plataformasNivel.find((plataforma) => !plataforma.flotante && plataforma.tipo !== TIPOS_PLATAFORMA.PIVOTE)
            || plataformasNivel[0]
            || null;
    }
}

function resetearEstadosMovimientoJugador() {
    jugador.velocidadX = 0;
    jugador.velocidadY = 0;
    jugador.enElSuelo = true;
    jugador.enSueloResbaladizo = false;
    jugador.agachado = false;
    jugador.enSalto = false;
    jugador.enDobleSalto = false;
    jugador.saltoCortable = false;
    jugador.caidaPorHueco = false;
    jugador.plataformaObjetivo = null;
    jugador.dashHastaMs = 0;
    jugador.dashAereoDisponible = true;
    jugador.saltosAereosRestantes = jugador.tienePoderDobleSalto ? 1 : 0;
    jugador.ignorarPlataformaHastaMs = 0;
    jugador.ignorarPlataformaY = null;
    particulas = [];
    estelasDash = [];
}

function colocarJugadorSobrePlataforma(plataforma = plataformasNivel[0]) {
    if (!plataforma) return;

    resetearEstadosMovimientoJugador();
    const alturaPersonaje = obtenerAlturaJugador(false);
    jugador.x = plataforma.x + 40;
    jugador.y = plataforma.y - obtenerOffsetColisionY(false) - alturaPersonaje;
}

// ============================================================================
// 4. GESTIÓN DE PERSONAJE, VIDAS, DAÑO Y REINICIO / CAMBIO DE PISO
// ============================================================================

function seleccionarPersonaje(idPersonaje) {
    clavePersonajeActivo = idPersonaje;
    configPersonaje = personajesDisponibles[idPersonaje];
    jugador.vidaMaxima = configPersonaje.vidaMaxima;
    jugador.vida = configPersonaje.vidaMaxima;
    fijarPoderDobleSalto(Boolean(configPersonaje.dobleSaltoInicial));

    jugador.estado = "quieto";
    jugador.frameActual = 0;
    jugador.contadorTiempo = 0;
    inicializarEstadosPlataformas(false);
    colocarJugadorSobrePlataforma(ultimaPlataformaSolida);

    const btn1 = document.getElementById("btnPersonaje1");
    const btn2 = document.getElementById("btnPersonaje2");
    if (btn1) btn1.classList.toggle("activo", idPersonaje === "personaje1");
    if (btn2) btn2.classList.toggle("activo", idPersonaje === "personaje2");
}

function cambiarVida(cantidad) {
    if (cantidad > 0 && jugador.vida + cantidad > jugador.vidaMaxima) {
        jugador.vidaMaxima = Math.min(6, Math.max(jugador.vidaMaxima, jugador.vida + cantidad));
    }
    jugador.vida = Math.max(0, Math.min(jugador.vida + cantidad, jugador.vidaMaxima));
    return jugador.vida;
}

function quitarVida(cantidad = 1) {
    return cambiarVida(-cantidad);
}

function agregarVida(cantidad = 1) {
    return cambiarVida(cantidad);
}

function iniciarTransicionGameOver(tiempoActual = performance.now()) {
    if (transicionGameOver) return;
    transicionPisoCompletado = null;
    transicionGameOver = {
        inicioMs: tiempoActual,
        duracionMs: 1650
    };
    jugador.velocidadX = 0;
    jugador.velocidadY = 0;
    sacudidaPantalla = 11;
}

function reiniciarEnPisoUnoPorGameOver() {
    transicionGameOver = null;
    jugador.vidaMaxima = configPersonaje.vidaMaxima || 3;
    jugador.vida = jugador.vidaMaxima;
    fijarPoderDobleSalto(Boolean(configPersonaje.dobleSaltoInicial));
    const idPrimerPiso = PISOS_CONFIG[0]?.id ?? 1;
    activarPiso(idPrimerPiso);
    jugador.invulnerableHastaMs = performance.now() + 1200;
    framesTransicionRespawn = 20;
}

function recibirDanoJugador(origenX = jugador.x, cantidad = 1, tiempoActual = performance.now()) {
    if (tiempoActual < jugador.invulnerableHastaMs || transicionPisoCompletado || transicionGameOver) return false;

    quitarVida(cantidad);
    hitstopHastaMs = tiempoActual + FISICA_JUEGO.hitstopDanoMs;
    sacudidaPantalla = 9;

    const cx = jugador.x + obtenerOffsetColisionX() + obtenerAnchoJugador() / 2;
    const cy = jugador.y + obtenerOffsetColisionY() + obtenerAlturaJugador() / 2;
    for (let i = 0; i < 7; i++) {
        crearParticulaHumo(cx, cy, {
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.7) * 4,
            color: "rgba(255, 110, 110, 0.85)"
        });
    }

    if (jugador.vida <= 0) {
        iniciarTransicionGameOver(tiempoActual);
        return true;
    }

    jugador.invulnerableHastaMs = tiempoActual + FISICA_JUEGO.invulnerabilidadMs;
    jugador.danoAnimHastaMs = tiempoActual + 360;
    jugador.dashHastaMs = 0;
    jugador.agachado = false;
    jugador.enElSuelo = false;
    jugador.velocidadY = -9.5;
    const empujonDir = cx < origenX ? -1 : 1;
    jugador.velocidadX = empujonDir * 6.5;
    return true;
}

function llenarSelectorPisos() {
    const selector = document.getElementById("selectorPiso");
    if (!selector) return;

    selector.innerHTML = "";
    PISOS_CONFIG.forEach((piso) => {
        const opcion = document.createElement("option");
        opcion.value = piso.id;
        opcion.textContent = piso.nombre;
        selector.appendChild(opcion);
    });

    selector.value = pisoActivoConfig.id;
}

function activarPiso(idPiso) {
    cambiarPisoActivo(idPiso);
    camaraX = 0;
    inicializarEstadosPlataformas(false);
    colocarJugadorSobrePlataforma(ultimaPlataformaSolida);

    const selector = document.getElementById("selectorPiso");
    if (selector) selector.value = pisoActivoConfig.id;
}

function avanzarSiguientePiso() {
    const indiceActual = PISOS_CONFIG.findIndex((p) => p.id === pisoActivoConfig.id);
    const siguienteIndice = (indiceActual + 1) % PISOS_CONFIG.length;
    const siguientePiso = PISOS_CONFIG[siguienteIndice] || PISOS_CONFIG[0];
    activarPiso(siguientePiso.id);
}

function inicializarSelectorPisos() {
    const selector = document.getElementById("selectorPiso");
    if (!selector) return;

    llenarSelectorPisos();
    selector.addEventListener("change", (event) => {
        activarPiso(event.target.value);
        event.target.blur();
    });
}

// Modo prueba: admin.html abre index.html?prueba=1 en un iframe y le envía los pisos sin guardar
const MODO_PRUEBA = new URLSearchParams(window.location.search).has("prueba");

function inicializarModoPrueba() {
    if (!MODO_PRUEBA || window.parent === window) return;

    document.body.classList.add("modo-prueba");
    window.addEventListener("message", (event) => {
        if (event.source !== window.parent || event.data?.tipo !== "juego_ame:cargar_pisos") return;
        PISOS_CONFIG.splice(0, PISOS_CONFIG.length, ...event.data.pisos);
        if (event.data.catalogo) catalogoObjetosPrueba = event.data.catalogo;
        llenarSelectorPisos();
        activarPiso(event.data.idActivo);
    });
    window.addEventListener("keydown", (event) => {
        if (event.code === "Escape") window.parent.postMessage({ tipo: "juego_ame:cerrar_prueba" }, "*");
    });
    window.parent.postMessage({ tipo: "juego_ame:listo" }, "*");
}

function reiniciarJugador(descontarVida = true) {
    if (descontarVida) {
        quitarVida(1);
        if (jugador.vida <= 0) {
            iniciarTransicionGameOver(performance.now());
            return;
        }
    }

    resetearEstadosMovimientoJugador();
    const alturaPersonaje = obtenerAlturaJugador(false);

    if (checkpointActivo) {
        jugador.x = checkpointActivo.x;
        jugador.y = checkpointActivo.y + checkpointActivo.alto - obtenerOffsetColisionY(false) - alturaPersonaje;
    } else {
        const plataformaRespawn = ultimaPlataformaSolida || plataformasNivel[0];
        jugador.x = plataformaRespawn ? plataformaRespawn.x + 40 : nivel.respawnX;
        jugador.y = plataformaRespawn ? plataformaRespawn.y - obtenerOffsetColisionY(false) - alturaPersonaje : nivel.respawnY;
    }

    jugador.estado = "quieto";
    jugador.frameActual = 0;
    jugador.contadorTiempo = 0;
    jugador.invulnerableHastaMs = performance.now() + 1000;
    inicializarEstadosPlataformas(true);
    framesTransicionRespawn = 18;
}

// ============================================================================
// 5. COLISIONES CON PLATAFORMAS, OBJETOS SÓLIDOS Y PUENTES POR CANAL
// ============================================================================

function obtenerEstadoPlataforma(indice) {
    const plat = plataformasNivel[indice];
    if (!estadosPlataformas.has(indice)) {
        estadosPlataformas.set(indice, {
            activada: false,
            activadaEn: 0,
            caidaEn: 0,
            angulo: 0,
            colisionActiva: true,
            xBase: plat ? plat.x : 0,
            yBase: plat ? plat.y : ALTURA_PLATAFORMA_DEFAULT,
            xActual: plat ? plat.x : 0,
            yActual: plat ? plat.y : ALTURA_PLATAFORMA_DEFAULT,
            dxFrame: 0,
            dyFrame: 0,
            offsetTemblorX: 0,
            compresionRebote: 0
        });
    }

    return estadosPlataformas.get(indice);
}

function obtenerRectPlataforma(plataforma, indice) {
    const estado = obtenerEstadoPlataforma(indice);
    return {
        x: estado.xActual ?? plataforma.x,
        y: estado.yActual ?? plataforma.y,
        ancho: plataforma.ancho
    };
}

function plataformaPermiteColision(plataforma, indice) {
    // Si la plataforma está oculta hasta accionar su botón, no tiene colisión mientras el canal esté inactivo
    if (plataforma.ocultaInicial && plataforma.canal && !canalInterruptorActivo(plataforma.canal)) {
        return false;
    }
    const estado = obtenerEstadoPlataforma(indice);
    if (plataforma.tipo === TIPOS_PLATAFORMA.PIVOTE) {
        return estado.colisionActiva;
    }
    if (plataforma.tipo === TIPOS_PLATAFORMA.QUEBRADIZO) {
        return estado.colisionActiva;
    }
    return true;
}

function superficieEstaIgnoradaPorDrop(superficieY, tiempoActual) {
    if (tiempoActual >= jugador.ignorarPlataformaHastaMs || jugador.ignorarPlataformaY === null) {
        return false;
    }
    return Math.abs(superficieY - jugador.ignorarPlataformaY) <= 18;
}

function plataformaPermiteBajar(plataforma) {
    if (!plataforma) return false;
    if (plataforma.esObjeto && plataforma.modo === MODOS_OBJETO.PLATAFORMA) return true;
    if (plataforma.flotante || plataforma.y < nivel.pisoY - 12) return true;
    const hayPisoDebajo = plataformasNivel.some(
        (otra) => otra !== plataforma && otra.y > plataforma.y + 16
            && otra.x < plataforma.x + plataforma.ancho && otra.x + otra.ancho > plataforma.x
    );
    return hayPisoDebajo;
}

function rangoJugadorSobrePlataforma(izquierda, derecha, plataformaRect, apoyoMinimo = FISICA_JUEGO.apoyoMinimoBorde) {
    const superposicion = Math.min(derecha, plataformaRect.x + plataformaRect.ancho) - Math.max(izquierda, plataformaRect.x);
    return superposicion >= apoyoMinimo;
}

function buscarSuperficieObjeto(izquierda, derecha, apoyoMinimo, coincideAltura, tiempoActual) {
    const superficie = superficiesObjetos.find((objeto) => !superficieEstaIgnoradaPorDrop(objeto.y, tiempoActual)
        && coincideAltura(objeto)
        && rangoJugadorSobrePlataforma(izquierda, derecha, objeto, Math.min(apoyoMinimo, objeto.ancho / 2)));
    return superficie ? { plataforma: superficie, indice: -1 } : null;
}

function puedeLevantarseDeAgachado() {
    const ancho = obtenerAnchoJugador();
    const altoParado = obtenerAlturaJugador(false);
    const offsetX = obtenerOffsetColisionX();
    const offsetYParado = obtenerOffsetColisionY(false);

    const izquierda = jugador.x + offsetX + 2;
    const derecha = jugador.x + offsetX + ancho - 2;
    const arribaParado = jugador.y + offsetYParado;
    const abajoParado = arribaParado + altoParado - 8;

    return !superficiesObjetos.some((objeto) => {
        if (objeto.modo !== MODOS_OBJETO.SOLIDO) return false;
        const chocaX = derecha > objeto.x && izquierda < objeto.x + objeto.ancho;
        const chocaY = arribaParado < objeto.y + objeto.alto && abajoParado > objeto.y;
        return chocaX && chocaY;
    });
}

function resolverObjetosSolidos(xAnterior, yAnterior) {
    const ancho = obtenerAnchoJugador();
    const alto = obtenerAlturaJugador();
    const offsetX = obtenerOffsetColisionX();
    const offsetY = obtenerOffsetColisionY();

    superficiesObjetos.forEach((objeto) => {
        if (objeto.modo !== MODOS_OBJETO.SOLIDO) return;

        const izquierda = jugador.x + offsetX;
        const arriba = jugador.y + offsetY;
        const finObjeto = objeto.x + objeto.ancho;
        const baseObjeto = objeto.y + objeto.alto;
        const seTocan = izquierda < finObjeto && izquierda + ancho > objeto.x
            && arriba < baseObjeto && arriba + alto > objeto.y;
        if (!seTocan) return;

        if (yAnterior + offsetY + alto <= objeto.y + 10) return;

        if (jugador.velocidadY < 0 && yAnterior + offsetY >= baseObjeto - 6) {
            jugador.y = baseObjeto - offsetY;
            jugador.velocidadY = 0;
            return;
        }

        const veniaPorIzquierda = xAnterior + offsetX + ancho / 2 < objeto.x + objeto.ancho / 2;
        jugador.x = veniaPorIzquierda ? objeto.x - offsetX - ancho : finObjeto - offsetX;
        jugador.velocidadX = 0;
    });
}

function detectarPlataformaAterrizaje({ izquierda, derecha, apoyoMinimo, baseAnterior, baseActual, tiempoActual }) {
    for (let indice = 0; indice < plataformasNivel.length; indice++) {
        const plataforma = plataformasNivel[indice];
        const rect = obtenerRectPlataforma(plataforma, indice);
        if (superficieEstaIgnoradaPorDrop(rect.y, tiempoActual)) continue;
        const estado = obtenerEstadoPlataforma(indice);
        const margenCruce = 12 + Math.max(0, Math.abs(estado.dyFrame || 0));
        const cruzaAltura = baseAnterior <= rect.y + margenCruce && baseActual >= rect.y - 2;
        if (
            plataformaPermiteColision(plataforma, indice)
            && cruzaAltura
            && rangoJugadorSobrePlataforma(izquierda, derecha, rect, apoyoMinimo)
        ) {
            return { plataforma, indice, rect };
        }
    }

    return buscarSuperficieObjeto(
        izquierda,
        derecha,
        apoyoMinimo,
        (objeto) => baseAnterior <= objeto.y + 10 && baseActual >= objeto.y,
        tiempoActual
    );
}

function detectarPlataformaPisada({ izquierda, derecha, apoyoMinimo, baseActual, tiempoActual }) {
    for (let indice = 0; indice < plataformasNivel.length; indice++) {
        const plataforma = plataformasNivel[indice];
        const rect = obtenerRectPlataforma(plataforma, indice);
        if (superficieEstaIgnoradaPorDrop(rect.y, tiempoActual)) continue;
        const estado = obtenerEstadoPlataforma(indice);
        const toleranciaY = 11 + Math.ceil(Math.abs(estado.dyFrame || 0));
        const cercaDeSuperficie = Math.abs(baseActual - rect.y) <= toleranciaY;
        if (
            plataformaPermiteColision(plataforma, indice)
            && cercaDeSuperficie
            && rangoJugadorSobrePlataforma(izquierda, derecha, rect, apoyoMinimo)
        ) {
            return { plataforma, indice, rect };
        }
    }

    return buscarSuperficieObjeto(
        izquierda,
        derecha,
        apoyoMinimo,
        (objeto) => Math.abs(baseActual - objeto.y) <= 10,
        tiempoActual
    );
}

function actualizarPlataformasAntesDeJugador(tiempoActual, factorDt) {
    plataformasNivel.forEach((plataforma, indice) => {
        const estado = obtenerEstadoPlataforma(indice);
        estado.dxFrame = 0;
        estado.dyFrame = 0;

        if (estado.compresionRebote > 0) {
            estado.compresionRebote = Math.max(0, estado.compresionRebote - 0.08 * factorDt);
        }

        if (plataforma.tipo === TIPOS_PLATAFORMA.MOVIL || plataforma.movil) {
            // Si la plataforma móvil está vinculada a un canal y este no está activo, permanece quieta
            if (plataforma.canal && !canalInterruptorActivo(plataforma.canal, tiempoActual)) {
                return;
            }
            const m = plataforma.movil || { eje: "x", rango: 140, velocidad: 2.0, fase: 0 };
            const onda = Math.sin(tiempoActual * 0.0017 * (m.velocidad || 2) + (m.fase || 0));
            const nuevoX = estado.xBase + (m.eje === "y" ? 0 : onda * (m.rango ?? 140));
            const nuevoY = estado.yBase + (m.eje === "y" ? onda * (m.rango ?? 90) : 0);
            estado.dxFrame = nuevoX - estado.xActual;
            estado.dyFrame = nuevoY - estado.yActual;
            estado.xActual = nuevoX;
            estado.yActual = nuevoY;
        }
    });
}

function actualizarTrampasPlataformas(superficieActual, tiempoActual, factorDt) {
    plataformasNivel.forEach((plataforma, indice) => {
        const estado = obtenerEstadoPlataforma(indice);
        const jugadorEncima = Boolean(superficieActual && superficieActual.indice === indice);

        // 1. Plataforma PIVOTE
        if (plataforma.tipo === TIPOS_PLATAFORMA.PIVOTE) {
            if (jugadorEncima && !estado.activada) {
                estado.activada = true;
                estado.activadaEn = tiempoActual;
            }
            if (estado.activada) {
                const progreso = Math.min(1, (tiempoActual - estado.activadaEn) / 650);
                estado.angulo = progreso * (Math.PI / 2);
                estado.colisionActiva = estado.angulo < Math.PI / 4;
            }
        }

        // 2. Plataforma QUEBRADIZA (tiembla 480ms, cae y reaparece a los 2300ms)
        if (plataforma.tipo === TIPOS_PLATAFORMA.QUEBRADIZO) {
            if (jugadorEncima && !estado.activada && estado.colisionActiva) {
                estado.activada = true;
                estado.activadaEn = tiempoActual;
            }
            if (estado.activada && estado.colisionActiva) {
                const transcurrido = tiempoActual - estado.activadaEn;
                estado.offsetTemblorX = Math.sin(tiempoActual * 0.09) * 3.5;
                if (Math.random() < 0.35) {
                    crearParticulaHumo(
                        estado.xActual + Math.random() * plataforma.ancho,
                        estado.yActual + 18,
                        { vx: (Math.random() - 0.5) * 1.4, vy: 1.5, radio: 4, radioMax: 8, color: "rgba(180, 165, 140, 0.75)" }
                    );
                }
                if (transcurrido >= 480) {
                    estado.colisionActiva = false;
                    estado.caidaEn = tiempoActual;
                    estado.offsetTemblorX = 0;
                    sacudidaPantalla = Math.max(sacudidaPantalla, 4);
                }
            } else if (!estado.colisionActiva) {
                if (tiempoActual - estado.caidaEn >= 2300) {
                    estado.activada = false;
                    estado.colisionActiva = true;
                    estado.offsetTemblorX = 0;
                }
            }
        }

        // 3. Arrastre de plataforma MÓVIL, CINTA TRANSPORTADORA o REBOTE cuando el jugador está encima
        if (jugadorEncima && jugador.enElSuelo) {
            if (estado.dxFrame) {
                jugador.x += estado.dxFrame;
            }
            if (estado.dyFrame) {
                jugador.y += estado.dyFrame;
            }
            if (plataforma.tipo === TIPOS_PLATAFORMA.CINTA) {
                const cintaActiva = !plataforma.canal
                    ? true
                    : (plataforma.ocultaInicial
                        ? canalInterruptorActivo(plataforma.canal, tiempoActual)
                        : !canalInterruptorActivo(plataforma.canal, tiempoActual));
                if (cintaActiva) {
                    const empuje = (plataforma.velocidadCinta ?? 2.6) * factorDt;
                    jugador.x += empuje;
                }
            }
            if (plataforma.tipo === TIPOS_PLATAFORMA.REBOTE) {
                const multiplicador = teclas.saltoMantener
                    ? (plataforma.fuerzaRebote || 1.38) * 1.12
                    : (plataforma.fuerzaRebote || 1.38);
                estado.compresionRebote = 1;
                jugador.dashAereoDisponible = true;
                jugador.enDobleSalto = false;
                jugador.saltosAereosRestantes = jugador.tienePoderDobleSalto ? 1 : 0;
                ejecutarSaltoJugador(tiempoActual, multiplicador);
                crearTextoFlotante(
                    estado.xActual + plataforma.ancho / 2,
                    estado.yActual - 18,
                    "¡BOING!",
                    "#ffe14d"
                );
            }
        }
    });
}

// ============================================================================
// 6. SISTEMA DE TRAMPAS ACTIVAS: PINCHOS, VAPOR, LÁSER, APLASTADOR, SIERRA
// ============================================================================

function obtenerCajaColisionJugador() {
    const izq = jugador.x + obtenerOffsetColisionX() + 6;
    const arr = jugador.y + obtenerOffsetColisionY() + 4;
    const ancho = Math.max(12, obtenerAnchoJugador() - 12);
    const alto = Math.max(16, obtenerAlturaJugador() - 6);
    return { x: izq, y: arr, ancho, alto, der: izq + ancho, aba: arr + alto };
}

function cajasSeSolapan(a, b) {
    return a.x < b.x + b.ancho
        && a.x + a.ancho > b.x
        && a.y < b.y + b.alto
        && a.y + a.alto > b.y;
}

function actualizarTrampasActivas(tiempoActual, factorDt) {
    const cajaJ = obtenerCajaColisionJugador();

    trampasNivel.forEach((t) => {
        // Si la trampa tiene un canal de interruptor y ese canal está activo, la trampa queda desactivada
        if (t.canal && canalInterruptorActivo(t.canal, tiempoActual)) {
            t.peligrosa = false;
            t.estadoCiclo = "reposo";
            return;
        }

        // 1. PINCHOS / CABLES PELADOS
        if (t.tipo === TIPOS_TRAMPA_ACTIVA.PINCHOS) {
            t.peligrosa = true;
            t.cajaPeligro = {
                x: t.xBase + 6,
                y: t.yBase + 6,
                ancho: Math.max(8, t.ancho - 12),
                alto: Math.max(8, t.alto - 8)
            };
            if (t.peligrosa && cajasSeSolapan(cajaJ, t.cajaPeligro)) {
                recibirDanoJugador(t.xBase + t.ancho / 2, t.dano || 1, tiempoActual);
            }
            return;
        }

        // 2. CHORRO DE VAPOR / FUEGO CON CICLO
        if (t.tipo === TIPOS_TRAMPA_ACTIVA.VAPOR) {
            const intervalo = t.intervaloMs || 2100;
            const aviso = t.avisoMs || 550;
            const duracion = t.duracionMs || 1050;
            const cicloTotal = intervalo + aviso + duracion;
            const fase = (tiempoActual + (t.desfaseMs || 0)) % cicloTotal;

            if (fase < intervalo) {
                t.estadoCiclo = "reposo";
                t.peligrosa = false;
            } else if (fase < intervalo + aviso) {
                t.estadoCiclo = "aviso";
                t.peligrosa = false;
                if (Math.random() < 0.35) {
                    crearParticulaHumo(
                        t.xBase + t.ancho / 2 + (Math.random() - 0.5) * 16,
                        t.yBase + t.alto - 10,
                        { vx: (Math.random() - 0.5) * 1.2, vy: -2.2, radio: 5, radioMax: 11, color: "rgba(255, 255, 255, 0.7)" }
                    );
                }
            } else {
                t.estadoCiclo = "activa";
                t.peligrosa = true;
                if (Math.random() < 0.55) {
                    crearParticulaHumo(
                        t.xBase + t.ancho / 2 + (Math.random() - 0.5) * (t.ancho * 0.6),
                        t.yBase + t.alto - Math.random() * t.alto * 0.85,
                        { vx: (Math.random() - 0.5) * 1.8, vy: -3.6, radio: 9, radioMax: 20, color: "rgba(235, 248, 255, 0.82)" }
                    );
                }
            }

            t.cajaPeligro = {
                x: t.xBase + 6,
                y: t.yBase + 8,
                ancho: Math.max(10, t.ancho - 12),
                alto: Math.max(12, t.alto - 14)
            };

            if (t.peligrosa && cajasSeSolapan(cajaJ, t.cajaPeligro)) {
                recibirDanoJugador(t.xBase + t.ancho / 2, t.dano || 1, tiempoActual);
            }
            return;
        }

        // 3. RAYO LÁSER DE SEGURIDAD
        if (t.tipo === TIPOS_TRAMPA_ACTIVA.LASER) {
            const intervalo = t.intervaloMs || 2400;
            const aviso = t.avisoMs || 500;
            const duracion = t.duracionMs || 1800;
            const cicloTotal = intervalo + aviso + duracion;
            const fase = (tiempoActual + (t.desfaseMs || 0)) % cicloTotal;

            if (fase < intervalo && intervalo > 0) {
                t.estadoCiclo = "reposo";
                t.peligrosa = false;
            } else if (fase < intervalo + aviso && intervalo > 0) {
                t.estadoCiclo = "aviso";
                t.peligrosa = false;
            } else {
                t.estadoCiclo = "activa";
                t.peligrosa = true;
            }

            const esHorizontal = t.orientacion !== "vertical" && t.ancho >= t.alto;
            t.cajaPeligro = esHorizontal
                ? { x: t.xBase + 8, y: t.yBase + 5, ancho: Math.max(10, t.ancho - 16), alto: Math.max(8, t.alto - 10) }
                : { x: t.xBase + 5, y: t.yBase + 8, ancho: Math.max(8, t.ancho - 10), alto: Math.max(10, t.alto - 16) };

            if (t.peligrosa && cajasSeSolapan(cajaJ, t.cajaPeligro)) {
                recibirDanoJugador(t.xBase + t.ancho / 2, t.dano || 1, tiempoActual);
            }
            return;
        }

        // 4. APLASTADOR / PRENSA QUE CAE DEL TECHO
        if (t.tipo === TIPOS_TRAMPA_ACTIVA.APLASTADOR) {
            const intervalo = t.intervaloMs || 2000;
            const aviso = t.avisoMs || 500;
            const bajadaMs = 240;
            const abajoMs = t.duracionMs || 650;
            const subidaMs = 900;
            const cicloTotal = intervalo + aviso + bajadaMs + abajoMs + subidaMs;
            const fase = (tiempoActual + (t.desfaseMs || 0)) % cicloTotal;
            const rangoCaida = t.rango || 145;

            const estadoPrevio = t.estadoCiclo;
            if (fase < intervalo) {
                t.estadoCiclo = "reposo";
                t.progresoAplastador = 0;
            } else if (fase < intervalo + aviso) {
                t.estadoCiclo = "aviso";
                t.progresoAplastador = 0;
            } else if (fase < intervalo + aviso + bajadaMs) {
                t.estadoCiclo = "cayendo";
                t.progresoAplastador = (fase - intervalo - aviso) / bajadaMs;
            } else if (fase < intervalo + aviso + bajadaMs + abajoMs) {
                t.estadoCiclo = "abajo";
                t.progresoAplastador = 1;
                if (estadoPrevio === "cayendo") {
                    if (Math.abs((jugador.x - (t.xBase + t.ancho / 2))) < 480) {
                        sacudidaPantalla = Math.max(sacudidaPantalla, 5.5);
                    }
                    for (let i = 0; i < 5; i++) {
                        crearParticulaHumo(
                            t.xBase + Math.random() * t.ancho,
                            t.yBase + rangoCaida + t.alto - 4,
                            { vx: (Math.random() - 0.5) * 3.8, vy: -Math.random() * 1.5, radio: 7, radioMax: 15 }
                        );
                    }
                }
            } else {
                t.estadoCiclo = "subiendo";
                const progSubida = (fase - intervalo - aviso - bajadaMs - abajoMs) / subidaMs;
                t.progresoAplastador = Math.max(0, 1 - progSubida);
            }

            t.yActual = t.yBase + t.progresoAplastador * rangoCaida;
            t.peligrosa = t.estadoCiclo === "cayendo" || t.estadoCiclo === "abajo";
            t.cajaPeligro = {
                x: t.xBase + 4,
                y: t.yActual + 6,
                ancho: t.ancho - 8,
                alto: t.alto - 8
            };

            if (cajasSeSolapan(cajaJ, t.cajaPeligro)) {
                recibirDanoJugador(t.xBase + t.ancho / 2, t.dano || 1, tiempoActual);
            }
            return;
        }

        // 5. SIERRA / DRON MÓVIL
        if (t.tipo === TIPOS_TRAMPA_ACTIVA.SIERRA) {
            const vel = t.velocidad || 2.3;
            const rango = t.rango ?? 120;
            const onda = Math.sin(tiempoActual * 0.002 * vel + (t.desfaseMs || 0));
            t.xActual = t.xBase + (t.eje === "y" ? 0 : onda * rango);
            t.yActual = t.yBase + (t.eje === "y" ? onda * rango : 0);
            t.peligrosa = true;
            t.cajaPeligro = {
                x: t.xActual + 6,
                y: t.yActual + 6,
                ancho: Math.max(12, t.ancho - 12),
                alto: Math.max(12, t.alto - 12)
            };

            if (cajasSeSolapan(cajaJ, t.cajaPeligro)) {
                recibirDanoJugador(t.xActual + t.ancho / 2, t.dano || 1, tiempoActual);
            }
        }
    });
}

// ============================================================================
// 7. FLUJO DE NIVEL: BOTONES, CHECKPOINTS, ITEMS, PODERES, VIDAS Y META
// ============================================================================

function actualizarFlujoNivel(tiempoActual) {
    if (transicionGameOver) {
        if (tiempoActual - transicionGameOver.inicioMs >= transicionGameOver.duracionMs) {
            reiniciarEnPisoUnoPorGameOver();
        }
        return;
    }

    if (transicionPisoCompletado) {
        if (tiempoActual - transicionPisoCompletado.inicioMs >= transicionPisoCompletado.duracionMs) {
            transicionPisoCompletado = null;
            avanzarSiguientePiso();
        }
        return;
    }

    const cajaJ = obtenerCajaColisionJugador();

    // 0. Botones / Interruptores de canal (se activan al entrar en contacto)
    interruptoresNivel.forEach((sw) => {
        const tocando = cajasSeSolapan(cajaJ, sw);
        if (tocando && !sw._contactoJugador) {
            sw._contactoJugador = true;
            activarCanalInterruptor(sw, tiempoActual);
        } else if (!tocando && sw._contactoJugador) {
            sw._contactoJugador = false;
        }
    });

    // 1. Checkpoints (Fichadores / Descansos de Escalera)
    checkpointsNivel.forEach((cp) => {
        if (cp.activado) return;
        if (cajasSeSolapan(cajaJ, cp)) {
            cp.activado = true;
            checkpointActivo = cp;
            crearTextoFlotante(cp.x + cp.ancho / 2, cp.y - 12, "¡CHECKPOINT!", "#5ce1e6");
            for (let i = 0; i < 8; i++) {
                crearParticulaHumo(cp.x + cp.ancho / 2, cp.y + cp.alto / 2, {
                    vx: (Math.random() - 0.5) * 4,
                    vy: -Math.random() * 3.5 - 0.5,
                    radio: 5,
                    radioMax: 12,
                    color: i % 2 === 0 ? "#5ce1e6" : "#ffe14d"
                });
            }
        }
    });

    // 2. Items coleccionables (Vida/Leche +1, Poder Doble Salto, Tarjetas/Llaves)
    itemsNivel.forEach((it) => {
        if (it.recolectado) return;
        if (cajasSeSolapan(cajaJ, it)) {
            it.recolectado = true;
            let colorParticula = "#ffe14d";

            if (it.tipo === TIPOS_ITEM.TARJETA) {
                tarjetasRecolectadas++;
                crearTextoFlotante(
                    it.x + it.ancho / 2,
                    it.y - 10,
                    `¡LLAVE ${tarjetasRecolectadas}/${totalTarjetasNivel}!`,
                    "#ffe14d"
                );
            } else if (it.tipo === TIPOS_ITEM.DOBLE_SALTO) {
                fijarPoderDobleSalto(true);
                colorParticula = "#5ce1e6";
                crearOndaSaltoAereo(it.x + it.ancho / 2, it.y + it.alto / 2, "#5ce1e6");
                crearTextoFlotante(it.x + it.ancho / 2, it.y - 12, "¡PODER DOBLE SALTO!", "#5ce1e6");
            } else {
                agregarVida(it.valor || 1);
                colorParticula = "#ff6b8b";
                crearTextoFlotante(it.x + it.ancho / 2, it.y - 10, `+${it.valor || 1} ♥ VIDA`, "#ff6b8b");
            }

            for (let i = 0; i < 7; i++) {
                crearParticulaHumo(it.x + it.ancho / 2, it.y + it.alto / 2, {
                    vx: (Math.random() - 0.5) * 3.6,
                    vy: (Math.random() - 0.7) * 3.4,
                    radio: 5,
                    radioMax: 11,
                    color: colorParticula
                });
            }
        }
    });

    // 3. Puerta de Salida / Ascensor Meta hacia el piso inferior
    if (metaNivel) {
        const desbloqueada = !metaNivel.requiereLlave || tarjetasRecolectadas >= totalTarjetasNivel;
        if (cajasSeSolapan(cajaJ, metaNivel)) {
            if (desbloqueada) {
                const esFinalEdificio = PISOS_CONFIG[PISOS_CONFIG.length - 1]?.id === pisoActivoConfig.id;
                transicionPisoCompletado = {
                    inicioMs: tiempoActual,
                    duracionMs: 1650,
                    esFinalEdificio
                };
                jugador.velocidadX = 0;
                jugador.velocidadY = 0;
                sacudidaPantalla = 5;
                crearOndaSaltoAereo(metaNivel.x + metaNivel.ancho / 2, metaNivel.y + metaNivel.alto / 2, "#48ff9b");
                crearTextoFlotante(
                    metaNivel.x + metaNivel.ancho / 2,
                    metaNivel.y - 20,
                    esFinalEdificio ? "¡SALIDA A LA CALLE!" : "¡BAJANDO DE PISO!",
                    "#ffe14d"
                );
            } else if (!metaNivel._avisoCooldown || tiempoActual > metaNivel._avisoCooldown) {
                metaNivel._avisoCooldown = tiempoActual + 1200;
                crearTextoFlotante(
                    metaNivel.x + metaNivel.ancho / 2,
                    metaNivel.y - 14,
                    `FALTA LLAVE (${tarjetasRecolectadas}/${totalTarjetasNivel})`,
                    "#ff6b6b"
                );
            }
        }
    }
}

// ============================================================================
// 8. CONTROLES DE DEPURACIÓN, SALTO, DOBLE SALTO Y DIBUJO DEL PERSONAJE
// ============================================================================

function inicializarVerColisiones() {
    const casilla = document.getElementById("chkColisiones");
    const casillaDobleSalto = document.getElementById("chkDobleSalto");

    const fijar = (valor) => {
        verColisiones = valor;
        if (casilla) casilla.checked = valor;
    };

    fijar(verColisiones);
    casilla?.addEventListener("change", (event) => {
        fijar(event.target.checked);
        event.target.blur();
    });

    casillaDobleSalto?.addEventListener("change", (event) => {
        fijarPoderDobleSalto(event.target.checked);
        event.target.blur();
    });

    window.addEventListener("keydown", (event) => {
        if (esElementoInteractivo(document.activeElement)) return;
        if (event.code === "KeyC" && !event.repeat) fijar(!verColisiones);
        if (event.code === "KeyP" && !event.repeat) {
            fijarPoderDobleSalto(!jugador.tienePoderDobleSalto);
            const px = jugador.x + obtenerOffsetColisionX() + obtenerAnchoJugador() / 2;
            const py = jugador.y + obtenerOffsetColisionY();
            crearTextoFlotante(
                px,
                py - 12,
                jugador.tienePoderDobleSalto ? "DOBLE SALTO: ACTIVADO" : "DOBLE SALTO: DESACTIVADO",
                "#5ce1e6"
            );
        }
    });
}

function ejecutarSaltoJugador(tiempoActual, multiplicador = 1) {
    const basePiesX = jugador.x + obtenerOffsetColisionX() + obtenerAnchoJugador() / 2;
    const basePiesY = jugador.y + obtenerOffsetColisionY() + obtenerAlturaJugador();

    jugador.agachado = false;
    jugador.velocidadY = -configPersonaje.fuerzaSalto * multiplicador;
    jugador.enElSuelo = false;
    jugador.enSalto = true;
    jugador.enDobleSalto = false;
    jugador.saltoCortable = true;
    jugador.caidaPorHueco = false;
    jugador.plataformaObjetivo = true;
    jugador.ultimoSueloMs = -9999;
    jugador.saltosAereosRestantes = jugador.tienePoderDobleSalto ? 1 : 0;
    teclas.salto = false;
    teclas.ultimoSaltoMs = -9999;

    for (let i = 0; i < 4; i++) {
        crearParticulaHumo(basePiesX + (Math.random() - 0.5) * 26, basePiesY - 2, {
            vx: (Math.random() - 0.5) * 2.4,
            vy: -Math.random() * 1.2
        });
    }
}

function ejecutarDobleSaltoJugador(tiempoActual) {
    const basePiesX = jugador.x + obtenerOffsetColisionX() + obtenerAnchoJugador() / 2;
    const basePiesY = jugador.y + obtenerOffsetColisionY() + obtenerAlturaJugador();

    const fuerza2 = configPersonaje.fuerzaDobleSalto || configPersonaje.fuerzaSalto * 0.92;
    jugador.agachado = false;
    jugador.velocidadY = -fuerza2;
    jugador.enElSuelo = false;
    jugador.enSalto = true;
    jugador.enDobleSalto = true;
    jugador.saltoCortable = true;
    jugador.saltosAereosRestantes = Math.max(0, jugador.saltosAereosRestantes - 1);
    jugador.frameActual = 0;
    jugador.contadorTiempo = 0;
    teclas.salto = false;
    teclas.ultimoSaltoMs = -9999;

    crearOndaSaltoAereo(basePiesX, basePiesY - 6, "#5ce1e6");
}

function dibujarPersonajeConEstado(anim, renderPersonaje, jugadorRenderX, jugadorRenderY, tiempoActual) {
    if (tiempoActual < jugador.invulnerableHastaMs) {
        if (Math.floor(tiempoActual / 55) % 2 === 0) {
            ctx.globalAlpha = 0.42;
        }
    }

    const tieneSpritePropio = anim.spriteSheet
        && !anim.spriteSheet.esFallback
        && anim.spriteSheet.complete
        && anim.spriteSheet.naturalWidth > 0;
    const hojaDibujo = tieneSpritePropio ? anim.spriteSheet : (anim.fallbackSheet || configPersonaje.animaciones.quieto.spriteSheet);
    if (!hojaDibujo || !hojaDibujo.complete || hojaDibujo.naturalWidth === 0) return;

    const totalFramesHoja = Math.max(1, Math.round(hojaDibujo.naturalWidth / anim.anchoFrame));
    const frameSeguro = jugador.frameActual % totalFramesHoja;

    ctx.save();

    const centroX = jugadorRenderX + renderPersonaje.ancho / 2;
    const basePiesY = jugadorRenderY + renderPersonaje.alto;

    if (!tieneSpritePropio) {
        if (jugador.estado === "agachar") {
            ctx.translate(centroX, basePiesY);
            ctx.scale(1.14, 0.62);
            ctx.translate(-centroX, -basePiesY);
        } else if (jugador.estado === "dash") {
            ctx.translate(centroX, basePiesY - renderPersonaje.alto * 0.48);
            ctx.scale(1.22, 0.84);
            ctx.translate(-centroX, -(basePiesY - renderPersonaje.alto * 0.48));
        } else if (jugador.estado === "dano") {
            ctx.filter = "sepia(1) saturate(6) hue-rotate(-40deg) brightness(1.15)";
        }
    }

    if (jugador.direccion === "izquierda") {
        ctx.translate(jugadorRenderX + renderPersonaje.ancho, jugadorRenderY);
        ctx.scale(-1, 1);
        ctx.drawImage(
            hojaDibujo,
            frameSeguro * anim.anchoFrame,
            0,
            anim.anchoFrame,
            anim.altoFrame,
            0,
            0,
            renderPersonaje.ancho,
            renderPersonaje.alto
        );
    } else {
        ctx.drawImage(
            hojaDibujo,
            frameSeguro * anim.anchoFrame,
            0,
            anim.anchoFrame,
            anim.altoFrame,
            jugadorRenderX,
            jugadorRenderY,
            renderPersonaje.ancho,
            renderPersonaje.alto
        );
    }

    ctx.restore();
}

// ============================================================================
// 9. BUCLE PRINCIPAL DEL JUEGO (GAME LOOP) E INICIALIZACIÓN
// ============================================================================

function gameLoop(tiempoActual = performance.now()) {
    if (!configPersonaje || !configPersonaje.animaciones) {
        requestAnimationFrame(gameLoop);
        return;
    }

    if (!ultimoTiempoFrame) ultimoTiempoFrame = tiempoActual;
    const deltaMs = Math.min(42, Math.max(1, tiempoActual - ultimoTiempoFrame));
    ultimoTiempoFrame = tiempoActual;
    const factorDt = Math.min(2.4, deltaMs / (1000 / 60));

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const enHitstop = tiempoActual < hitstopHastaMs;

    if (!enHitstop) {
        actualizarPlataformasAntesDeJugador(tiempoActual, factorDt);

        if (transicionPisoCompletado || transicionGameOver) {
            actualizarFlujoNivel(tiempoActual);
        } else {
            const estabaEnElSuelo = jugador.enElSuelo;
            const xAnterior = jugador.x;
            const yAnterior = jugador.y;
            const enDash = tiempoActual < jugador.dashHastaMs;

            // --- 0. AGACHARSE (DUCK) Y BAJAR DE PLATAFORMAS (DROP-THROUGH) ---
            if (jugador.enElSuelo && !enDash) {
                if (teclas.abajo) {
                    jugador.agachado = true;
                } else if (jugador.agachado && puedeLevantarseDeAgachado()) {
                    jugador.agachado = false;
                }
            } else {
                jugador.agachado = false;
            }

            // --- 1. ACTIVACIÓN DE DASH (TIERRA Y AIRE) ---
            const pidioDash = (tiempoActual - teclas.ultimoDashMs) <= 95;
            const puedeDashSuelo = jugador.enElSuelo && tiempoActual >= jugador.dashCooldownHastaMs;
            const puedeDashAire = !jugador.enElSuelo && jugador.dashAereoDisponible;

            if (pidioDash && !enDash && (puedeDashSuelo || puedeDashAire)) {
                teclas.ultimoDashMs = -9999;
                teclas.dash = false;
                if (teclas.derecha) jugador.direccion = "derecha";
                else if (teclas.izquierda) jugador.direccion = "izquierda";

                jugador.direccionDash = jugador.direccion === "izquierda" ? -1 : 1;
                const duracionDash = configPersonaje.duracionDashMs || 165;
                jugador.dashHastaMs = tiempoActual + duracionDash;
                jugador.dashCooldownHastaMs = tiempoActual + duracionDash + (configPersonaje.cooldownDashMs || 250);
                if (!jugador.enElSuelo) {
                    jugador.dashAereoDisponible = false;
                }
                jugador.agachado = false;
                jugador.velocidadY = 0;
                jugador.velocidadX = jugador.direccionDash * (configPersonaje.velocidadDash || 11.5);

                const piesX = jugador.x + obtenerOffsetColisionX() + obtenerAnchoJugador() / 2;
                const piesY = jugador.y + obtenerOffsetColisionY() + obtenerAlturaJugador() - 18;
                for (let i = 0; i < 6; i++) {
                    crearParticulaHumo(piesX - jugador.direccionDash * 14, piesY + (Math.random() - 0.5) * 24, {
                        vx: -jugador.direccionDash * (1.5 + Math.random() * 2.2),
                        vy: (Math.random() - 0.5) * 1.4,
                        radio: 10,
                        radioMax: 22
                    });
                }
            }

            const dashActivoAhora = tiempoActual < jugador.dashHastaMs;

            // --- 2. FÍSICA VERTICAL Y SALTO VARIABLE ---
            if (dashActivoAhora) {
                jugador.velocidadY = 0;
            } else {
                if (teclas.saltoSoltado) {
                    if (jugador.velocidadY < -2.2 && jugador.saltoCortable) {
                        jugador.velocidadY *= FISICA_JUEGO.corteSaltoVariable;
                    }
                    teclas.saltoSoltado = false;
                }

                const gravedadActual = jugador.velocidadY < 0
                    ? FISICA_JUEGO.gravedadSubida
                    : FISICA_JUEGO.gravedadBajada;
                jugador.velocidadY = Math.min(
                    FISICA_JUEGO.velocidadCaidaMax,
                    jugador.velocidadY + gravedadActual * factorDt
                );
                jugador.y += jugador.velocidadY * factorDt;
            }

            // --- 3. MOVIMIENTO HORIZONTAL CON INERCIA Y PISO RESBALADIZO ---
            const anchoJugador = obtenerAnchoJugador();
            const offsetColisionX = obtenerOffsetColisionX();

            if (dashActivoAhora) {
                jugador.velocidadX = jugador.direccionDash * (configPersonaje.velocidadDash || 11.5);
                if (Math.random() < 0.65) {
                    const animRef = configPersonaje.animaciones[jugador.estado] || configPersonaje.animaciones.correr;
                    const renderRef = obtenerRenderPersonaje(animRef);
                    const sheetRef = (!animRef.spriteSheet.esFallback && animRef.spriteSheet.naturalWidth > 0)
                        ? animRef.spriteSheet
                        : (animRef.fallbackSheet || configPersonaje.animaciones.correr.spriteSheet);
                    estelasDash.push({
                        x: jugador.x + renderRef.offsetX,
                        y: jugador.y + renderRef.offsetY,
                        ancho: renderRef.ancho,
                        alto: renderRef.alto,
                        anchoFrame: animRef.anchoFrame,
                        altoFrame: animRef.altoFrame,
                        frame: jugador.frameActual % Math.max(1, Math.round(sheetRef.naturalWidth / animRef.anchoFrame)),
                        direccion: jugador.direccion,
                        sheet: sheetRef,
                        vida: 1
                    });
                }
            } else {
                const dirInput = (teclas.derecha ? 1 : 0) - (teclas.izquierda ? 1 : 0);
                if (dirInput > 0) jugador.direccion = "derecha";
                else if (dirInput < 0) jugador.direccion = "izquierda";

                const velocidadMax = jugador.agachado
                    ? (configPersonaje.velocidadAgachado ?? configPersonaje.velocidad * 0.42)
                    : configPersonaje.velocidad;
                const velocidadObjetivo = dirInput * velocidadMax;

                if (jugador.enElSuelo && jugador.enSueloResbaladizo) {
                    if (dirInput !== 0) {
                        jugador.velocidadX += (velocidadObjetivo * 1.12 - jugador.velocidadX) * 0.08 * factorDt;
                    } else {
                        jugador.velocidadX *= Math.pow(0.955, factorDt);
                    }
                    if (Math.abs(jugador.velocidadX) > 1.2 && Math.random() < 0.35) {
                        const piesX = jugador.x + offsetColisionX + anchoJugador / 2;
                        const piesY = jugador.y + obtenerOffsetColisionY() + obtenerAlturaJugador();
                        crearParticulaHumo(piesX, piesY - 2, {
                            vx: -Math.sign(jugador.velocidadX) * 1.2,
                            vy: -0.6,
                            radio: 4,
                            radioMax: 9,
                            color: "rgba(175, 242, 255, 0.8)"
                        });
                    }
                } else if (jugador.enElSuelo) {
                    if (dirInput !== 0) {
                        jugador.velocidadX += (velocidadObjetivo - jugador.velocidadX) * Math.min(1, 0.65 * factorDt);
                    } else {
                        jugador.velocidadX *= Math.pow(0.45, factorDt);
                        if (Math.abs(jugador.velocidadX) < 0.15) jugador.velocidadX = 0;
                    }
                } else {
                    if (dirInput !== 0) {
                        jugador.velocidadX += (velocidadObjetivo - jugador.velocidadX) * Math.min(1, 0.48 * factorDt);
                    } else {
                        jugador.velocidadX *= Math.pow(0.82, factorDt);
                    }
                }
            }

            jugador.x += jugador.velocidadX * factorDt;

            if (jugador.x < 0) {
                jugador.x = 0;
                jugador.velocidadX = 0;
            } else if (jugador.x + offsetColisionX + anchoJugador > nivel.anchoMundo) {
                jugador.x = nivel.anchoMundo - offsetColisionX - anchoJugador;
                jugador.velocidadX = 0;
            }

            resolverObjetosSolidos(xAnterior, yAnterior);

            // --- 4. DETECCIÓN DE SUELO Y PLATAFORMAS (CON SOPORTE DE BORDE DE 2PX) ---
            const altoJugador = obtenerAlturaJugador();
            const offsetColisionY = obtenerOffsetColisionY();
            const jugadorIzquierda = jugador.x + offsetColisionX;
            const jugadorDerecha = jugadorIzquierda + anchoJugador;
            const apoyoMinimo = FISICA_JUEGO.apoyoMinimoBorde;
            const baseJugador = jugador.y + offsetColisionY + altoJugador;
            const baseAnterior = yAnterior + offsetColisionY + altoJugador;

            jugador.enElSuelo = false;
            let superficieActual = null;

            const plataformaAterrizaje = jugador.velocidadY >= 0
                ? detectarPlataformaAterrizaje({
                    izquierda: jugadorIzquierda,
                    derecha: jugadorDerecha,
                    apoyoMinimo,
                    baseAnterior,
                    baseActual: baseJugador,
                    tiempoActual
                })
                : null;

            if (plataformaAterrizaje) {
                superficieActual = plataformaAterrizaje;
                const ySup = plataformaAterrizaje.rect ? plataformaAterrizaje.rect.y : plataformaAterrizaje.plataforma.y;
                jugador.y = ySup - offsetColisionY - altoJugador;
                if (!estabaEnElSuelo && jugador.velocidadY > 5) {
                    const piesX = jugadorIzquierda + anchoJugador / 2;
                    for (let i = 0; i < 3; i++) {
                        crearParticulaHumo(piesX + (Math.random() - 0.5) * 22, ySup - 2, {
                            vx: (Math.random() - 0.5) * 2.2,
                            vy: -Math.random() * 0.8,
                            radio: 6,
                            radioMax: 13
                        });
                    }
                }
                jugador.velocidadY = 0;
                jugador.enElSuelo = true;
                jugador.enSalto = false;
                jugador.enDobleSalto = false;
                jugador.saltoCortable = false;
                jugador.caidaPorHueco = false;
                jugador.plataformaObjetivo = null;
                jugador.dashAereoDisponible = true;
                jugador.saltosAereosRestantes = jugador.tienePoderDobleSalto ? 1 : 0;
                const pAterrizada = plataformaAterrizaje.plataforma;
                if (
                    pAterrizada.tipo !== TIPOS_PLATAFORMA.PIVOTE
                    && pAterrizada.tipo !== TIPOS_PLATAFORMA.QUEBRADIZO
                    && pAterrizada.tipo !== TIPOS_PLATAFORMA.MOVIL
                    && !pAterrizada.ocultaInicial
                    && !pAterrizada.esObjeto
                ) {
                    ultimaPlataformaSolida = pAterrizada;
                }
            } else {
                const plataformaPisada = detectarPlataformaPisada({
                    izquierda: jugadorIzquierda,
                    derecha: jugadorDerecha,
                    apoyoMinimo,
                    baseActual: baseJugador,
                    tiempoActual
                });

                if (plataformaPisada && estabaEnElSuelo && jugador.velocidadY >= 0) {
                    superficieActual = plataformaPisada;
                    const ySup = plataformaPisada.rect ? plataformaPisada.rect.y : plataformaPisada.plataforma.y;
                    jugador.y = ySup - offsetColisionY - altoJugador;
                    jugador.velocidadY = 0;
                    jugador.enElSuelo = true;
                    jugador.enDobleSalto = false;
                    jugador.caidaPorHueco = false;
                    jugador.dashAereoDisponible = true;
                    jugador.saltosAereosRestantes = jugador.tienePoderDobleSalto ? 1 : 0;
                    const pPisada = plataformaPisada.plataforma;
                    if (
                        pPisada.tipo !== TIPOS_PLATAFORMA.PIVOTE
                        && pPisada.tipo !== TIPOS_PLATAFORMA.QUEBRADIZO
                        && pPisada.tipo !== TIPOS_PLATAFORMA.MOVIL
                        && !pPisada.ocultaInicial
                        && !pPisada.esObjeto
                    ) {
                        ultimaPlataformaSolida = pPisada;
                    }
                }
            }

            if (jugador.enElSuelo) {
                jugador.ultimoSueloMs = tiempoActual;
                const plat = superficieActual?.plataforma;
                jugador.enSueloResbaladizo = Boolean(plat && plat.tipo === TIPOS_PLATAFORMA.RESBALADIZO);
            } else {
                jugador.enSueloResbaladizo = false;
            }

            if (estabaEnElSuelo && !jugador.enElSuelo && !jugador.enSalto && ultimaPlataformaSolida) {
                jugador.caidaPorHueco = true;
                jugador.saltosAereosRestantes = jugador.tienePoderDobleSalto ? 1 : 0;
            }

            actualizarTrampasPlataformas(superficieActual, tiempoActual, factorDt);

            // --- 5. SALTO (CON COYOTE TIME + JUMP BUFFER), BAJAR DE PLATAFORMA Y DOBLE SALTO ---
            const pidioSaltoConBuffer = (tiempoActual - teclas.ultimoSaltoMs) <= FISICA_JUEGO.jumpBufferMs;
            const dentroDeCoyoteTime = jugador.enElSuelo || (!jugador.enSalto && (tiempoActual - jugador.ultimoSueloMs) <= FISICA_JUEGO.coyoteTimeMs);

            if (pidioSaltoConBuffer) {
                if (jugador.enElSuelo && teclas.abajo && superficieActual && plataformaPermiteBajar(superficieActual.plataforma)) {
                    const ySup = superficieActual.rect ? superficieActual.rect.y : superficieActual.plataforma.y;
                    jugador.ignorarPlataformaY = ySup;
                    jugador.ignorarPlataformaHastaMs = tiempoActual + FISICA_JUEGO.ignorarPlataformaMs;
                    jugador.enElSuelo = false;
                    jugador.agachado = false;
                    jugador.velocidadY = 2.6;
                    jugador.ultimoSueloMs = -9999;
                    jugador.saltosAereosRestantes = jugador.tienePoderDobleSalto ? 1 : 0;
                    teclas.salto = false;
                    teclas.ultimoSaltoMs = -9999;
                } else if (dentroDeCoyoteTime) {
                    ejecutarSaltoJugador(tiempoActual, 1);
                } else if (!jugador.enElSuelo && jugador.tienePoderDobleSalto && jugador.saltosAereosRestantes > 0) {
                    ejecutarDobleSaltoJugador(tiempoActual);
                }
            }

            // Actualizar y chequear colisiones con Trampas Activas, Botones, Checkpoints, Items y Meta
            actualizarTrampasActivas(tiempoActual, factorDt);
            actualizarFlujoNivel(tiempoActual);

            if (jugador.y > canvas.height + 50) {
                reiniciarJugador(true);
            }

            // --- 6. SELECCIÓN DE ESTADO DE ANIMACIÓN ---
            const estadoAnterior = jugador.estado;
            if (tiempoActual < jugador.danoAnimHastaMs) {
                jugador.estado = "dano";
            } else if (tiempoActual < jugador.dashHastaMs) {
                jugador.estado = "dash";
            } else if (!jugador.enElSuelo && jugador.enDobleSalto) {
                jugador.estado = "doble_salto";
            } else if (!jugador.enElSuelo) {
                jugador.estado = "saltar";
            } else if (jugador.agachado) {
                jugador.estado = "agachar";
            } else if (teclas.derecha || teclas.izquierda || Math.abs(jugador.velocidadX) > 0.6) {
                jugador.estado = "correr";
            } else {
                jugador.estado = "quieto";
            }

            if (estadoAnterior !== jugador.estado) {
                jugador.frameActual = 0;
                jugador.contadorTiempo = 0;
            }
        }
    }

    const anim = configPersonaje.animaciones[jugador.estado] || configPersonaje.animaciones.quieto;

    // --- 7. GESTIÓN DE ANIMACIÓN ---
    if (!enHitstop) {
        jugador.contadorTiempo += factorDt;

        if (jugador.contadorTiempo >= anim.limiteTiempo) {
            jugador.contadorTiempo = 0;
            jugador.frameActual++;

            if (jugador.frameActual >= anim.totalFrames) {
                if (jugador.estado === "saltar" || jugador.estado === "doble_salto") {
                    jugador.frameActual = anim.totalFrames - 1;
                } else {
                    jugador.frameActual = 0;
                }
            }
        }
    }

    // --- 8. DIBUJAR EN EL CANVAS (DELEGADO A ESCENARIO.JS) ---
    const adelantoCamara = jugador.direccion === "izquierda" ? -40 : 60;
    const objetivoCamara = jugador.x + adelantoCamara - canvas.width * 0.38;
    camaraX += (Math.max(0, Math.min(objetivoCamara, nivel.anchoMundo - canvas.width)) - camaraX) * 0.14;

    let offsetSacudidaX = 0;
    let offsetSacudidaY = 0;
    if (sacudidaPantalla > 0.2) {
        offsetSacudidaX = (Math.random() - 0.5) * sacudidaPantalla;
        offsetSacudidaY = (Math.random() - 0.5) * sacudidaPantalla;
        sacudidaPantalla *= 0.82;
    } else {
        sacudidaPantalla = 0;
    }

    ctx.save();
    if (offsetSacudidaX || offsetSacudidaY) {
        ctx.translate(offsetSacudidaX, offsetSacudidaY);
    }

    dibujarEscenario(camaraX);
    dibujarPlataformas(ctx, pisoActivoConfig, camaraX, tiempoActual);
    dibujarObjetos(camaraX, false);
    dibujarElementosFlujoNivel(ctx, camaraX, tiempoActual);
    dibujarTrampasActivas(ctx, camaraX, tiempoActual);
    actualizarYDibujarParticulas(ctx, camaraX, enHitstop ? 0 : factorDt);

    const jugadorEnPantallaX = jugador.x - camaraX;
    const renderPersonaje = obtenerRenderPersonaje(anim);
    const jugadorRenderX = jugadorEnPantallaX + renderPersonaje.offsetX;
    const jugadorRenderY = jugador.y + renderPersonaje.offsetY;

    dibujarPersonajeConEstado(anim, renderPersonaje, jugadorRenderX, jugadorRenderY, tiempoActual);

    if (verColisiones) dibujarColisiones(anim, renderPersonaje, jugadorRenderX, jugadorRenderY);
    ctx.restore();

    dibujarHud(tiempoActual);

    requestAnimationFrame(gameLoop);
}

async function iniciarJuego() {
    inicializarSelectorPisos();
    inicializarVerColisiones();
    inicializarEstadosPlataformas();
    colocarJugadorSobrePlataforma(ultimaPlataformaSolida);
    inicializarModoPrueba();

    try {
        await Promise.all([
            cargarSpritesPersonajes(),
            cargarAssetsEscenario()
        ]);
    } catch (error) {
        console.warn("Aviso al cargar algunos sprites/assets:", error);
    }

    colocarJugadorSobrePlataforma(ultimaPlataformaSolida);
    requestAnimationFrame(gameLoop);
}

iniciarJuego();
