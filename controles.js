// Diccionario que guarda el estado actual de las teclas
const teclas = {
    derecha: false,
    izquierda: false,
    salto: false
};

window.addEventListener("keydown", (event) => {
    if (event.code === "ArrowRight") teclas.derecha = true;
    if (event.code === "ArrowLeft") teclas.izquierda = true;
    if (event.code === "Space") {
        if (event.repeat) return;
        teclas.salto = true;
        event.preventDefault();
    }
});

window.addEventListener("keyup", (event) => {
    if (event.code === "ArrowRight") teclas.derecha = false;
    if (event.code === "ArrowLeft") teclas.izquierda = false;
    if (event.code === "Space") {
        teclas.salto = false;
        event.preventDefault();
    }
});
