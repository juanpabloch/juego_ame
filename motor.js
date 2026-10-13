const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Estado inicial del jugador
let clavePersonajeActivo = "personaje1";
let configPersonaje = personajesDisponibles[clavePersonajeActivo];

const jugador = {
    x: 100,
    y: 180,
    velocidadY: 0,
    enElSuelo: true,
    direccion: "derecha",
    estado: "quieto",
    frameActual: 0,
    contadorTiempo: 0,
    vida: 3,
    vidaMaxima: 3,
    enSalto: false,
    caidaPorHueco: false,
    plataformaObjetivo: null,
};

function obtenerAlturaJugador() {
    return configPersonaje?.colision?.alto || configPersonaje?.animaciones?.[jugador.estado]?.altoFrame || 181;
}

function obtenerAnchoJugador() {
    return configPersonaje?.colision?.ancho || configPersonaje?.animaciones?.correr?.anchoFrame || 128;
}

function obtenerOffsetColisionX() {
    return configPersonaje?.colision?.offsetX || 0;
}

function obtenerOffsetColisionY() {
    return configPersonaje?.colision?.offsetY || 0;
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

// Reglas del mundo
const gravedad = 0.6;
const CONFIG_HUECO = {
    desplazamientoY: 12,
    extensionBordeIzq: TILE_PISO_ANCHO,
    extensionBordeDer: TILE_PISO_ANCHO,
    colorSuperior: "#11161a",
    colorMedio: "#05070a",
    colorFondo: "#000000"
};
let camaraX = 0;
let estadosPlataformas = new Map();
let ultimaPlataformaSolida = null;
let framesTransicionRespawn = 0;

function inicializarEstadosPlataformas() {
    estadosPlataformas = new Map();
    pisoActivoConfig.plataformas.forEach((plataforma, indice) => {
        estadosPlataformas.set(indice, {
            activada: false,
            activadaEn: 0,
            angulo: 0,
            colisionActiva: true
        });
    });

    ultimaPlataformaSolida = pisoActivoConfig.plataformas.find((plataforma) => plataforma.tipo !== TIPOS_PLATAFORMA.PIVOTE)
        || pisoActivoConfig.plataformas[0]
        || null;
}

function colocarJugadorSobrePlataforma(plataforma = pisoActivoConfig.plataformas[0]) {
    if (!plataforma) return;

    const alturaPersonaje = obtenerAlturaJugador();
    jugador.x = plataforma.x + 40;
    jugador.y = plataforma.y - obtenerOffsetColisionY() - alturaPersonaje;
    jugador.velocidadY = 0;
    jugador.enElSuelo = true;
    jugador.enSalto = false;
    jugador.caidaPorHueco = false;
    jugador.plataformaObjetivo = null;
}

// Lógica de los botones HTML para cambiar de personaje
function seleccionarPersonaje(idPersonaje) {
    clavePersonajeActivo = idPersonaje;
    configPersonaje = personajesDisponibles[idPersonaje];
    jugador.vidaMaxima = configPersonaje.vidaMaxima;
    jugador.vida = configPersonaje.vidaMaxima;
    
    // Reiniciamos al personaje
    jugador.estado = "quieto";
    jugador.frameActual = 0;
    jugador.contadorTiempo = 0;
    inicializarEstadosPlataformas();
    colocarJugadorSobrePlataforma(ultimaPlataformaSolida);
    
    // Estilos del botón
    document.getElementById("btnPersonaje1").classList.remove("activo");
    document.getElementById("btnPersonaje2").classList.remove("activo");
    if (idPersonaje === "personaje1") document.getElementById("btnPersonaje1").classList.add("activo");
    else document.getElementById("btnPersonaje2").classList.add("activo");
}

function cambiarVida(cantidad) {
    jugador.vida = Math.max(0, Math.min(jugador.vida + cantidad, jugador.vidaMaxima));
    return jugador.vida;
}

function quitarVida(cantidad = 1) {
    return cambiarVida(-cantidad);
}

function agregarVida(cantidad = 1) {
    return cambiarVida(cantidad);
}

function inicializarSelectorPisos() {
    const selector = document.getElementById("selectorPiso");
    if (!selector) return;

    PISOS_CONFIG.forEach((piso) => {
        const opcion = document.createElement("option");
        opcion.value = piso.id;
        opcion.textContent = piso.nombre;
        selector.appendChild(opcion);
    });

    selector.value = pisoActivoConfig.id;
    selector.addEventListener("change", (event) => {
        cambiarPisoActivo(event.target.value);
    });
}

function dibujarHud() {
    const corazonesLlenos = "♥".repeat(jugador.vida);
    const corazonesVacios = "♡".repeat(Math.max(0, jugador.vidaMaxima - jugador.vida));

    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(20, 18, 150, 32);
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${corazonesLlenos}${corazonesVacios}`, 30, 40);

    if (framesTransicionRespawn > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${framesTransicionRespawn / 28})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        framesTransicionRespawn--;
    }
}

function reiniciarJugador() {
    quitarVida(1);
    if (jugador.vida <= 0) {
        jugador.vida = jugador.vidaMaxima;
    }

    const plataformaRespawn = ultimaPlataformaSolida || pisoActivoConfig.plataformas[0];
    const alturaPersonaje = obtenerAlturaJugador();

    jugador.x = plataformaRespawn ? plataformaRespawn.x + 40 : nivel.respawnX;
    jugador.y = plataformaRespawn ? plataformaRespawn.y - obtenerOffsetColisionY() - alturaPersonaje : nivel.respawnY;
    jugador.velocidadY = 0;
    jugador.enElSuelo = true;
    jugador.estado = "quieto";
    jugador.frameActual = 0;
    jugador.contadorTiempo = 0;
    jugador.enSalto = false;
    jugador.caidaPorHueco = false;
    jugador.plataformaObjetivo = null;
    inicializarEstadosPlataformas();
    framesTransicionRespawn = 18;
}

function obtenerColorPiso() {
    const colores = {
        linoleo: "#9ca58e",
        parque: "#7b533c",
        concreto: "#838982",
        azulejo: "#8fb5b3"
    };

    return colores[pisoActivoConfig.tipoPiso] || pisoActivoConfig.colorPlaceholder;
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

function obtenerEstadoPlataforma(indice) {
    if (!estadosPlataformas.has(indice)) {
        estadosPlataformas.set(indice, {
            activada: false,
            activadaEn: 0,
            angulo: 0,
            colisionActiva: true
        });
    }

    return estadosPlataformas.get(indice);
}

function plataformaPermiteColision(plataforma, indice) {
    if (plataforma.tipo !== TIPOS_PLATAFORMA.PIVOTE) return true;
    if (!pisoActivoConfig.trampasHabilitadas.includes(TRAMPAS.PIVOTE)) return true;
    return obtenerEstadoPlataforma(indice).colisionActiva;
}

function rangoJugadorSobrePlataforma(izquierda, derecha, plataforma, apoyoMinimo) {
    const superposicion = Math.min(derecha, plataforma.x + plataforma.ancho) - Math.max(izquierda, plataforma.x);
    return superposicion >= apoyoMinimo;
}

function detectarPlataformaAterrizaje({ izquierda, derecha, apoyoMinimo, baseAnterior, baseActual }) {
    for (let indice = 0; indice < pisoActivoConfig.plataformas.length; indice++) {
        const plataforma = pisoActivoConfig.plataformas[indice];
        const cruzaAltura = baseAnterior <= plataforma.y + 8 && baseActual >= plataforma.y;
        if (
            plataformaPermiteColision(plataforma, indice)
            && cruzaAltura
            && rangoJugadorSobrePlataforma(izquierda, derecha, plataforma, apoyoMinimo)
        ) {
            return { plataforma, indice };
        }
    }

    return null;
}

function detectarPlataformaPisada({ izquierda, derecha, apoyoMinimo, baseActual }) {
    for (let indice = 0; indice < pisoActivoConfig.plataformas.length; indice++) {
        const plataforma = pisoActivoConfig.plataformas[indice];
        const cercaDeSuperficie = Math.abs(baseActual - plataforma.y) <= 10;
        if (
            plataformaPermiteColision(plataforma, indice)
            && cercaDeSuperficie
            && rangoJugadorSobrePlataforma(izquierda, derecha, plataforma, apoyoMinimo)
        ) {
            return { plataforma, indice };
        }
    }

    return null;
}

function actualizarTrampasPlataformas(plataformaActual, tiempoActual) {
    pisoActivoConfig.plataformas.forEach((plataforma, indice) => {
        if (plataforma.tipo !== TIPOS_PLATAFORMA.PIVOTE) return;

        const estado = obtenerEstadoPlataforma(indice);
        const jugadorEncima = plataformaActual && plataformaActual.indice === indice;

        if (jugadorEncima && !estado.activada && pisoActivoConfig.trampasHabilitadas.includes(TRAMPAS.PIVOTE)) {
            estado.activada = true;
            estado.activadaEn = tiempoActual;
        }

        if (estado.activada) {
            const progreso = Math.min(1, (tiempoActual - estado.activadaEn) / 650);
            estado.angulo = progreso * (Math.PI / 2);
            estado.colisionActiva = estado.angulo < Math.PI / 4;
        }
    });
}

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

function dibujarTramoPlataforma(ctx, plataforma, xLocal = plataforma.x, yLocal = plataforma.y, opciones = {}) {
    const color = obtenerColorPiso();
    const altoTile = TILE_PISO_ALTO;
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

    if (plataforma.tipo === TIPOS_PLATAFORMA.RESBALADIZO) {
        ctx.fillStyle = "rgba(172, 235, 244, 0.22)";
        ctx.fillRect(xLocal + 6, yLocal + 2, plataforma.ancho - 12, 6);
    }
}

function dibujarBordeHueco(ctx, x, y, lado) {
    const borde = obtenerBordeHueco(lado);

    if (!borde.esFallback) {
        const ancho = TILE_PISO_ANCHO;
        const alto = TILE_PISO_ALTO;
        ctx.drawImage(borde, x - (lado === "der" ? ancho : 0), y, ancho, alto);
        return;
    }

    dibujarBordeHuecoFallback(ctx, x, y, lado);
}

function dibujarHuecoDespues(ctx, plataforma) {
    if (!plataforma.tieneHuecoDespues || plataforma.anchoHueco <= 0) return;

    const inicioHueco = plataforma.x + plataforma.ancho;
    const inicioSombraHueco = inicioHueco - CONFIG_HUECO.extensionBordeDer;
    const anchoSombraHueco = plataforma.anchoHueco + CONFIG_HUECO.extensionBordeDer + CONFIG_HUECO.extensionBordeIzq;
    const y = plataforma.y + CONFIG_HUECO.desplazamientoY;
    const gradiente = ctx.createLinearGradient(0, y, 0, canvas.height);
    gradiente.addColorStop(0, CONFIG_HUECO.colorSuperior);
    gradiente.addColorStop(0.55, CONFIG_HUECO.colorMedio);
    gradiente.addColorStop(1, CONFIG_HUECO.colorFondo);
    ctx.fillStyle = gradiente;
    ctx.fillRect(inicioSombraHueco, y, anchoSombraHueco, canvas.height - y);
}

function dibujarPlataformas(ctx, nivelActual, camaraActualX) {
    ctx.save();
    ctx.translate(-camaraActualX, 0);

    nivelActual.plataformas.forEach((plataforma) => {
        dibujarHuecoDespues(ctx, plataforma);
    });

    nivelActual.plataformas.forEach((plataforma, indice) => {
        const plataformaAnterior = nivelActual.plataformas[indice - 1];
        const opcionesBordes = {
            bordeIzq: Boolean(plataformaAnterior?.tieneHuecoDespues),
            bordeDer: Boolean(plataforma.tieneHuecoDespues)
        };

        if (plataforma.tipo === TIPOS_PLATAFORMA.PIVOTE && pisoActivoConfig.trampasHabilitadas.includes(TRAMPAS.PIVOTE)) {
            const estado = obtenerEstadoPlataforma(indice);
            const rutasTiles = obtenerRutasTilesTema(pisoActivoConfig.tilesTema);
            const trampa = AssetManager.obtenerImagen(rutasTiles.trampaPivote, {
                color: obtenerColorPiso(),
                tipo: "trampa",
                etiqueta: pisoActivoConfig.tilesTema
            });

            ctx.save();
            ctx.translate(plataforma.x + plataforma.ancho / 2, plataforma.y);
            ctx.rotate(estado.angulo);

            const temporal = {
                ...plataforma,
                x: -plataforma.ancho / 2,
                y: 0
            };
            dibujarTramoPlataforma(ctx, temporal, -plataforma.ancho / 2, 0, opcionesBordes);

            if (!trampa.esFallback) {
                const inicioTrampa = opcionesBordes.bordeIzq ? -plataforma.ancho / 2 + TILE_PISO_ANCHO : -plataforma.ancho / 2;
                const finTrampa = opcionesBordes.bordeDer ? plataforma.ancho / 2 - TILE_PISO_ANCHO : plataforma.ancho / 2;
                for (let x = inicioTrampa; x < finTrampa; x += TILE_PISO_ANCHO) {
                    const ancho = Math.min(TILE_PISO_ANCHO, finTrampa - x);
                    ctx.drawImage(trampa, x, 0, ancho, TILE_PISO_ALTO);
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

        dibujarTramoPlataforma(ctx, plataforma, plataforma.x, plataforma.y, opcionesBordes);
    });

    ctx.fillStyle = "#e0d6a8";
    ctx.font = "10px monospace";
    ctx.fillText(`${pisoActivoConfig.nombre.toUpperCase()} // ${pisoActivoConfig.tipoPiso.toUpperCase()}`, 24, nivel.pisoY - 16);
    ctx.restore();
}

function gameLoop(tiempoActual) {
    if (!configPersonaje || !configPersonaje.animaciones) {
        requestAnimationFrame(gameLoop);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const estabaEnElSuelo = jugador.enElSuelo;
    const yAnterior = jugador.y;

    // --- 1. FÍSICA Y GRAVEDAD ---
    jugador.velocidadY += gravedad; // La gravedad siempre empuja hacia abajo
    jugador.y += jugador.velocidadY;

    // --- 2. MOVIMIENTO HORIZONTAL ---
    const anchoJugador = obtenerAnchoJugador();
    const altoJugador = obtenerAlturaJugador();
    const offsetColisionX = obtenerOffsetColisionX();
    const offsetColisionY = obtenerOffsetColisionY();

    if (teclas.derecha && jugador.x + offsetColisionX + anchoJugador < nivel.anchoMundo) {
        jugador.x += configPersonaje.velocidad;
        jugador.direccion = "derecha";
    }
    if (teclas.izquierda && jugador.x > 0) {
        jugador.x -= configPersonaje.velocidad;
        jugador.direccion = "izquierda";
    }

    const jugadorIzquierda = jugador.x + offsetColisionX;
    const jugadorDerecha = jugadorIzquierda + anchoJugador;
    const apoyoMinimo = anchoJugador * 0.4;
    const baseJugador = jugador.y + offsetColisionY + altoJugador;
    const baseAnterior = yAnterior + offsetColisionY + altoJugador;

    jugador.enElSuelo = false;

    const plataformaAterrizaje = jugador.velocidadY >= 0
        ? detectarPlataformaAterrizaje({
            izquierda: jugadorIzquierda,
            derecha: jugadorDerecha,
            apoyoMinimo,
            baseAnterior,
            baseActual: baseJugador
        })
        : null;

    if (plataformaAterrizaje) {
        jugador.y = plataformaAterrizaje.plataforma.y - offsetColisionY - altoJugador;
        jugador.velocidadY = 0;
        jugador.enElSuelo = true;
        jugador.enSalto = false;
        jugador.caidaPorHueco = false;
        jugador.plataformaObjetivo = null;
        if (plataformaAterrizaje.plataforma.tipo !== TIPOS_PLATAFORMA.PIVOTE) {
            ultimaPlataformaSolida = plataformaAterrizaje.plataforma;
        }
    } else {
        const plataformaPisada = detectarPlataformaPisada({
            izquierda: jugadorIzquierda,
            derecha: jugadorDerecha,
            apoyoMinimo,
            baseActual: baseJugador
        });

        if (plataformaPisada && estabaEnElSuelo && jugador.velocidadY >= 0) {
            jugador.y = plataformaPisada.plataforma.y - offsetColisionY - altoJugador;
            jugador.velocidadY = 0;
            jugador.enElSuelo = true;
            jugador.caidaPorHueco = false;
            if (plataformaPisada.plataforma.tipo !== TIPOS_PLATAFORMA.PIVOTE) {
                ultimaPlataformaSolida = plataformaPisada.plataforma;
            }
        }
    }

    if (estabaEnElSuelo && !jugador.enElSuelo && !jugador.enSalto && ultimaPlataformaSolida) {
        jugador.caidaPorHueco = true;
    }

    const plataformaActual = jugador.enElSuelo
        ? detectarPlataformaPisada({
            izquierda: jugadorIzquierda,
            derecha: jugadorDerecha,
            apoyoMinimo,
            baseActual: jugador.y + offsetColisionY + altoJugador
        })
        : null;

    actualizarTrampasPlataformas(plataformaActual, tiempoActual);

    if (jugador.y > canvas.height + 50) {
        reiniciarJugador();
    }

    // Salto (solo si esta en el suelo)
    if (teclas.salto && jugador.enElSuelo) {
        jugador.velocidadY = -configPersonaje.fuerzaSalto; // Empuje hacia arriba
        jugador.enElSuelo = false;
        jugador.enSalto = true;
        jugador.caidaPorHueco = false;
        jugador.plataformaObjetivo = true;
        teclas.salto = false; // Evita que salte infinitamente si dejas presionado
    }

    // --- 3. SELECCIÓN DE ESTADO ---
    const estadoAnterior = jugador.estado;
    if (!jugador.enElSuelo) {
        jugador.estado = "saltar";
    } else if (teclas.derecha || teclas.izquierda) {
        jugador.estado = "correr";
    } else {
        jugador.estado = "quieto";
    }

    if (estadoAnterior !== jugador.estado) {
        jugador.frameActual = 0;
        jugador.contadorTiempo = 0;
    }

    const anim = configPersonaje.animaciones[jugador.estado];
    if (!anim || !anim.spriteSheet || !anim.spriteSheet.complete || anim.spriteSheet.naturalWidth === 0) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // --- 4. GESTIÓN DE ANIMACIÓN ---
    jugador.contadorTiempo++;
    
    if (jugador.contadorTiempo >= anim.limiteTiempo) {
        jugador.contadorTiempo = 0;
        jugador.frameActual++;
        
        if (jugador.frameActual >= anim.totalFrames) {
            // Si está saltando, se queda congelado en el último fotograma de salto
            if(jugador.estado === 'saltar') {
                jugador.frameActual = anim.totalFrames - 1;
            } else {
                jugador.frameActual = 0; 
            }
        }
    }

    // --- 5. DIBUJAR EN EL CANVAS ---
    const objetivoCamara = jugador.x - canvas.width * 0.38;
    camaraX += (Math.max(0, Math.min(objetivoCamara, nivel.anchoMundo - canvas.width)) - camaraX) * 0.12;
    dibujarEscenario(camaraX);
    dibujarPlataformas(ctx, pisoActivoConfig, camaraX);
    const jugadorEnPantallaX = jugador.x - camaraX;
    const renderPersonaje = obtenerRenderPersonaje(anim);
    const jugadorRenderX = jugadorEnPantallaX + renderPersonaje.offsetX;
    const jugadorRenderY = jugador.y + renderPersonaje.offsetY;

    ctx.save();
    if (jugador.direccion === "izquierda") {
        ctx.translate(jugadorRenderX + renderPersonaje.ancho, jugadorRenderY);
        ctx.scale(-1, 1);
        ctx.drawImage(anim.spriteSheet, jugador.frameActual * anim.anchoFrame, 0, anim.anchoFrame, anim.altoFrame, 0, 0, renderPersonaje.ancho, renderPersonaje.alto);
    } else {
        ctx.drawImage(anim.spriteSheet, jugador.frameActual * anim.anchoFrame, 0, anim.anchoFrame, anim.altoFrame, jugadorRenderX, jugadorRenderY, renderPersonaje.ancho, renderPersonaje.alto);
    }
    ctx.restore();

    dibujarHud();
    
    requestAnimationFrame(gameLoop);
}

async function iniciarJuego() {
    try {
        inicializarSelectorPisos();
        inicializarEstadosPlataformas();
        await Promise.all([
            cargarSpritesPersonajes(),
            cargarAssetsEscenario()
        ]);
        colocarJugadorSobrePlataforma(ultimaPlataformaSolida);
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error("No se pudieron cargar los sprites:", error);
    }
}

iniciarJuego();
