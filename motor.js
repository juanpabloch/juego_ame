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
};

function obtenerAlturaJugador() {
    const anim = configPersonaje?.animaciones?.[jugador.estado];
    return anim ? anim.altoFrame : 181;
}

// Reglas del mundo
const gravedad = 0.6;
const nivel = {
    pisoY: canvas.height - 35,
    huecoInicio: 360,
    huecoAncho: 150,
    respawnX: 100,
    respawnY: 180,
};
const suelo = nivel.pisoY;

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
    jugador.y = nivel.respawnY;
    jugador.x = nivel.respawnX;
    jugador.velocidadY = 0;
    jugador.enElSuelo = true;
    
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

function dibujarHud() {
    const corazonesLlenos = "♥".repeat(jugador.vida);
    const corazonesVacios = "♡".repeat(Math.max(0, jugador.vidaMaxima - jugador.vida));

    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(20, 18, 150, 32);
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${corazonesLlenos}${corazonesVacios}`, 30, 40);
}

function dibujarPiso() {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, nivel.pisoY);
    ctx.lineTo(nivel.huecoInicio, nivel.pisoY);
    ctx.moveTo(nivel.huecoInicio + nivel.huecoAncho, nivel.pisoY);
    ctx.lineTo(canvas.width, nivel.pisoY);
    ctx.stroke();
}

function reiniciarJugador() {
    quitarVida(1);
    if (jugador.vida <= 0) {
        jugador.vida = jugador.vidaMaxima;
    }

    jugador.x = nivel.respawnX;
    jugador.y = nivel.respawnY;
    jugador.velocidadY = 0;
    jugador.enElSuelo = true;
    jugador.estado = "quieto";
    jugador.frameActual = 0;
    jugador.contadorTiempo = 0;
}

function gameLoop() {
    if (!configPersonaje || !configPersonaje.animaciones) {
        requestAnimationFrame(gameLoop);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // --- 1. FÍSICA Y GRAVEDAD ---
    jugador.velocidadY += gravedad; // La gravedad siempre empuja hacia abajo
    jugador.y += jugador.velocidadY;

    const alturaPersonaje = obtenerAlturaJugador();
    const centroX = jugador.x + configPersonaje.animaciones.correr.anchoFrame / 2;
    const dentroHueco = centroX > nivel.huecoInicio && centroX < nivel.huecoInicio + nivel.huecoAncho;
    const baseJugador = jugador.y + alturaPersonaje;

    jugador.enElSuelo = false;

    // Colisión con el suelo
    if (!dentroHueco && baseJugador >= suelo) {
        jugador.y = suelo - alturaPersonaje;
        jugador.velocidadY = 0;
        jugador.enElSuelo = true;
    }

    if (jugador.y > canvas.height + 60) {
        reiniciarJugador();
    }

    // Salto (solo si está en el suelo)
    if (teclas.salto && jugador.enElSuelo) {
        jugador.velocidadY = -configPersonaje.fuerzaSalto; // Empuje hacia arriba
        jugador.enElSuelo = false;
        teclas.salto = false; // Evita que salte infinitamente si dejas presionado
    }

    // --- 2. MOVIMIENTO HORIZONTAL ---
    if (teclas.derecha && jugador.x < canvas.width - configPersonaje.animaciones.correr.anchoFrame / 2) {
        jugador.x += configPersonaje.velocidad;
        jugador.direccion = "derecha";
    }
    if (teclas.izquierda && jugador.x > -configPersonaje.animaciones.correr.anchoFrame / 4) {
        jugador.x -= configPersonaje.velocidad;
        jugador.direccion = "izquierda";
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
    dibujarPiso();

    ctx.save();
    if (jugador.direccion === "izquierda") {
        ctx.translate(jugador.x + anim.anchoFrame, jugador.y);
        ctx.scale(-1, 1);
        ctx.drawImage(anim.spriteSheet, jugador.frameActual * anim.anchoFrame, 0, anim.anchoFrame, anim.altoFrame, 0, 0, anim.anchoFrame, anim.altoFrame);
    } else {
        ctx.drawImage(anim.spriteSheet, jugador.frameActual * anim.anchoFrame, 0, anim.anchoFrame, anim.altoFrame, jugador.x, jugador.y, anim.anchoFrame, anim.altoFrame);
    }
    ctx.restore();

    dibujarHud();
    
    requestAnimationFrame(gameLoop);
}

async function iniciarJuego() {
    try {
        await cargarSpritesPersonajes();
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error("No se pudieron cargar los sprites:", error);
    }
}

iniciarJuego();
