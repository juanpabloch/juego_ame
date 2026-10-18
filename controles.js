// Diccionario que guarda el estado actual y eventos con buffer de las teclas (estilo Cuphead)
const teclas = {
    derecha: false,
    izquierda: false,
    abajo: false,
    arriba: false,
    salto: false,          // Compatibilidad directa / pulso de salto
    saltoMantener: false,  // Si mantiene presionado Espacio/Z (para altura de salto variable)
    saltoSoltado: false,   // Pulso al soltar Espacio/Z (corta la subida si se suelta antes)
    ultimoSaltoMs: -9999,  // Timestamp para Jump Buffer y Parry aéreo
    dash: false,           // Pulso de Dash
    dashMantener: false,
    ultimoDashMs: -9999
};

function esElementoInteractivo(elemento) {
    if (!elemento) return false;
    const tag = elemento.tagName;
    return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || elemento.isContentEditable;
}

window.addEventListener("keydown", (event) => {
    if (esElementoInteractivo( document.activeElement )) return;

    const ahora = performance.now();

    if (event.code === "ArrowRight" || event.code === "KeyD") {
        teclas.derecha = true;
    }
    if (event.code === "ArrowLeft" || event.code === "KeyA") {
        teclas.izquierda = true;
    }
    if (event.code === "ArrowDown" || event.code === "KeyS") {
        teclas.abajo = true;
        event.preventDefault();
    }
    if (event.code === "ArrowUp" || event.code === "KeyW") {
        teclas.arriba = true;
        event.preventDefault();
    }

    if (event.code === "Space" || event.code === "KeyZ") {
        event.preventDefault();
        if (event.repeat) return;
        teclas.salto = true;
        teclas.saltoMantener = true;
        teclas.saltoSoltado = false;
        teclas.ultimoSaltoMs = ahora;
    }

    if (event.code === "ShiftLeft" || event.code === "ShiftRight" || event.code === "KeyX" || event.code === "KeyK") {
        event.preventDefault();
        if (event.repeat) return;
        teclas.dash = true;
        teclas.dashMantener = true;
        teclas.ultimoDashMs = ahora;
    }
});

window.addEventListener("keyup", (event) => {
    if (event.code === "ArrowRight" || event.code === "KeyD") {
        teclas.derecha = false;
    }
    if (event.code === "ArrowLeft" || event.code === "KeyA") {
        teclas.izquierda = false;
    }
    if (event.code === "ArrowDown" || event.code === "KeyS") {
        teclas.abajo = false;
    }
    if (event.code === "ArrowUp" || event.code === "KeyW") {
        teclas.arriba = false;
    }

    if (event.code === "Space" || event.code === "KeyZ") {
        teclas.salto = false;
        teclas.saltoMantener = false;
        teclas.saltoSoltado = true;
        event.preventDefault();
    }

    if (event.code === "ShiftLeft" || event.code === "ShiftRight" || event.code === "KeyX" || event.code === "KeyK") {
        teclas.dash = false;
        teclas.dashMantener = false;
    }
});

window.addEventListener("blur", () => {
    teclas.derecha = false;
    teclas.izquierda = false;
    teclas.abajo = false;
    teclas.arriba = false;
    teclas.salto = false;
    teclas.saltoMantener = false;
    teclas.dash = false;
    teclas.dashMantener = false;
});

