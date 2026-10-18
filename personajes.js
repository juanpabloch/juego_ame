function crearImagenSprite(ruta, opcional = false) {
    const img = new Image();
    img.dataset.opcional = opcional ? "1" : "0";
    img.dataset.ruta = ruta;
    img.esFallback = false;
    img.onerror = () => {
        if (opcional) {
            img.esFallback = true;
        }
    };
    img.src = ruta;
    return img;
}

// Carga de imagenes para el Personaje 1 (Juan)
const p1Correr = crearImagenSprite("assets/sprites/jp/correr.png", false);
const p1Quieto = crearImagenSprite("assets/sprites/jp/quieto.png", false);
const p1Salto = crearImagenSprite("assets/sprites/jp/salto.png", false);
const p1DobleSalto = crearImagenSprite("assets/sprites/jp/doble_salto.png", true);
const p1Agachar = crearImagenSprite("assets/sprites/jp/agachar.png", true);
const p1Dash = crearImagenSprite("assets/sprites/jp/dash.png", true);
const p1Dano = crearImagenSprite("assets/sprites/jp/dano.png", true);

// Carga de imagenes para el Personaje 2 (Ame)
const p2Correr = crearImagenSprite("assets/sprites/ame/correr.png", false);
const p2Quieto = crearImagenSprite("assets/sprites/ame/quieto.png", false);
const p2Salto = crearImagenSprite("assets/sprites/ame/salto.png", false);
const p2DobleSalto = crearImagenSprite("assets/sprites/ame/doble_salto.png", true);
const p2Agachar = crearImagenSprite("assets/sprites/ame/agachar.png", true);
const p2Dash = crearImagenSprite("assets/sprites/ame/dash.png", true);
const p2Dano = crearImagenSprite("assets/sprites/ame/dano.png", true);

// Base de datos de habilidades y dimensiones
const personajesDisponibles = {
    personaje1: {
        nombre: "Juan",
        velocidad: 4.3,          // correr base (60fps)
        velocidadAgachado: 1.8,  // caminar agachado
        fuerzaSalto: 14,         // impulso del primer salto
        fuerzaDobleSalto: 12.8,  // impulso del segundo salto en el aire (cuando obtiene el poder)
        dobleSaltoInicial: false,// false = debe recoger el poder "doble_salto" en algún piso
        velocidadDash: 11.5,     // impulso de dash
        duracionDashMs: 165,     // duración del dash sin gravedad
        cooldownDashMs: 260,     // espera mínima entre dashes en suelo
        vidaMaxima: 3,
        render: {
            escala: 1.2,
            offsetX: 0,
            offsetY: -10
        },
        colision: {
            ancho: 64,
            alto: 172,
            altoAgachado: 96,    // La mitad superior baja para esquivar proyectiles/láseres altos
            offsetX: 44,
            offsetY: 15
        },
        animaciones: {
            correr: {
                spriteSheet: p1Correr,
                anchoFrame: 128,
                altoFrame: 181,
                totalFrames: 4,
                limiteTiempo: 8
            },
            quieto: {
                spriteSheet: p1Quieto,
                anchoFrame: 128,
                altoFrame: 181,
                totalFrames: 2,
                limiteTiempo: 25
            },
            saltar: {
                spriteSheet: p1Salto,
                anchoFrame: 128,
                altoFrame: 181,
                totalFrames: 3,
                limiteTiempo: 6
            },
            doble_salto: {
                spriteSheet: p1DobleSalto,
                fallbackSheet: p1Salto,
                anchoFrame: 128,
                altoFrame: 181,
                totalFrames: 3,
                limiteTiempo: 5,
                opcional: true
            },
            agachar: {
                spriteSheet: p1Agachar,
                fallbackSheet: p1Quieto,
                anchoFrame: 128,
                altoFrame: 181,
                totalFrames: 2,
                limiteTiempo: 18,
                opcional: true
            },
            dash: {
                spriteSheet: p1Dash,
                fallbackSheet: p1Correr,
                anchoFrame: 128,
                altoFrame: 181,
                totalFrames: 2,
                limiteTiempo: 4,
                opcional: true
            },
            dano: {
                spriteSheet: p1Dano,
                fallbackSheet: p1Salto,
                anchoFrame: 128,
                altoFrame: 181,
                totalFrames: 2,
                limiteTiempo: 6,
                opcional: true
            }
        }
    },
    personaje2: {
        nombre: "Ame",
        velocidad: 5.2,          // correr base (60fps)
        velocidadAgachado: 2.2,  // caminar agachada
        fuerzaSalto: 12.4,       // impulso del primer salto
        fuerzaDobleSalto: 11.6,  // impulso del segundo salto en el aire (cuando obtiene el poder)
        dobleSaltoInicial: false,// false = debe recoger el poder "doble_salto" en algún piso
        velocidadDash: 12.5,     // dash más ágil
        duracionDashMs: 160,
        cooldownDashMs: 240,
        vidaMaxima: 3,
        render: {
            escala: 1.1,
            offsetX: 0,
            offsetY: 5
        },
        colision: {
            ancho: 66,
            alto: 172,
            altoAgachado: 96,
            offsetX: 38,
            offsetY: 20
        },
        animaciones: {
            correr: {
                spriteSheet: p2Correr,
                anchoFrame: 128,
                altoFrame: 181,
                totalFrames: 4,
                limiteTiempo: 7
            },
            quieto: {
                spriteSheet: p2Quieto,
                anchoFrame: 128,
                altoFrame: 181,
                totalFrames: 2,
                limiteTiempo: 28
            },
            saltar: {
                spriteSheet: p2Salto,
                anchoFrame: 128,
                altoFrame: 181,
                totalFrames: 3,
                limiteTiempo: 6
            },
            doble_salto: {
                spriteSheet: p2DobleSalto,
                fallbackSheet: p2Salto,
                anchoFrame: 128,
                altoFrame: 181,
                totalFrames: 3,
                limiteTiempo: 5,
                opcional: true
            },
            agachar: {
                spriteSheet: p2Agachar,
                fallbackSheet: p2Quieto,
                anchoFrame: 128,
                altoFrame: 181,
                totalFrames: 2,
                limiteTiempo: 18,
                opcional: true
            },
            dash: {
                spriteSheet: p2Dash,
                fallbackSheet: p2Correr,
                anchoFrame: 128,
                altoFrame: 181,
                totalFrames: 2,
                limiteTiempo: 4,
                opcional: true
            },
            dano: {
                spriteSheet: p2Dano,
                fallbackSheet: p2Salto,
                anchoFrame: 128,
                altoFrame: 181,
                totalFrames: 2,
                limiteTiempo: 6,
                opcional: true
            }
        }
    }
};

function sincronizarFramesAnimacion(anim) {
    const img = anim.spriteSheet;
    if (img && !img.esFallback && img.complete && img.naturalWidth >= anim.anchoFrame) {
        const framesDetectados = Math.round(img.naturalWidth / anim.anchoFrame);
        if (framesDetectados >= 1) {
            anim.totalFrames = framesDetectados;
        }
    }
}

function cargarSpritesPersonajes() {
    const entradasAnimacion = Object.values(personajesDisponibles)
        .flatMap((personaje) => Object.values(personaje.animaciones));

    return Promise.all(entradasAnimacion.map((anim) => new Promise((resolve) => {
        const imagen = anim.spriteSheet;
        const esOpcional = Boolean(anim.opcional || imagen.dataset.opcional === "1");

        // Caso 1: Ya cargó correctamente antes de ejecutar cargarSpritesPersonajes()
        if (imagen.complete && imagen.naturalWidth > 0) {
            imagen.esFallback = false;
            sincronizarFramesAnimacion(anim);
            resolve();
            return;
        }

        // Caso 2: Ya terminó de intentar cargar pero falló (muy común en file:// con sprites opcionales aún no creados)
        if (imagen.complete && imagen.naturalWidth === 0) {
            imagen.esFallback = true;
            if (!esOpcional) {
                console.warn(`No se pudo cargar el sprite: ${imagen.src}`);
            }
            resolve();
            return;
        }

        imagen.onload = () => {
            imagen.esFallback = false;
            sincronizarFramesAnimacion(anim);
            resolve();
        };

        imagen.onerror = () => {
            imagen.esFallback = true;
            if (!esOpcional) {
                console.warn(`No se pudo cargar el sprite: ${imagen.src}`);
            }
            resolve();
        };
    })));
}
 
