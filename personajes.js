// Carga de imagenes para el Personaje 1
const p1Correr = new Image(); p1Correr.src = "assets/sprites/jp/correr.png";
const p1Quieto = new Image(); p1Quieto.src = "assets/sprites/jp/quieto.png";
const p1Salto = new Image(); p1Salto.src = "assets/sprites/jp/salto.png";

// Carga de imagenes para el Personaje 2
const p2Correr = new Image(); p2Correr.src = "assets/sprites/ame/correr.png"; 
const p2Quieto = new Image(); p2Quieto.src = "assets/sprites/ame/quieto.png";
const p2Salto = new Image(); p2Salto.src = "assets/sprites/ame/salto.png";

// Base de datos de habilidades y dimensiones
const personajesDisponibles = {
    personaje1: {
        nombre: "Juan",
        velocidad: 4, // correr
        fuerzaSalto: 14,
        vidaMaxima: 3,
        render: {
            escala: 1.2,
            offsetX: 0,
            offsetY: -10
        },
        colision: {
            ancho: 64,
            alto: 172,
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
            }
        }
    },
    personaje2: {
        nombre: "Ame",
        velocidad: 5,    // correr
        fuerzaSalto: 12,
        vidaMaxima: 3,
        render: {
            escala: 1.1,
            offsetX: 0,
            offsetY: 5
        },
        colision: {
            ancho: 66,
            alto: 172,
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
            }

        }
    }
};

function cargarSpritesPersonajes() {
    const recursos = Object.values(personajesDisponibles)
        .flatMap(personaje => Object.values(personaje.animaciones))
        .map(animacion => animacion.spriteSheet);

    return Promise.all(recursos.map((imagen) => new Promise((resolve, reject) => {
        if (imagen.complete && imagen.naturalWidth > 0) {
            resolve();
            return;
        }

        imagen.onload = resolve;
        imagen.onerror = () => reject(new Error(`No se pudo cargar el sprite: ${imagen.src}`));
    })));
} 
