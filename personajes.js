// Carga de imagenes para el Personaje 1
const p1Correr = new Image(); p1Correr.src = "assets/personajes/img/correr-jp.png";
const p1Quieto = new Image(); p1Quieto.src = "assets/personajes/img/quieto-jp.png";
const p1Salto = new Image(); p1Salto.src = "assets/personajes/img/salto-jp.png";

// Carga de imagenes para el Personaje 2 (Guardia - reusando imagenes por ahora)
const p2Correr = new Image(); p2Correr.src = "assets/personajes/img/correr-ame.png"; 
const p2Quieto = new Image(); p2Quieto.src = "assets/personajes/img/quieto-ame.png";
const p2Salto = new Image(); p2Salto.src = "assets/personajes/img/salto-ame.png";

// Base de datos de habilidades y dimensiones
const personajesDisponibles = {
    personaje1: {
        nombre: "Juan",
        velocidad: 4, // correr
        fuerzaSalto: 14,
        vidaMaxima: 3,
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
