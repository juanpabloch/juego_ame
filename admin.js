// Editor de pisos. Lee PISOS_CONFIG (niveles.js) y genera un niveles.js nuevo al guardar.
// Va dentro de una funcion para no chocar con los nombres globales de niveles_base.js.
(() => {
    "use strict";

    // Deben coincidir con motor.js y escenario.js
    const ANCHO_PANTALLA = 1280;
    const ALTO_MUNDO = 720;
    const ANCHO_TILE = 128;
    const ALTO_TILE = 64;
    const GRAVEDAD = 0.6;
    const APOYO_MINIMO = 0.4;
    const ANCHO_MUNDO_MINIMO = 800;
    const COLORES_PISO = {
        linoleo: "#9ca58e",
        parque: "#7b533c",
        concreto: "#838982",
        azulejo: "#8fb5b3"
    };

    const ANCHO_MINIMO = 64;
    const ANCHO_NUEVA = 384;
    const ALTO_REGLA = 22;
    const MAX_HISTORIAL = 100;
    const MAX_VARIANTES = 12;
    const CLAVE_BORRADOR = "juego_ame:admin:borrador";
    const FUENTE_MONO = "ui-monospace, Menlo, Consolas, monospace";

    const TIPOS = [
        { id: TIPOS_PLATAFORMA.NORMAL, nombre: "Normal", color: "#aab4c3", sinHueco: "piso", conHueco: "pisoConHueco" },
        { id: TIPOS_PLATAFORMA.PIVOTE, nombre: "Pivote", color: "#f59e42", sinHueco: "pivote", conHueco: "pivoteConHueco" },
        { id: TIPOS_PLATAFORMA.RESBALADIZO, nombre: "Resbaladizo", color: "#5cc8e0", sinHueco: "pisoResbaladizo", conHueco: "pisoResbaladizoConHueco" }
    ];
    const MODOS = [
        { id: MODOS_OBJETO.FONDO, nombre: "Fondo", color: "#b9a3f5", ayuda: "Solo se ve. El jugador pasa por delante." },
        { id: MODOS_OBJETO.PLATAFORMA, nombre: "Encima", color: "#7fd1a0", ayuda: "El jugador se para encima. De costado y desde abajo lo atraviesa." },
        { id: MODOS_OBJETO.SOLIDO, nombre: "Sólido", color: "#e879c5", ayuda: "El jugador se para encima y además choca de costado y desde abajo." }
    ];
    const HERRAMIENTA_OBJETO = "objeto";
    const TAMANO_OBJETO = 96;
    const LADO_MINIMO_OBJETO = 16;
    const HERRAMIENTA_HUECO = "hueco";
    const ANCHO_HUECO_NUEVO = 128;
    const COLOR_HUECO = "#f0616d";
    const PISTAS = {
        seleccionar: "Seleccionar: haz clic en una plataforma para elegirla, arrástrala para moverla y arrastra sus bordes blancos para cambiarle el ancho. Arrastrar el fondo desplaza la vista.",
        normal: "Piso: arrastra en horizontal para pintar piso normal. Rellena huecos y reemplaza las trampas que haya en ese tramo.",
        pivote: "Pivote: arrastra sobre el piso para convertir ese tramo en una trampa que se cae al pisarla.",
        resbaladizo: "Resbaladizo: arrastra sobre el piso para convertir ese tramo en piso resbaladizo.",
        hueco: "Hueco: arrastra sobre el piso para abrir un hueco de ese ancho. Un clic abre uno de 128px.",
        objeto: "Objeto: haz clic donde quieras colocarlo. Después elige su imagen y si es de fondo, para saltar encima o sólido."
    };
    const COLORES_SALTO = { ok: "#4cc38a", justo: "#f2b84b", parcial: "#f2b84b", imposible: "#f0616d" };
    const CLAVES_PISO = [
        "id", "nombre", "fondoRuta", "colorPlaceholder", "tipoPiso", "tilesTema",
        "tilesVariantes", "trampasHabilitadas", "propsPermitidos", "objetos", "plataformas"
    ];

    const $ = (id) => document.getElementById(id);

    function h(etiqueta, atributos = {}, ...hijos) {
        const nodo = document.createElement(etiqueta);
        Object.entries(atributos).forEach(([clave, valor]) => {
            if (clave === "class") nodo.className = valor;
            else if (clave.startsWith("on")) nodo.addEventListener(clave.slice(2), valor);
            else if (valor !== false && valor !== null && valor !== undefined) nodo.setAttribute(clave, valor);
        });
        nodo.append(...hijos.filter((hijo) => hijo !== null && hijo !== undefined && hijo !== false));
        return nodo;
    }

    const estado = {
        pisos: [],
        indice: 0,
        seleccion: null,
        seleccionObjeto: null,
        ultimoObjeto: PROPS.CAJAS,
        ultimoModo: MODOS_OBJETO.FONDO,
        herramienta: "seleccionar",
        snap: 32,
        personaje: Object.keys(personajesDisponibles)[0],
        verArcos: true,
        verFondo: true
    };
    const vista = { x: 0, y: 0, zoom: 1 };
    const tamano = { ancho: 0, alto: 0 };
    const historial = { pasado: [], futuro: [] };
    const activos = new Map();

    let contadorUid = 0;
    let firmasBase = new Map();
    let contenidoBase = "";
    let problemas = new Map();
    let manejadorArchivo = null;
    let arrastre = null;
    let espacioPulsado = false;
    let cursorMundo = null;
    let renderPendiente = false;
    let revalidacionPendiente = false;
    let temporizadorBorrador = null;
    let campoEditando = null;

    const lienzo = $("editorCanvas");
    const ctx = lienzo.getContext("2d");
    const minimapa = $("minimapa");
    const ctxMini = minimapa.getContext("2d");

    function pisoActivo() {
        return estado.pisos[estado.indice] || null;
    }

    function plataformaSeleccionada() {
        const piso = pisoActivo();
        return piso && estado.seleccion !== null ? piso.plataformas[estado.seleccion] || null : null;
    }

    function objetoSeleccionado() {
        const piso = pisoActivo();
        return piso && estado.seleccionObjeto !== null ? piso.objetos[estado.seleccionObjeto] || null : null;
    }

    function limpiarSeleccion() {
        estado.seleccion = null;
        estado.seleccionObjeto = null;
    }

    // ---------------------------------------------------------------- Modelo

    function ordenar(piso, mantener = null) {
        piso.plataformas.sort((a, b) => a.x - b.x || a.y - b.y);
        if (mantener) estado.seleccion = piso.plataformas.indexOf(mantener);
    }

    // El hueco no se guarda en el editor: es el espacio hasta la plataforma siguiente.
    function huecoDespues(plataformas, indice) {
        const siguiente = plataformas[indice + 1];
        if (!siguiente) return 0;
        return Math.max(0, siguiente.x - (plataformas[indice].x + plataformas[indice].ancho));
    }

    function anchoMundo(piso) {
        return piso.plataformas.reduce((maximo, p) => Math.max(maximo, p.x + p.ancho), ANCHO_MUNDO_MINIMO);
    }

    function importarPiso(crudo) {
        const piso = JSON.parse(JSON.stringify(crudo));
        const originales = [...(crudo.plataformas || [])].sort((a, b) => a.x - b.x || a.y - b.y);

        piso._uid = crudo._uid || `p${++contadorUid}`;
        piso.id = Number(crudo.id);
        piso.nombre = crudo.nombre || "";
        piso.fondoRuta = crudo.fondoRuta || "";
        piso.colorPlaceholder = crudo.colorPlaceholder || "#2d3a34";
        piso.tipoPiso = crudo.tipoPiso || Object.values(TIPOS_PISO)[0];
        piso.tilesTema = crudo.tilesTema || TEMA_TILES_DEFAULT;
        piso.tilesVariantes = Number(crudo.tilesVariantes) || 0;
        piso.trampasHabilitadas = [...(crudo.trampasHabilitadas || [])];
        piso.propsPermitidos = [...(crudo.propsPermitidos || [])];
        piso.plataformas = originales.map((p) => ({
            x: Number(p.x) || 0,
            y: Number.isFinite(p.y) ? p.y : ALTURA_PLATAFORMA_DEFAULT,
            ancho: Number(p.ancho) || ANCHO_TILE,
            tipo: p.tipo || TIPOS_PLATAFORMA.NORMAL
        }));
        piso.objetos = (crudo.objetos || []).map((o) => ({
            tipo: String(o.tipo || ""),
            x: Number(o.x) || 0,
            y: Number(o.y) || 0,
            ancho: Number(o.ancho) || TAMANO_OBJETO,
            alto: Number(o.alto) || TAMANO_OBJETO,
            modo: MODOS.some((modo) => modo.id === o.modo) ? o.modo : MODOS_OBJETO.FONDO
        }));

        if (!crudo._notas) {
            piso._notas = [];
            originales.forEach((p, i) => {
                const declarado = p.tieneHuecoDespues ? p.anchoHueco || 0 : 0;
                const real = huecoDespues(piso.plataformas, i);
                if (declarado === real) return;
                piso._notas.push({
                    plataforma: i,
                    mensaje: i === originales.length - 1
                        ? `niveles.js declara un hueco de ${declarado}px después de la última plataforma. No tiene nada del otro lado, así que se descarta.`
                        : `niveles.js declara un hueco de ${declarado}px después de la plataforma ${i + 1}, pero el espacio real hasta la siguiente es de ${real}px. El editor usa el espacio real.`
                });
            });
        }

        return piso;
    }

    function exportarPlataformas(piso) {
        return piso.plataformas.map((p, i) => {
            const hueco = huecoDespues(piso.plataformas, i);
            return { x: p.x, y: p.y, ancho: p.ancho, tipo: p.tipo, tieneHuecoDespues: hueco > 0, anchoHueco: hueco };
        });
    }

    function exportarPiso(piso) {
        const limpio = {};
        Object.keys(piso).filter((clave) => !clave.startsWith("_")).forEach((clave) => {
            limpio[clave] = piso[clave];
        });
        limpio.plataformas = exportarPlataformas(piso);
        return JSON.parse(JSON.stringify(limpio));
    }

    function siguienteId() {
        return estado.pisos.reduce((maximo, piso) => Math.max(maximo, piso.id || 0), 0) + 1;
    }

    // ------------------------------------------------- Generacion de codigo

    function refEnum(nombre, objeto, valor) {
        const clave = Object.keys(objeto).find((k) => objeto[k] === valor);
        return clave ? `${nombre}.${clave}` : JSON.stringify(valor);
    }

    function codigoPlataforma(p) {
        const tipo = TIPOS.find((t) => t.id === p.tipo);
        const conAltura = p.y !== ALTURA_PLATAFORMA_DEFAULT;

        if (!tipo) {
            const opciones = [
                conAltura && `y: ${p.y}`,
                p.tieneHuecoDespues && `tieneHuecoDespues: true, anchoHueco: ${p.anchoHueco}`
            ].filter(Boolean).join(", ");
            return `crearPlataforma(${p.x}, ${p.ancho}, ${JSON.stringify(p.tipo)}${opciones ? `, { ${opciones} }` : ""})`;
        }

        const opciones = conAltura ? `, { y: ${p.y} }` : "";
        return p.tieneHuecoDespues
            ? `${tipo.conHueco}(${p.x}, ${p.ancho}, ${p.anchoHueco}${opciones})`
            : `${tipo.sinHueco}(${p.x}, ${p.ancho}${opciones})`;
    }

    function codigoPiso(piso) {
        const extras = Object.keys(piso)
            .filter((clave) => !CLAVES_PISO.includes(clave) && !clave.startsWith("_"))
            .map((clave) => `${clave}: ${JSON.stringify(piso[clave])}`);
        const plataformas = exportarPlataformas(piso).map((p) => `            ${codigoPlataforma(p)}`);
        const objetos = (piso.objetos || []).map((o) =>
            `            objeto(${JSON.stringify(o.tipo)}, ${o.x}, ${o.y}, ${o.ancho}, ${o.alto}, ${refEnum("MODOS_OBJETO", MODOS_OBJETO, o.modo)})`);
        const lineas = [
            `id: ${piso.id}`,
            `nombre: ${JSON.stringify(piso.nombre)}`,
            `fondoRuta: ${JSON.stringify(piso.fondoRuta)}`,
            `colorPlaceholder: ${JSON.stringify(piso.colorPlaceholder)}`,
            `tipoPiso: ${refEnum("TIPOS_PISO", TIPOS_PISO, piso.tipoPiso)}`,
            `tilesTema: ${JSON.stringify(piso.tilesTema)}`,
            `tilesVariantes: ${piso.tilesVariantes}`,
            `trampasHabilitadas: [${piso.trampasHabilitadas.map((t) => refEnum("TRAMPAS", TRAMPAS, t)).join(", ")}]`,
            `propsPermitidos: [${piso.propsPermitidos.map((p) => refEnum("PROPS", PROPS, p)).join(", ")}]`,
            ...extras,
            objetos.length && `objetos: [\n${objetos.join(",\n")}\n        ]`,
            plataformas.length ? `plataformas: [\n${plataformas.join(",\n")}\n        ]` : "plataformas: []"
        ].filter(Boolean);
        return `    {\n${lineas.map((linea) => `        ${linea}`).join(",\n")}\n    }`;
    }

    function generarArchivoNiveles() {
        return [
            "// Datos de los pisos. admin.html reescribe este archivo al guardar.",
            "// Las constantes y funciones que usa (TIPOS_PISO, TRAMPAS, PROPS, piso, pisoConHueco, objeto, ...)",
            "// estan en niveles_base.js.",
            "",
            "const PISOS_CONFIG = [",
            estado.pisos.map(codigoPiso).join(",\n"),
            "];",
            ""
        ].join("\n");
    }

    // -------------------------------------------------------------- Activos

    function activo(ruta) {
        let entrada = activos.get(ruta);
        if (entrada) return entrada;

        entrada = { estado: "cargando", img: new Image() };
        activos.set(ruta, entrada);
        entrada.img.onload = () => {
            entrada.estado = "ok";
            programarRevalidacion();
        };
        entrada.img.onerror = () => {
            entrada.estado = "falta";
            programarRevalidacion();
        };
        entrada.img.src = ruta;
        return entrada;
    }

    function programarRevalidacion() {
        if (revalidacionPendiente) return;
        revalidacionPendiente = true;
        requestAnimationFrame(() => {
            revalidacionPendiente = false;
            validarTodo();
            pintarLista();
            pintarProblemas();
            sincronizarInspector();
            pedirRender();
        });
    }

    function rutasPiso(piso) {
        const total = piso.tilesVariantes;
        if (!total) return [obtenerRutaPisoTema(piso.tilesTema)];
        return Array.from({ length: total }, (_, i) => obtenerRutaPisoTema(piso.tilesTema, i + 1));
    }

    // Prueba piso_<tema>_01, _02... de a uno, para no pedir archivos que no existen
    function variantesDetectadas(tema) {
        let total = 0;
        while (total < MAX_VARIANTES) {
            const entrada = activo(obtenerRutaPisoTema(tema, total + 1));
            if (entrada.estado === "cargando") return { total, cargando: true };
            if (entrada.estado === "falta") break;
            total++;
        }
        return { total, cargando: false };
    }

    // ----------------------------------------------------------- Validacion

    function alcanceSalto(personaje, desnivel) {
        let velocidadY = -personaje.fuerzaSalto;
        let y = 0;
        for (let frames = 1; frames <= 600; frames++) {
            const yAnterior = y;
            velocidadY += GRAVEDAD;
            y += velocidadY;
            if (velocidadY >= 0 && yAnterior <= desnivel + 8 && y >= desnivel - 0.001) {
                const ancho = personaje.colision?.ancho || 64;
                return Math.floor(frames * personaje.velocidad + ancho * (1 - 2 * APOYO_MINIMO));
            }
        }
        return 0;
    }

    function alturaSalto(personaje) {
        let velocidadY = -personaje.fuerzaSalto;
        let y = 0;
        while (velocidadY + GRAVEDAD < 0) {
            velocidadY += GRAVEDAD;
            y += velocidadY;
        }
        return Math.floor(-y);
    }

    // Altura de la plataforma que el objeto tiene debajo, o null si esta sobre un hueco
    function pisoBajo(piso, o) {
        const centro = o.x + o.ancho / 2;
        const debajo = piso.plataformas
            .filter((p) => centro >= p.x && centro <= p.x + p.ancho && p.y >= o.y)
            .sort((a, b) => a.y - b.y)[0];
        return debajo ? debajo.y : null;
    }

    function validarObjetos(piso, agregar) {
        const personajes = Object.values(personajesDisponibles);
        const altoMinimo = Math.min(...personajes.map((personaje) => personaje.colision?.alto || 172));

        piso.objetos.forEach((o, i) => {
            const nombre = `El objeto ${i + 1} (${o.tipo || "sin imagen"})`;
            if (!o.tipo) {
                agregar("aviso", `${nombre} no tiene imagen asignada.`, { objeto: i });
            } else if (activo(obtenerRutaObjeto(o.tipo)).estado === "falta") {
                agregar("info", `No existe ${obtenerRutaObjeto(o.tipo)}. El juego dibuja una caja de color en su lugar.`, { objeto: i });
            }
            if (o.modo === MODOS_OBJETO.FONDO) return;

            const suelo = pisoBajo(piso, o);
            if (suelo === null) return;
            const desnivel = suelo - o.y;
            const noLlegan = personajes.filter((personaje) => alturaSalto(personaje) < desnivel).map((personaje) => personaje.nombre);
            if (!noLlegan.length) return;

            const quienes = noLlegan.join(" y ");
            const plural = noLlegan.length > 1;
            const cortaElPaso = o.modo === MODOS_OBJETO.SOLIDO && suelo - (o.y + o.alto) < altoMinimo;
            if (cortaElPaso) {
                agregar("aviso", `${nombre} es sólido y su parte de arriba queda a ${desnivel}px del piso: ${quienes} no ${plural ? "pueden" : "puede"} saltarlo y no ${plural ? "pasan" : "pasa"}.`, { objeto: i });
            } else {
                agregar("info", `${nombre} queda a ${desnivel}px del piso: ${quienes} no ${plural ? "llegan" : "llega"} a subirse de un salto.`, { objeto: i });
            }
        });
    }

    function analizarHueco(piso, indice) {
        const origen = piso.plataformas[indice];
        const destino = piso.plataformas[indice + 1];
        const ancho = huecoDespues(piso.plataformas, indice);
        const alcances = Object.entries(personajesDisponibles).map(([clave, personaje]) => ({
            clave,
            nombre: personaje.nombre,
            alcance: alcanceSalto(personaje, destino.y - origen.y)
        }));
        const minimo = Math.min(...alcances.map((a) => a.alcance));
        const maximo = Math.max(...alcances.map((a) => a.alcance));

        let resultado = "ok";
        if (ancho > maximo) resultado = "imposible";
        else if (ancho > minimo) resultado = "parcial";
        else if (ancho > minimo * 0.9) resultado = "justo";

        return { ancho, alcances, minimo, maximo, resultado };
    }

    function desplazarDesde(piso, indice, delta) {
        piso.plataformas.slice(indice).forEach((p) => {
            p.x = Math.max(0, p.x + delta);
        });
    }

    function alturaEn(punto) {
        const debajo = (pisoActivo()?.plataformas || [])
            .filter((p) => punto.x >= p.x && punto.x <= p.x + p.ancho)
            .sort((a, b) => Math.abs(a.y - punto.y) - Math.abs(b.y - punto.y))[0];
        return debajo ? debajo.y : ALTURA_PLATAFORMA_DEFAULT;
    }

    // Une la plataforma con sus vecinas pegadas del mismo tipo. Los pivotes no: cada uno gira por separado.
    function fusionar(piso, plataforma) {
        if (plataforma.tipo === TIPOS_PLATAFORMA.PIVOTE) return;
        piso.plataformas = piso.plataformas.filter((otra) => {
            if (otra === plataforma || otra.tipo !== plataforma.tipo || otra.y !== plataforma.y) return true;
            if (otra.x + otra.ancho === plataforma.x) {
                plataforma.x = otra.x;
                plataforma.ancho += otra.ancho;
                return false;
            }
            if (plataforma.x + plataforma.ancho === otra.x) {
                plataforma.ancho += otra.ancho;
                return false;
            }
            return true;
        });
    }

    // Las herramientas pintan: lo que habia en el tramo se recorta y se reemplaza (o queda vacio si es un hueco)
    function pintarTramo(piso, desde, hasta, y, herramienta) {
        const resultado = [];
        piso.plataformas.forEach((p) => {
            const fin = p.x + p.ancho;
            if (Math.abs(p.y - y) >= ALTO_TILE || fin <= desde || p.x >= hasta) {
                resultado.push(p);
                return;
            }
            if (p.x < desde) resultado.push({ ...p, ancho: desde - p.x });
            if (fin > hasta) resultado.push({ ...p, x: hasta, ancho: fin - hasta });
        });
        piso.plataformas = resultado;

        const trampa = {
            [HERRAMIENTA_HUECO]: TRAMPAS.HUECO_ROTO,
            [TIPOS_PLATAFORMA.PIVOTE]: TRAMPAS.PIVOTE,
            [TIPOS_PLATAFORMA.RESBALADIZO]: TRAMPAS.RESBALADIZO
        }[herramienta];

        let nueva = null;
        if (herramienta !== HERRAMIENTA_HUECO) {
            nueva = { x: desde, y, ancho: hasta - desde, tipo: herramienta };
            piso.plataformas.push(nueva);
            fusionar(piso, nueva);
        }
        ordenar(piso);
        return { nueva, trampa };
    }

    function validarPiso(piso) {
        const lista = [];
        const agregar = (nivel, mensaje, extra = {}) => lista.push({ nivel, mensaje, ...extra });
        const plataformas = piso.plataformas;
        const tiene = (trampa) => piso.trampasHabilitadas.includes(trampa);

        if (!Number.isInteger(piso.id) || piso.id < 1) {
            agregar("error", "El ID tiene que ser un número entero mayor que cero.");
        } else if (estado.pisos.some((otro) => otro !== piso && otro.id === piso.id)) {
            agregar("error", `El ID ${piso.id} lo usa otro piso. El juego solo va a cargar el primero.`, {
                arreglo: { etiqueta: `Usar ID ${siguienteId()}`, accion: () => { piso.id = siguienteId(); } }
            });
        }
        if (!piso.nombre.trim()) agregar("error", "El piso no tiene nombre.");

        if (!plataformas.length) {
            agregar("error", "No hay plataformas: el jugador no tiene dónde aparecer.");
        } else if (plataformas[0].tipo === TIPOS_PLATAFORMA.PIVOTE && tiene(TRAMPAS.PIVOTE)) {
            agregar("aviso", "El jugador aparece sobre una plataforma pivote, que se cae al pisarla.", { plataforma: 0 });
        }

        plataformas.forEach((p, i) => {
            const fin = p.x + p.ancho;
            if (p.ancho < ANCHO_TILE) {
                agregar("aviso", `La plataforma ${i + 1} mide ${p.ancho}px, menos que un tile (${ANCHO_TILE}px): el arte se va a ver comprimido.`, { plataforma: i });
            }
            if (p.y < 190 || p.y > ALTO_MUNDO - ALTO_TILE) {
                agregar("aviso", `La plataforma ${i + 1} está en y=${p.y}: el jugador o el piso quedan fuera de la pantalla (${ALTO_MUNDO}px de alto).`, { plataforma: i });
            }

            for (let j = i + 1; j < plataformas.length && plataformas[j].x < fin; j++) {
                if (Math.abs(plataformas[j].y - p.y) >= ALTO_TILE) continue;
                const solape = fin - plataformas[j].x;
                agregar("error", `Las plataformas ${i + 1} y ${j + 1} se superponen ${solape}px.`, {
                    plataforma: j,
                    arreglo: { etiqueta: "Separar", accion: () => desplazarDesde(piso, j, solape) }
                });
            }

            if (huecoDespues(plataformas, i) === 0) return;
            const hueco = analizarHueco(piso, i);
            const detalle = hueco.alcances.map((a) => `${a.nombre} ${a.alcance}px`).join(", ");
            const seguro = Math.floor((hueco.minimo * 0.85) / 16) * 16;
            const arreglo = {
                etiqueta: `Reducir a ${seguro}px`,
                accion: () => desplazarDesde(piso, i + 1, seguro - hueco.ancho)
            };

            if (hueco.resultado === "imposible") {
                agregar("error", `Hueco de ${hueco.ancho}px después de la plataforma ${i + 1}: nadie llega (alcance: ${detalle}).`, { plataforma: i, arreglo });
            } else if (hueco.resultado === "parcial") {
                const llegan = hueco.alcances.filter((a) => a.alcance >= hueco.ancho).map((a) => a.nombre).join(", ");
                agregar("aviso", `Hueco de ${hueco.ancho}px después de la plataforma ${i + 1}: solo llega ${llegan} (alcance: ${detalle}).`, { plataforma: i, arreglo });
            } else if (hueco.resultado === "justo") {
                agregar("aviso", `Hueco de ${hueco.ancho}px después de la plataforma ${i + 1}: queda muy justo (alcance: ${detalle}).`, { plataforma: i });
            }
        });

        const usa = (tipo) => plataformas.some((p) => p.tipo === tipo);
        const hayHuecos = plataformas.some((_, i) => huecoDespues(plataformas, i) > 0);
        const habilitar = (trampa) => ({ etiqueta: "Habilitar", accion: () => piso.trampasHabilitadas.push(trampa) });

        if (usa(TIPOS_PLATAFORMA.PIVOTE) && !tiene(TRAMPAS.PIVOTE)) {
            agregar("aviso", "Hay plataformas pivote pero la trampa PIVOTE no está habilitada: el juego las trata como piso normal.", { arreglo: habilitar(TRAMPAS.PIVOTE) });
        }
        if (usa(TIPOS_PLATAFORMA.RESBALADIZO) && !tiene(TRAMPAS.RESBALADIZO)) {
            agregar("info", "Hay piso resbaladizo pero la trampa RESBALADIZO no está en la lista.", { arreglo: habilitar(TRAMPAS.RESBALADIZO) });
        }
        if (hayHuecos && !tiene(TRAMPAS.HUECO_ROTO)) {
            agregar("info", "Hay huecos pero la trampa HUECO_ROTO no está en la lista.", { arreglo: habilitar(TRAMPAS.HUECO_ROTO) });
        }
        if (plataformas.length && anchoMundo(piso) < ANCHO_PANTALLA) {
            agregar("info", `El piso mide ${anchoMundo(piso)}px, menos que la pantalla (${ANCHO_PANTALLA}px).`);
        }

        validarObjetos(piso, agregar);

        const faltantes = [];
        const revisar = (ruta) => {
            if (ruta && activo(ruta).estado === "falta") faltantes.push(ruta);
        };
        if (!piso.fondoRuta) agregar("aviso", "El piso no tiene fondo asignado.");
        revisar(piso.fondoRuta);
        rutasPiso(piso).forEach(revisar);
        const rutasTema = obtenerRutasTilesTema(piso.tilesTema);
        if (hayHuecos) {
            revisar(rutasTema.bordeRotoIzq);
            revisar(rutasTema.bordeRotoDer);
        }
        faltantes.forEach((ruta) => agregar("aviso", `No existe ${ruta}. El juego dibuja un relleno de color en su lugar.`));
        if (usa(TIPOS_PLATAFORMA.PIVOTE) && activo(rutasTema.trampaPivote).estado === "falta") {
            agregar("info", `No existe ${rutasTema.trampaPivote}. Los pivotes se dibujan con el relleno gris.`);
        }

        // Las notas de importacion hablan del piso tal como esta en niveles.js: al editarlo dejan de aplicar
        if (firmasBase.get(piso._uid) === firma(piso)) {
            (piso._notas || []).forEach((nota) => agregar("info", nota.mensaje, { plataforma: nota.plataforma }));
        }
        return lista;
    }

    function validarTodo() {
        problemas = new Map(estado.pisos.map((piso) => [piso._uid, validarPiso(piso)]));
    }

    function contar(piso, nivel) {
        return (problemas.get(piso._uid) || []).filter((p) => p.nivel === nivel).length;
    }

    // ------------------------------------------------- Historial y cambios

    function instantanea() {
        return JSON.stringify({ pisos: estado.pisos, indice: estado.indice, seleccion: estado.seleccion, seleccionObjeto: estado.seleccionObjeto });
    }

    function registrar() {
        historial.pasado.push(instantanea());
        if (historial.pasado.length > MAX_HISTORIAL) historial.pasado.shift();
        historial.futuro.length = 0;
        $("bannerBorrador").hidden = true;
    }

    function restaurar(json) {
        const datos = JSON.parse(json);
        estado.pisos = datos.pisos;
        estado.indice = Math.min(datos.indice, Math.max(0, estado.pisos.length - 1));
        estado.seleccion = datos.seleccion;
        estado.seleccionObjeto = datos.seleccionObjeto ?? null;
    }

    function deshacer() {
        if (!historial.pasado.length) return;
        historial.futuro.push(instantanea());
        restaurar(historial.pasado.pop());
        alCambiar();
    }

    function rehacer() {
        if (!historial.futuro.length) return;
        historial.pasado.push(instantanea());
        restaurar(historial.futuro.pop());
        alCambiar();
    }

    function editar(accion) {
        const piso = pisoActivo();
        if (!piso) return;
        const seleccionada = plataformaSeleccionada();
        registrar();
        accion(piso);
        ordenar(piso, seleccionada && piso.plataformas.includes(seleccionada) ? seleccionada : null);
        alCambiar();
    }

    function firma(piso) {
        return codigoPiso(piso);
    }

    function fijarLineaBase() {
        contenidoBase = generarArchivoNiveles();
        firmasBase = new Map(estado.pisos.map((piso) => [piso._uid, firma(piso)]));
    }

    function hayCambios() {
        return generarArchivoNiveles() !== contenidoBase;
    }

    function alCambiar() {
        const piso = pisoActivo();
        if (!piso || !piso.plataformas[estado.seleccion]) estado.seleccion = null;
        if (!piso || !piso.objetos[estado.seleccionObjeto]) estado.seleccionObjeto = null;
        validarTodo();
        pintarBarra();
        pintarLista();
        sincronizarInspector();
        pintarProblemas();
        limitarVista();
        pedirRender();
        programarBorrador();
    }

    // ------------------------------------------------------------- Borrador

    function programarBorrador() {
        clearTimeout(temporizadorBorrador);
        temporizadorBorrador = setTimeout(() => {
            // Mientras se ofrece restaurar un borrador no se pisa con el estado recien cargado
            if (!$("bannerBorrador").hidden) return;
            try {
                if (hayCambios()) {
                    localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ fecha: Date.now(), pisos: estado.pisos }));
                } else {
                    localStorage.removeItem(CLAVE_BORRADOR);
                }
            } catch (error) {
                console.warn("No se pudo guardar el borrador:", error);
            }
        }, 400);
    }

    function revisarBorrador() {
        let borrador = null;
        try {
            borrador = JSON.parse(localStorage.getItem(CLAVE_BORRADOR));
        } catch (error) {
            borrador = null;
        }
        if (!borrador?.pisos?.length) return;

        const actuales = estado.pisos;
        estado.pisos = borrador.pisos;
        const distinto = generarArchivoNiveles() !== contenidoBase;
        estado.pisos = actuales;
        if (!distinto) {
            localStorage.removeItem(CLAVE_BORRADOR);
            return;
        }

        const fecha = new Date(borrador.fecha).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });
        $("textoBorrador").textContent = `Hay cambios del ${fecha} que no están en niveles.js.`;
        $("bannerBorrador").hidden = false;
        $("btnRestaurarBorrador").onclick = () => {
            registrar();
            estado.pisos = borrador.pisos;
            estado.pisos.forEach((piso) => { piso.objetos = piso.objetos || []; });
            estado.indice = Math.min(estado.indice, estado.pisos.length - 1);
            limpiarSeleccion();
            contadorUid = Math.max(contadorUid, ...estado.pisos.map((piso) => Number(String(piso._uid).slice(1)) || 0));
            alCambiar();
            avisar("Borrador restaurado. Todavía falta guardarlo en niveles.js.");
        };
        $("btnDescartarBorrador").onclick = () => {
            localStorage.removeItem(CLAVE_BORRADOR);
            $("bannerBorrador").hidden = true;
        };
    }

    // -------------------------------------------------------------- Interfaz

    function avisar(texto, tipo = "") {
        const nodo = h("div", { class: `aviso-flotante ${tipo}` }, texto);
        $("avisos").append(nodo);
        setTimeout(() => nodo.remove(), 4200);
    }

    function nombreCorto(piso) {
        return piso.nombre.replace(/^piso\s*\d+\s*:\s*/i, "") || "(sin nombre)";
    }

    function pintarBarra() {
        const modificados = estado.pisos.filter((piso) => firmasBase.get(piso._uid) !== firma(piso)).length;
        const sucio = hayCambios();
        const conErrores = estado.pisos.filter((piso) => contar(piso, "error")).length;
        const partes = [sucio ? `● Cambios sin guardar${modificados ? ` (${modificados} ${modificados === 1 ? "piso" : "pisos"})` : ""}` : "Sin cambios"];
        if (conErrores) partes.push(`${conErrores} ${conErrores === 1 ? "piso con errores" : "pisos con errores"}`);

        $("estadoGuardado").textContent = partes.join(" · ");
        $("estadoGuardado").classList.toggle("sucio", sucio);
        $("btnDeshacer").disabled = !historial.pasado.length;
        $("btnRehacer").disabled = !historial.futuro.length;
        $("btnProbar").disabled = !pisoActivo()?.plataformas.length;
        document.title = `${sucio ? "● " : ""}Editor de pisos`;
    }

    function pintarLista() {
        const lista = $("listaPisos");
        const desplazamiento = lista.scrollTop;
        lista.replaceChildren(...estado.pisos.map((piso, i) => {
            const errores = contar(piso, "error");
            const avisos = contar(piso, "aviso");
            return h("button", {
                class: `piso-item ${i === estado.indice ? "activo" : ""}`,
                title: piso.nombre,
                onclick: () => seleccionarPiso(i)
            },
                h("span", { class: "piso-muestra", style: `background:${piso.colorPlaceholder}` }),
                h("span", { class: "piso-id" }, String(piso.id).padStart(2, "0")),
                h("span", { class: "piso-nombre" }, nombreCorto(piso)),
                firmasBase.get(piso._uid) !== firma(piso) && h("span", { class: "piso-modificado", title: "Modificado" }),
                errores > 0 && h("span", { class: "insignia error", title: "Errores" }, String(errores)),
                !errores && avisos > 0 && h("span", { class: "insignia aviso", title: "Avisos" }, String(avisos))
            );
        }));
        lista.scrollTop = desplazamiento;

        $("totalPisos").textContent = estado.pisos.length;
        $("btnSubirPiso").disabled = estado.indice <= 0;
        $("btnBajarPiso").disabled = estado.indice >= estado.pisos.length - 1;
        ["btnDuplicarPiso", "btnEliminarPiso"].forEach((id) => { $(id).disabled = !pisoActivo(); });
    }

    function poner(id, valor) {
        const campo = $(id);
        if (campo !== campoEditando) campo.value = valor ?? "";
    }

    function ponerOpciones(id, valores) {
        const lista = $(id);
        if (lista.dataset.valores === valores.join("|")) return;
        lista.dataset.valores = valores.join("|");
        lista.replaceChildren(...valores.map((valor) => h("option", { value: valor })));
    }

    function sincronizarInspector() {
        const piso = pisoActivo();
        if (!piso) return;

        poner("campoId", piso.id);
        poner("campoNombre", piso.nombre);
        poner("campoFondo", piso.fondoRuta);
        poner("campoColor", piso.colorPlaceholder);
        poner("campoTipoPiso", piso.tipoPiso);
        poner("campoTema", piso.tilesTema);
        poner("campoVariantes", piso.tilesVariantes);

        const fondo = piso.fondoRuta ? activo(piso.fondoRuta).estado : "falta";
        $("estadoFondo").textContent = { ok: "✓ existe", falta: "✕ no existe", cargando: "" }[fondo];
        $("estadoFondo").className = `estado-activo ${fondo}`;

        const variantes = variantesDetectadas(piso.tilesTema);
        const estadoTema = $("estadoTema");
        if (variantes.cargando) {
            estadoTema.textContent = "Buscando tiles…";
        } else if (variantes.total === piso.tilesVariantes) {
            estadoTema.textContent = variantes.total ? `Se encontraron las ${variantes.total} variantes de assets/tiles/piso_${piso.tilesTema}_NN.png.` : "";
        } else {
            estadoTema.replaceChildren(
                `Hay ${variantes.total} ${variantes.total === 1 ? "variante" : "variantes"} de piso_${piso.tilesTema}_NN.png en assets/tiles. `,
                variantes.total > 0 && h("button", {
                    class: "btn btn-mini",
                    onclick: () => editar((p) => { p.tilesVariantes = variantes.total; })
                }, `Usar ${variantes.total}`)
            );
        }

        const unicos = (clave) => [...new Set(estado.pisos.map((p) => p[clave]).filter(Boolean))].sort();
        ponerOpciones("listaFondos", unicos("fondoRuta"));
        ponerOpciones("listaTemas", unicos("tilesTema"));

        $("chipsTrampas").querySelectorAll(".chip").forEach((chip) => {
            chip.classList.toggle("activo", piso.trampasHabilitadas.includes(chip.dataset.valor));
        });
        $("chipsProps").querySelectorAll(".chip").forEach((chip) => {
            chip.classList.toggle("activo", piso.propsPermitidos.includes(chip.dataset.valor));
        });

        const plataforma = plataformaSeleccionada();
        $("panelPlataforma").hidden = !plataforma;
        $("vacioPlataforma").hidden = Boolean(plataforma);
        $("tituloPlataforma").textContent = plataforma ? `${estado.seleccion + 1} de ${piso.plataformas.length}` : "";
        if (plataforma) {
            const esUltima = estado.seleccion === piso.plataformas.length - 1;
            poner("platX", plataforma.x);
            poner("platAncho", plataforma.ancho);
            poner("platY", plataforma.y);
            poner("platHueco", huecoDespues(piso.plataformas, estado.seleccion));
            $("grupoHueco").hidden = esUltima;
            $("ayudaHueco").hidden = esUltima;
            if (!esUltima) {
                const hueco = analizarHueco(piso, estado.seleccion);
                $("ayudaHueco").textContent = `Alcance de salto: ${hueco.alcances.map((a) => `${a.nombre} ${a.alcance}px`).join(" · ")}. Cambiar el hueco mueve las plataformas que siguen.`;
            }
            $("segTipo").querySelectorAll("button").forEach((boton) => {
                boton.classList.toggle("activo", boton.dataset.tipo === plataforma.tipo);
            });
        }

        const objeto = objetoSeleccionado();
        $("panelObjeto").hidden = !objeto;
        $("vacioObjeto").hidden = Boolean(objeto);
        $("tituloObjeto").textContent = objeto ? `${estado.seleccionObjeto + 1} de ${piso.objetos.length}` : "";
        if (objeto) {
            const imagen = objeto.tipo ? activo(obtenerRutaObjeto(objeto.tipo)) : { estado: "falta" };
            poner("objTipo", objeto.tipo);
            poner("objX", objeto.x);
            poner("objY", objeto.y);
            poner("objAncho", objeto.ancho);
            poner("objAlto", objeto.alto);
            $("estadoObjeto").textContent = { ok: "✓ existe", falta: "✕ no existe", cargando: "" }[imagen.estado];
            $("estadoObjeto").className = `estado-activo ${imagen.estado}`;
            $("ayudaObjeto").textContent = objeto.tipo
                ? `${obtenerRutaObjeto(objeto.tipo)}${imagen.estado === "ok" ? ` · ${imagen.img.naturalWidth}×${imagen.img.naturalHeight}px` : ""}`
                : "Escribe el nombre del archivo de assets/props, sin .png.";
            $("btnTamanoOriginal").disabled = imagen.estado !== "ok";
            $("ayudaModo").textContent = MODOS.find((modo) => modo.id === objeto.modo)?.ayuda || "";
            $("segModo").querySelectorAll("button").forEach((boton) => {
                boton.classList.toggle("activo", boton.dataset.modo === objeto.modo);
            });
        }
        ponerOpciones("listaObjetos", [...new Set([
            ...Object.values(PROPS),
            ...estado.pisos.flatMap((p) => (p.objetos || []).map((o) => o.tipo))
        ].filter(Boolean))].sort());

        document.querySelectorAll(".herramienta").forEach((boton) => {
            boton.classList.toggle("activa", boton.dataset.herramienta === estado.herramienta);
        });
        $("pistaHerramienta").textContent = PISTAS[estado.herramienta];
        $("datoMundo").textContent = `${piso.plataformas.length} plataformas · ${piso.objetos.length} objetos · mundo ${anchoMundo(piso)}px (${(anchoMundo(piso) / ANCHO_PANTALLA).toFixed(1)} pantallas)`;
    }

    function pintarProblemas() {
        const piso = pisoActivo();
        const lista = piso ? problemas.get(piso._uid) || [] : [];
        const orden = { error: 0, aviso: 1, info: 2 };
        const errores = lista.filter((p) => p.nivel === "error").length;
        const avisos = lista.filter((p) => p.nivel === "aviso").length;

        $("resumenProblemas").textContent = lista.length
            ? [errores && `${errores} ${errores === 1 ? "error" : "errores"}`, avisos && `${avisos} ${avisos === 1 ? "aviso" : "avisos"}`].filter(Boolean).join(" · ")
            : "";

        if (!lista.length) {
            $("listaProblemas").replaceChildren(h("p", { class: "sin-problemas" }, "✓ Sin problemas en este piso."));
            return;
        }

        $("listaProblemas").replaceChildren(...[...lista].sort((a, b) => orden[a.nivel] - orden[b.nivel]).map((problema) =>
            h("div", { class: `problema ${problema.nivel}` },
                h("div", { class: "problema-cuerpo" },
                    h("span", {}, problema.mensaje),
                    h("div", { class: "grupo-botones" },
                        problema.arreglo && h("button", {
                            class: "btn btn-mini",
                            onclick: () => editar(() => problema.arreglo.accion())
                        }, problema.arreglo.etiqueta),
                        problema.plataforma !== undefined && h("button", {
                            class: "problema-enlace",
                            onclick: () => irAPlataforma(problema.plataforma)
                        }, `Ver plataforma ${problema.plataforma + 1}`),
                        problema.objeto !== undefined && h("button", {
                            class: "problema-enlace",
                            onclick: () => irAObjeto(problema.objeto)
                        }, `Ver objeto ${problema.objeto + 1}`)
                    )
                )
            )
        ));
    }

    function seleccionarPiso(indice) {
        if (indice === estado.indice) return;
        estado.indice = indice;
        limpiarSeleccion();
        vista.x = -32 / vista.zoom;
        alCambiar();
    }

    function seleccionar(indice) {
        estado.seleccion = indice;
        estado.seleccionObjeto = null;
        sincronizarInspector();
        pedirRender();
    }

    function irAPlataforma(indice) {
        const plataforma = pisoActivo()?.plataformas[indice];
        if (!plataforma) return;
        vista.x = plataforma.x + plataforma.ancho / 2 - anchoVisible() / 2;
        limitarVista();
        seleccionar(indice);
    }

    function seleccionarObjeto(indice) {
        estado.seleccion = null;
        estado.seleccionObjeto = indice;
        sincronizarInspector();
        pedirRender();
    }

    function irAObjeto(indice) {
        const objeto = pisoActivo()?.objetos[indice];
        if (!objeto) return;
        vista.x = objeto.x + objeto.ancho / 2 - anchoVisible() / 2;
        limitarVista();
        seleccionarObjeto(indice);
    }

    // ------------------------------------------------------ Acciones de piso

    function nuevoPiso() {
        const origen = pisoActivo();
        const id = siguienteId();
        registrar();
        estado.pisos.push(importarPiso({
            id,
            nombre: `Piso ${String(id).padStart(2, "0")}: Nuevo piso`,
            fondoRuta: origen?.fondoRuta || "",
            colorPlaceholder: origen?.colorPlaceholder || "#2d3a34",
            tipoPiso: origen?.tipoPiso,
            tilesTema: origen?.tilesTema,
            tilesVariantes: origen?.tilesVariantes,
            trampasHabilitadas: [TRAMPAS.HUECO_ROTO],
            propsPermitidos: origen?.propsPermitidos || [],
            plataformas: [piso(0, ANCHO_PANTALLA)]
        }));
        estado.indice = estado.pisos.length - 1;
        limpiarSeleccion();
        vista.x = -32 / vista.zoom;
        alCambiar();
        $("listaPisos").scrollTop = $("listaPisos").scrollHeight;
        $("campoNombre").focus();
        $("campoNombre").select();
    }

    function duplicarPiso() {
        const origen = pisoActivo();
        if (!origen) return;
        registrar();
        const copia = JSON.parse(JSON.stringify(origen));
        copia._uid = `p${++contadorUid}`;
        copia._notas = [];
        copia.id = siguienteId();
        copia.nombre = `${origen.nombre} (copia)`;
        estado.pisos.splice(estado.indice + 1, 0, copia);
        estado.indice++;
        limpiarSeleccion();
        alCambiar();
    }

    function moverPiso(direccion) {
        const destino = estado.indice + direccion;
        if (destino < 0 || destino >= estado.pisos.length) return;
        registrar();
        const [movido] = estado.pisos.splice(estado.indice, 1);
        estado.pisos.splice(destino, 0, movido);
        estado.indice = destino;
        alCambiar();
    }

    function eliminarPiso() {
        const eliminado = pisoActivo();
        if (!eliminado) return;
        registrar();
        estado.pisos.splice(estado.indice, 1);
        estado.indice = Math.max(0, Math.min(estado.indice, estado.pisos.length - 1));
        limpiarSeleccion();
        alCambiar();
        avisar(`Se eliminó "${eliminado.nombre}". Puedes deshacerlo con ⌘Z.`);
    }

    function duplicarPlataforma() {
        const original = plataformaSeleccionada();
        if (!original) return;
        const piso = pisoActivo();
        const copia = { ...original, x: anchoMundoReal(piso) + estado.snap * 4 };
        registrar();
        piso.plataformas.push(copia);
        ordenar(piso, copia);
        alCambiar();
        irAPlataforma(estado.seleccion);
    }

    function anchoMundoReal(piso) {
        return piso.plataformas.reduce((maximo, p) => Math.max(maximo, p.x + p.ancho), 0);
    }

    function eliminarPlataforma() {
        if (!plataformaSeleccionada()) return;
        const indice = estado.seleccion;
        registrar();
        pisoActivo().plataformas.splice(indice, 1);
        limpiarSeleccion();
        alCambiar();
    }

    // --------------------------------------------------- Acciones de objeto

    function ajustarGrilla(valor, libre) {
        return libre ? Math.round(valor) : Math.round(valor / estado.snap) * estado.snap;
    }

    // La base del objeto se pega al piso o al objeto que tenga debajo y, si no hay ninguno cerca, a la grilla
    function ajustarBase(o, base, libre, tolerancia = 10 / vista.zoom) {
        if (libre) return Math.round(base);
        const piso = pisoActivo();
        const cercano = [...piso.plataformas, ...piso.objetos.filter((otro) => otro !== o && otro.modo !== MODOS_OBJETO.FONDO)]
            .filter((apoyo) => apoyo.x < o.x + o.ancho && apoyo.x + apoyo.ancho > o.x)
            .map((apoyo) => apoyo.y)
            .sort((a, b) => Math.abs(a - base) - Math.abs(b - base))[0];
        return cercano !== undefined && Math.abs(cercano - base) <= tolerancia ? cercano : ajustarGrilla(base, false);
    }

    function crearObjeto(punto, libre) {
        const piso = pisoActivo();
        const imagen = activo(obtenerRutaObjeto(estado.ultimoObjeto));
        const ancho = imagen.estado === "ok" ? imagen.img.naturalWidth : TAMANO_OBJETO;
        const alto = imagen.estado === "ok" ? imagen.img.naturalHeight : TAMANO_OBJETO;
        const nuevo = {
            tipo: estado.ultimoObjeto,
            x: Math.max(0, ajustarGrilla(punto.x - ancho / 2, libre)),
            y: 0,
            ancho,
            alto,
            modo: estado.ultimoModo
        };
        // Si el clic cae cerca del piso, el objeto queda apoyado en el
        nuevo.y = ajustarBase(nuevo, punto.y + alto / 2, libre, alto / 2 + 10 / vista.zoom) - alto;

        registrar();
        piso.objetos.push(nuevo);
        estado.herramienta = "seleccionar";
        estado.seleccion = null;
        estado.seleccionObjeto = piso.objetos.length - 1;
        alCambiar();
    }

    function duplicarObjeto() {
        const original = objetoSeleccionado();
        if (!original) return;
        const piso = pisoActivo();
        registrar();
        piso.objetos.push({ ...original, x: original.x + original.ancho + estado.snap });
        estado.seleccionObjeto = piso.objetos.length - 1;
        alCambiar();
        irAObjeto(estado.seleccionObjeto);
    }

    function eliminarObjeto() {
        if (!objetoSeleccionado()) return;
        const indice = estado.seleccionObjeto;
        registrar();
        pisoActivo().objetos.splice(indice, 1);
        estado.seleccionObjeto = null;
        alCambiar();
    }

    function usarTamanoOriginal() {
        const objeto = objetoSeleccionado();
        const imagen = objeto?.tipo ? activo(obtenerRutaObjeto(objeto.tipo)) : null;
        if (imagen?.estado !== "ok") return;
        editar(() => {
            const base = objeto.y + objeto.alto;
            objeto.ancho = imagen.img.naturalWidth;
            objeto.alto = imagen.img.naturalHeight;
            objeto.y = base - objeto.alto;
        });
    }

    function apoyarObjeto() {
        const objeto = objetoSeleccionado();
        if (!objeto) return;
        const suelo = pisoBajo(pisoActivo(), objeto) ?? pisoBajo(pisoActivo(), { ...objeto, y: -Infinity });
        if (suelo === null) {
            avisar("Ese objeto no tiene piso debajo.");
            return;
        }
        editar(() => { objeto.y = suelo - objeto.alto; });
    }

    // ---------------------------------------------------------------- Vista

    function anchoVisible() {
        return tamano.ancho / vista.zoom;
    }

    function altoVisible() {
        return (tamano.alto - ALTO_REGLA) / vista.zoom;
    }

    function limitarVista() {
        const piso = pisoActivo();
        const ancho = piso ? anchoMundo(piso) : ANCHO_PANTALLA;
        const margen = anchoVisible() / 2;
        vista.x = Math.max(-margen, Math.min(vista.x, Math.max(-margen, ancho + ANCHO_PANTALLA - margen)));
        vista.y = ALTO_MUNDO <= altoVisible()
            ? -(altoVisible() - ALTO_MUNDO) / 2
            : Math.max(0, Math.min(vista.y, ALTO_MUNDO - altoVisible()));
        $("etiquetaZoom").textContent = `${Math.round(vista.zoom * 100)}%`;
    }

    function fijarZoom(zoom, anclaPx = tamano.ancho / 2) {
        const anclaMundo = anclaPx / vista.zoom + vista.x;
        vista.zoom = Math.max(0.08, Math.min(4, zoom));
        vista.x = anclaMundo - anclaPx / vista.zoom;
        limitarVista();
        pedirRender();
    }

    function encajar() {
        vista.zoom = Math.max(0.08, Math.min(4, (tamano.alto - ALTO_REGLA) / ALTO_MUNDO));
        vista.x = -32 / vista.zoom;
        limitarVista();
        pedirRender();
    }

    function verTodo() {
        const piso = pisoActivo();
        if (!piso) return;
        const alAlto = (tamano.alto - ALTO_REGLA) / ALTO_MUNDO;
        vista.zoom = Math.max(0.08, Math.min(alAlto, (tamano.ancho - 64) / anchoMundo(piso)));
        vista.x = -32 / vista.zoom;
        limitarVista();
        pedirRender();
    }

    function ajustarLienzo() {
        const caja = $("contenedorLienzo").getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const primera = tamano.ancho === 0;
        tamano.ancho = Math.max(1, caja.width);
        tamano.alto = Math.max(1, caja.height);
        lienzo.width = Math.round(tamano.ancho * dpr);
        lienzo.height = Math.round(tamano.alto * dpr);
        lienzo.style.width = `${tamano.ancho}px`;
        lienzo.style.height = `${tamano.alto}px`;

        const cajaMini = minimapa.getBoundingClientRect();
        minimapa.width = Math.round(cajaMini.width * dpr);
        minimapa.height = Math.round(cajaMini.height * dpr);

        if (primera) encajar();
        limitarVista();
        pedirRender();
    }

    // ---------------------------------------------------------------- Dibujo

    function pedirRender() {
        if (renderPendiente) return;
        renderPendiente = true;
        requestAnimationFrame(() => {
            renderPendiente = false;
            render();
        });
    }

    function colorTipo(tipo) {
        return TIPOS.find((t) => t.id === tipo)?.color || "#aab4c3";
    }

    function etiqueta(texto, x, y, color) {
        const z = vista.zoom;
        ctx.font = `600 ${11 / z}px ${FUENTE_MONO}`;
        const ancho = ctx.measureText(texto).width + 10 / z;
        const alto = 17 / z;
        ctx.fillStyle = "rgba(10, 12, 15, 0.88)";
        ctx.beginPath();
        ctx.roundRect(x - ancho / 2, y - alto / 2, ancho, alto, 4 / z);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(texto, x, y + 0.5 / z);
    }

    function dibujarTile(ruta, x, y, ancho, color) {
        const entrada = activo(ruta);
        if (entrada.estado === "ok") {
            ctx.drawImage(entrada.img, x, y, ancho, ALTO_TILE);
            return;
        }
        ctx.fillStyle = color;
        ctx.fillRect(x, y, ancho, ALTO_TILE);
        ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
        ctx.fillRect(x, y + ALTO_TILE - 12, ancho, 12);
    }

    function dibujarFondo(piso, ancho, desde, hasta) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, ancho, ALTO_MUNDO);
        ctx.clip();
        ctx.fillStyle = piso.colorPlaceholder;
        ctx.fillRect(0, 0, ancho, ALTO_MUNDO);

        const fondo = estado.verFondo && piso.fondoRuta ? activo(piso.fondoRuta) : null;
        if (fondo?.estado === "ok") {
            const anchoFondo = fondo.img.naturalWidth * (ALTO_MUNDO / fondo.img.naturalHeight);
            for (let x = Math.floor(Math.max(0, desde) / anchoFondo) * anchoFondo; x < Math.min(ancho, hasta); x += anchoFondo) {
                ctx.drawImage(fondo.img, x, 0, anchoFondo, ALTO_MUNDO);
            }
        }
        ctx.fillStyle = "rgba(12, 14, 18, 0.38)";
        ctx.fillRect(0, 0, ancho, ALTO_MUNDO);
        ctx.restore();
    }

    function dibujarGuias(ancho, desde, hasta) {
        const z = vista.zoom;
        ctx.lineWidth = 1 / z;
        if (ANCHO_TILE * z >= 20) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
            ctx.beginPath();
            for (let x = Math.ceil(Math.max(0, desde) / ANCHO_TILE) * ANCHO_TILE; x <= Math.min(ancho, hasta); x += ANCHO_TILE) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, ALTO_MUNDO);
            }
            ctx.stroke();
        }

        ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
        ctx.setLineDash([6 / z, 6 / z]);
        ctx.beginPath();
        ctx.moveTo(0, ALTURA_PLATAFORMA_DEFAULT);
        ctx.lineTo(ancho, ALTURA_PLATAFORMA_DEFAULT);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = "rgba(79, 156, 249, 0.7)";
        ctx.lineWidth = 2 / z;
        ctx.strokeRect(0, 0, ancho, ALTO_MUNDO);
    }

    function dibujarArco(origen, destino, personaje, color) {
        const anchoColision = personaje.colision?.ancho || 64;
        let x = origen.x + origen.ancho + anchoColision * (0.5 - APOYO_MINIMO);
        let y = origen.y;
        let velocidadY = -personaje.fuerzaSalto;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / vista.zoom;
        ctx.setLineDash([5 / vista.zoom, 5 / vista.zoom]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let frames = 0; frames < 600; frames++) {
            velocidadY += GRAVEDAD;
            y += velocidadY;
            x += personaje.velocidad;
            ctx.lineTo(x, y);
            if ((velocidadY >= 0 && y >= destino.y) || y > ALTO_MUNDO) break;
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function dibujarHuecos(piso) {
        const personaje = personajesDisponibles[estado.personaje];
        piso.plataformas.forEach((p, i) => {
            const ancho = huecoDespues(piso.plataformas, i);
            if (!ancho) return;
            const siguiente = piso.plataformas[i + 1];
            const inicio = p.x + p.ancho;
            const arriba = Math.min(p.y, siguiente.y);
            const hueco = analizarHueco(piso, i);
            const color = COLORES_SALTO[hueco.resultado];

            const gradiente = ctx.createLinearGradient(0, arriba, 0, ALTO_MUNDO);
            gradiente.addColorStop(0, "rgba(5, 7, 10, 0.55)");
            gradiente.addColorStop(1, "rgba(0, 0, 0, 0.95)");
            ctx.fillStyle = gradiente;
            ctx.fillRect(inicio, arriba, ancho, ALTO_MUNDO - arriba);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.7;
            ctx.fillRect(inicio, arriba + ALTO_TILE + 6 / vista.zoom, ancho, 3 / vista.zoom);
            ctx.globalAlpha = 1;

            if (estado.verArcos && personaje) {
                const llega = alcanceSalto(personaje, siguiente.y - p.y) >= ancho;
                dibujarArco(p, siguiente, personaje, llega ? COLORES_SALTO.ok : COLORES_SALTO.imposible);
            }
            if (ancho * vista.zoom > 34) {
                etiqueta(`${ancho}px`, inicio + ancho / 2, arriba + ALTO_TILE / 2, color);
            }
        });
    }

    function dibujarPlataforma(piso, indice) {
        const plataformas = piso.plataformas;
        const p = plataformas[indice];
        const z = vista.zoom;
        const color = COLORES_PISO[piso.tipoPiso] || piso.colorPlaceholder;
        const rutasTema = obtenerRutasTilesTema(piso.tilesTema);
        const rutas = rutasPiso(piso);
        const bordeIzq = indice > 0 && huecoDespues(plataformas, indice - 1) > 0 ? Math.min(ANCHO_TILE, p.ancho) : 0;
        const bordeDer = huecoDespues(plataformas, indice) > 0 ? Math.min(ANCHO_TILE, Math.max(0, p.ancho - bordeIzq)) : 0;

        if (bordeIzq) dibujarTile(rutasTema.bordeRotoIzq, p.x, p.y, bordeIzq, color);
        for (let x = bordeIzq, pieza = 0; x < p.ancho - bordeDer; pieza++) {
            const ancho = Math.min(ANCHO_TILE, p.ancho - bordeDer - x);
            dibujarTile(rutas[pieza % rutas.length], p.x + x, p.y, ancho, color);
            x += ancho;
        }
        if (bordeDer) dibujarTile(rutasTema.bordeRotoDer, p.x + p.ancho - bordeDer, p.y, bordeDer, color);

        if (p.tipo !== TIPOS_PLATAFORMA.NORMAL) {
            const tinte = colorTipo(p.tipo);
            ctx.fillStyle = tinte;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(p.x, p.y, p.ancho, ALTO_TILE);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = tinte;
            ctx.lineWidth = 2 / z;
            ctx.strokeRect(p.x, p.y, p.ancho, ALTO_TILE);
            if (p.tipo === TIPOS_PLATAFORMA.PIVOTE) {
                ctx.fillStyle = tinte;
                ctx.fillRect(p.x + p.ancho / 2 - 3 / z, p.y, 6 / z, ALTO_TILE);
            }
        }

        if (p.ancho * z > 70) {
            const nombre = TIPOS.find((t) => t.id === p.tipo)?.nombre || p.tipo;
            const texto = p.tipo === TIPOS_PLATAFORMA.NORMAL ? `${indice + 1} · ${p.ancho}px` : `${indice + 1} · ${nombre} · ${p.ancho}px`;
            etiqueta(texto, p.x + p.ancho / 2, p.y + ALTO_TILE + 16 / z, colorTipo(p.tipo));
        }
    }

    function dibujarObjeto(piso, indice) {
        const o = piso.objetos[indice];
        const z = vista.zoom;
        const modo = MODOS.find((m) => m.id === o.modo) || MODOS[0];
        const imagen = o.tipo ? activo(obtenerRutaObjeto(o.tipo)) : null;

        if (imagen?.estado === "ok") {
            ctx.drawImage(imagen.img, o.x, o.y, o.ancho, o.alto);
        } else {
            ctx.fillStyle = modo.color;
            ctx.globalAlpha = 0.28;
            ctx.fillRect(o.x, o.y, o.ancho, o.alto);
            ctx.globalAlpha = 1;
            if (o.ancho * z > 50) etiqueta(o.tipo || "sin imagen", o.x + o.ancho / 2, o.y + o.alto / 2, modo.color);
        }

        ctx.strokeStyle = modo.color;
        ctx.lineWidth = 1.5 / z;
        if (o.modo === MODOS_OBJETO.FONDO) ctx.setLineDash([4 / z, 4 / z]);
        ctx.strokeRect(o.x, o.y, o.ancho, o.alto);
        ctx.setLineDash([]);
        // La franja de arriba marca donde pisa el jugador
        if (o.modo !== MODOS_OBJETO.FONDO) {
            ctx.fillStyle = modo.color;
            ctx.fillRect(o.x, o.y, o.ancho, 4 / z);
        }
    }

    function dibujarObjetos(piso, deFondo, desde, hasta) {
        piso.objetos.forEach((o, i) => {
            if ((o.modo === MODOS_OBJETO.FONDO) !== deFondo) return;
            if (o.x + o.ancho >= desde && o.x <= hasta) dibujarObjeto(piso, i);
        });
    }

    function dibujarInicio(piso) {
        const primera = piso.plataformas[0];
        const personaje = personajesDisponibles[estado.personaje];
        if (!primera || !personaje) return;

        const colision = personaje.colision || {};
        const render = personaje.render || {};
        const animacion = personaje.animaciones?.quieto;
        const x = primera.x + 40;
        const y = primera.y - (colision.offsetY || 0) - (colision.alto || 172);
        const hoja = animacion?.spriteSheet;

        if (hoja?.complete && hoja.naturalWidth > 0) {
            const escala = render.escala || 1;
            ctx.globalAlpha = 0.9;
            ctx.drawImage(hoja, 0, 0, animacion.anchoFrame, animacion.altoFrame,
                x + (render.offsetX || 0), y + (render.offsetY || 0),
                animacion.anchoFrame * escala, animacion.altoFrame * escala);
            ctx.globalAlpha = 1;
        }

        const z = vista.zoom;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
        ctx.lineWidth = 1 / z;
        ctx.setLineDash([4 / z, 4 / z]);
        ctx.strokeRect(x + (colision.offsetX || 0), y + (colision.offsetY || 0), colision.ancho || 64, colision.alto || 172);
        ctx.setLineDash([]);
        etiqueta("INICIO", x + (colision.offsetX || 0) + (colision.ancho || 64) / 2, y - 14 / z, "#e6e8eb");
    }

    function dibujarSeleccion() {
        const p = plataformaSeleccionada();
        const z = vista.zoom;
        if (p) {
            ctx.strokeStyle = "#4f9cf9";
            ctx.lineWidth = 2 / z;
            ctx.strokeRect(p.x - 1 / z, p.y - 1 / z, p.ancho + 2 / z, ALTO_TILE + 2 / z);
            const lado = 10 / z;
            [p.x, p.x + p.ancho].forEach((x) => {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(x - lado / 2, p.y + ALTO_TILE / 2 - lado, lado, lado * 2);
                ctx.strokeRect(x - lado / 2, p.y + ALTO_TILE / 2 - lado, lado, lado * 2);
            });
            etiqueta(`x ${p.x} · ${p.ancho}px`, p.x + p.ancho / 2, p.y - 16 / z, "#cfe3fd");
        }

        const o = objetoSeleccionado();
        if (o) {
            const lado = 10 / z;
            ctx.strokeStyle = "#4f9cf9";
            ctx.lineWidth = 2 / z;
            ctx.strokeRect(o.x - 1 / z, o.y - 1 / z, o.ancho + 2 / z, o.alto + 2 / z);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(o.x + o.ancho - lado / 2, o.y - lado / 2, lado, lado);
            ctx.strokeRect(o.x + o.ancho - lado / 2, o.y - lado / 2, lado, lado);
            etiqueta(`${o.tipo || "sin imagen"} · x ${o.x} · y ${o.y} · ${o.ancho}×${o.alto}`, o.x + o.ancho / 2, o.y + o.alto + 16 / z, "#cfe3fd");
        }

        if (arrastre?.tipo === "crear") {
            const x = Math.min(arrastre.x0, arrastre.x1);
            const ancho = Math.abs(arrastre.x1 - arrastre.x0);
            const esHueco = estado.herramienta === HERRAMIENTA_HUECO;
            ctx.fillStyle = esHueco ? COLOR_HUECO : colorTipo(estado.herramienta);
            ctx.globalAlpha = 0.5;
            ctx.fillRect(x, arrastre.y, ancho, esHueco ? ALTO_MUNDO - arrastre.y : ALTO_TILE);
            ctx.globalAlpha = 1;
            if (ancho > 0) etiqueta(`${esHueco ? "hueco " : ""}${ancho}px`, x + ancho / 2, arrastre.y - 16 / z, "#e6e8eb");
        }
    }

    function dibujarRegla(piso) {
        const z = vista.zoom;
        ctx.fillStyle = "#15181d";
        ctx.fillRect(0, 0, tamano.ancho, ALTO_REGLA);
        ctx.fillStyle = "#272c35";
        ctx.fillRect(0, ALTO_REGLA - 1, tamano.ancho, 1);

        const paso = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096].find((valor) => valor * z >= 64) || 8192;
        ctx.font = `10px ${FUENTE_MONO}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        for (let x = Math.floor(vista.x / paso) * paso; x < vista.x + anchoVisible(); x += paso / 4) {
            const px = Math.round((x - vista.x) * z) + 0.5;
            const principal = x % paso === 0;
            ctx.fillStyle = principal ? "#5b6472" : "#363d49";
            ctx.fillRect(px, principal ? 0 : ALTO_REGLA - 6, 1, principal ? ALTO_REGLA : 6);
            if (principal) {
                ctx.fillStyle = x >= 0 && x <= anchoMundo(piso) ? "#aab4c3" : "#5b6472";
                ctx.fillText(String(x), px + 4, ALTO_REGLA / 2 - 1);
            }
        }

        if (cursorMundo) {
            ctx.fillStyle = "#4f9cf9";
            ctx.fillRect(Math.round((cursorMundo.x - vista.x) * z), 0, 1, ALTO_REGLA);
        }
    }

    function dibujarMinimapa(piso) {
        const dpr = window.devicePixelRatio || 1;
        const ancho = minimapa.width / dpr;
        const alto = minimapa.height / dpr;
        const mundo = anchoMundo(piso);
        const escala = ancho / mundo;

        ctxMini.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctxMini.fillStyle = "#0a0c0f";
        ctxMini.fillRect(0, 0, ancho, alto);
        ctxMini.fillStyle = piso.colorPlaceholder;
        ctxMini.globalAlpha = 0.45;
        ctxMini.fillRect(0, 0, ancho, alto);
        ctxMini.globalAlpha = 1;

        piso.plataformas.forEach((p, i) => {
            const y = (p.y / ALTO_MUNDO) * alto;
            const hueco = huecoDespues(piso.plataformas, i);
            if (hueco) {
                ctxMini.fillStyle = COLORES_SALTO[analizarHueco(piso, i).resultado];
                ctxMini.globalAlpha = 0.55;
                ctxMini.fillRect((p.x + p.ancho) * escala, y, Math.max(1, hueco * escala), alto - y);
                ctxMini.globalAlpha = 1;
            }
            ctxMini.fillStyle = i === estado.seleccion ? "#ffffff" : colorTipo(p.tipo);
            ctxMini.fillRect(p.x * escala, y, Math.max(1, p.ancho * escala), Math.max(7, (ALTO_TILE / ALTO_MUNDO) * alto));
        });

        piso.objetos.forEach((o, i) => {
            ctxMini.fillStyle = i === estado.seleccionObjeto ? "#ffffff" : MODOS.find((m) => m.id === o.modo)?.color || MODOS[0].color;
            ctxMini.fillRect(o.x * escala, (o.y / ALTO_MUNDO) * alto, Math.max(2, o.ancho * escala), Math.max(2, (o.alto / ALTO_MUNDO) * alto));
        });

        ctxMini.strokeStyle = "#4f9cf9";
        ctxMini.lineWidth = 1.5;
        ctxMini.strokeRect(vista.x * escala + 0.75, 0.75, Math.max(4, anchoVisible() * escala - 1.5), alto - 1.5);
    }

    function render() {
        const piso = pisoActivo();
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = "#0a0c0f";
        ctx.fillRect(0, 0, tamano.ancho, tamano.alto);
        if (!piso) return;

        const ancho = anchoMundo(piso);
        const desde = vista.x;
        const hasta = vista.x + anchoVisible();

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, ALTO_REGLA, tamano.ancho, tamano.alto - ALTO_REGLA);
        ctx.clip();
        ctx.translate(0, ALTO_REGLA);
        ctx.scale(vista.zoom, vista.zoom);
        ctx.translate(-vista.x, -vista.y);

        dibujarFondo(piso, ancho, desde, hasta);
        dibujarGuias(ancho, desde, hasta);
        dibujarObjetos(piso, true, desde, hasta);
        dibujarHuecos(piso);
        piso.plataformas.forEach((p, i) => {
            if (p.x + p.ancho >= desde && p.x <= hasta) dibujarPlataforma(piso, i);
        });
        dibujarObjetos(piso, false, desde, hasta);
        dibujarInicio(piso);
        dibujarSeleccion();
        ctx.restore();

        dibujarRegla(piso);
        dibujarMinimapa(piso);
    }

    // ----------------------------------------------- Interaccion del lienzo

    function aMundo(evento) {
        const caja = lienzo.getBoundingClientRect();
        return {
            x: (evento.clientX - caja.left) / vista.zoom + vista.x,
            y: (evento.clientY - caja.top - ALTO_REGLA) / vista.zoom + vista.y
        };
    }

    function plataformaEn(punto) {
        const plataformas = pisoActivo()?.plataformas || [];
        for (let i = plataformas.length - 1; i >= 0; i--) {
            const p = plataformas[i];
            if (punto.x >= p.x && punto.x <= p.x + p.ancho && punto.y >= p.y && punto.y <= p.y + ALTO_TILE) return i;
        }
        return -1;
    }

    function objetoEn(punto, deFondo) {
        const objetos = pisoActivo()?.objetos || [];
        for (let i = objetos.length - 1; i >= 0; i--) {
            const o = objetos[i];
            if ((o.modo === MODOS_OBJETO.FONDO) !== deFondo) continue;
            if (punto.x >= o.x && punto.x <= o.x + o.ancho && punto.y >= o.y && punto.y <= o.y + o.alto) return i;
        }
        return -1;
    }

    // Mismo orden que el dibujo: objetos con colision, plataformas y, al fondo, objetos de fondo
    function elementoEn(punto) {
        const delante = objetoEn(punto, false);
        if (delante !== -1) return { objeto: delante };
        const plataforma = plataformaEn(punto);
        if (plataforma !== -1) return { plataforma };
        const detras = objetoEn(punto, true);
        return detras !== -1 ? { objeto: detras } : null;
    }

    function asaObjetoEn(punto) {
        const o = objetoSeleccionado();
        if (!o) return false;
        const tolerancia = 8 / vista.zoom;
        return Math.abs(punto.x - (o.x + o.ancho)) <= tolerancia && Math.abs(punto.y - o.y) <= tolerancia;
    }

    function asaEn(punto) {
        const p = plataformaSeleccionada();
        if (!p) return null;
        const tolerancia = 8 / vista.zoom;
        if (punto.y < p.y - tolerancia || punto.y > p.y + ALTO_TILE + tolerancia) return null;
        if (Math.abs(punto.x - p.x) <= tolerancia) return "izq";
        if (Math.abs(punto.x - (p.x + p.ancho)) <= tolerancia) return "der";
        return null;
    }

    // Se pega a los bordes de otras plataformas y, si no hay ninguno cerca, a la grilla
    function ajustarBorde(valor, excluida, libre) {
        if (libre) return Math.max(0, Math.round(valor));
        const tolerancia = 10 / vista.zoom;
        let mejor = Math.round(valor / estado.snap) * estado.snap;
        let distancia = tolerancia;
        (pisoActivo()?.plataformas || []).forEach((p) => {
            if (p === excluida) return;
            [p.x, p.x + p.ancho].forEach((borde) => {
                if (Math.abs(borde - valor) <= distancia) {
                    distancia = Math.abs(borde - valor);
                    mejor = borde;
                }
            });
        });
        return Math.max(0, mejor);
    }

    function ajustarMovimiento(x, plataforma, libre) {
        if (libre) return Math.max(0, Math.round(x));
        const izquierda = ajustarBorde(x, plataforma, false);
        const derecha = ajustarBorde(x + plataforma.ancho, plataforma, false) - plataforma.ancho;
        const pegaGrilla = (valor) => valor % estado.snap === 0;
        if (!pegaGrilla(izquierda)) return izquierda;
        if (!pegaGrilla(derecha + plataforma.ancho) && derecha >= 0) return derecha;
        return izquierda;
    }

    // Mover lleva el objeto a cualquier parte. El asa cambia el tamano dejando fija la esquina inferior izquierda.
    function aplicarArrastreObjeto(punto, evento) {
        const o = arrastre.objeto;
        const original = arrastre.original;
        const libre = evento.altKey;
        const dx = punto.x - arrastre.inicio.x;
        const dy = punto.y - arrastre.inicio.y;
        const base = original.y + original.alto;
        const nuevo = { x: o.x, y: o.y, ancho: o.ancho, alto: o.alto };

        if (arrastre.tipo === "moverObjeto") {
            nuevo.x = Math.max(0, ajustarGrilla(original.x + dx, libre));
            nuevo.y = ajustarBase({ ...o, x: nuevo.x }, base + dy, libre) - o.alto;
        } else {
            nuevo.ancho = Math.max(LADO_MINIMO_OBJETO, ajustarGrilla(original.ancho + dx, libre));
            nuevo.alto = Math.max(LADO_MINIMO_OBJETO, evento.shiftKey
                ? Math.round(nuevo.ancho * original.alto / original.ancho)
                : ajustarGrilla(original.alto - dy, libre));
            nuevo.y = base - nuevo.alto;
        }

        if (Object.keys(nuevo).every((clave) => nuevo[clave] === o[clave])) return;
        if (!arrastre.registrado) {
            registrar();
            arrastre.registrado = true;
        }
        Object.assign(o, nuevo);
        sincronizarInspector();
        pedirRender();
    }

    function aplicarArrastre(evento) {
        const punto = aMundo(evento);
        const piso = pisoActivo();

        if (arrastre.tipo === "desplazar") {
            vista.x = arrastre.vistaX - (evento.clientX - arrastre.px) / vista.zoom;
            vista.y = arrastre.vistaY - (evento.clientY - arrastre.py) / vista.zoom;
            limitarVista();
            pedirRender();
            return;
        }

        if (arrastre.tipo === "crear") {
            arrastre.x1 = ajustarBorde(punto.x, null, evento.altKey);
            pedirRender();
            return;
        }

        if (arrastre.objeto) {
            aplicarArrastreObjeto(punto, evento);
            return;
        }

        const p = arrastre.plataforma;
        const antes = `${p.x}:${p.ancho}`;
        const delta = punto.x - arrastre.inicio;
        const original = arrastre.original;
        let x = p.x;
        let ancho = p.ancho;

        if (arrastre.tipo === "mover") {
            x = ajustarMovimiento(original.x + delta, p, evento.altKey);
        } else if (arrastre.tipo === "izq") {
            const fin = original.x + original.ancho;
            x = Math.min(ajustarBorde(original.x + delta, p, evento.altKey), fin - ANCHO_MINIMO);
            ancho = fin - x;
        } else {
            ancho = Math.max(ANCHO_MINIMO, ajustarBorde(original.x + original.ancho + delta, p, evento.altKey) - original.x);
        }

        if (`${x}:${ancho}` === antes) return;
        if (!arrastre.registrado) {
            registrar();
            arrastre.registrado = true;
        }
        p.x = x;
        p.ancho = ancho;
        ordenar(piso, p);
        sincronizarInspector();
        pedirRender();
    }

    function alPulsar(evento) {
        const piso = pisoActivo();
        if (!piso) return;
        lienzo.setPointerCapture(evento.pointerId);
        document.activeElement?.blur?.();
        const punto = aMundo(evento);
        const desplazar = { tipo: "desplazar", px: evento.clientX, py: evento.clientY, vistaX: vista.x, vistaY: vista.y };

        if (evento.button !== 0 || espacioPulsado) {
            arrastre = desplazar;
            lienzo.style.cursor = "grabbing";
            return;
        }

        if (estado.herramienta === HERRAMIENTA_OBJETO) {
            crearObjeto(punto, evento.altKey);
            return;
        }

        if (estado.herramienta !== "seleccionar") {
            const x = ajustarBorde(punto.x, null, evento.altKey);
            seleccionar(null);
            arrastre = { tipo: "crear", x0: x, x1: x, y: alturaEn(punto) };
            return;
        }

        if (asaObjetoEn(punto)) {
            const o = objetoSeleccionado();
            arrastre = { tipo: "tamObjeto", objeto: o, original: { ...o }, inicio: punto, registrado: false };
            return;
        }

        const asa = asaEn(punto);
        if (asa) {
            const p = plataformaSeleccionada();
            arrastre = { tipo: asa, plataforma: p, original: { x: p.x, ancho: p.ancho }, inicio: punto.x, registrado: false };
            return;
        }

        const elemento = elementoEn(punto);
        if (elemento?.objeto !== undefined) {
            const o = piso.objetos[elemento.objeto];
            seleccionarObjeto(elemento.objeto);
            arrastre = { tipo: "moverObjeto", objeto: o, original: { ...o }, inicio: punto, registrado: false };
            return;
        }

        const indice = elemento ? elemento.plataforma : -1;
        if (indice !== -1) {
            const p = piso.plataformas[indice];
            seleccionar(indice);
            arrastre = { tipo: "mover", plataforma: p, original: { x: p.x, ancho: p.ancho }, inicio: punto.x, registrado: false };
            return;
        }

        seleccionar(null);
        arrastre = desplazar;
    }

    function alMover(evento) {
        cursorMundo = aMundo(evento);
        $("datoCursor").textContent = `x ${Math.round(cursorMundo.x)} · y ${Math.round(cursorMundo.y)}`;

        if (arrastre) {
            aplicarArrastre(evento);
            return;
        }

        if (espacioPulsado) lienzo.style.cursor = "grab";
        else if (estado.herramienta !== "seleccionar") lienzo.style.cursor = "crosshair";
        else if (asaObjetoEn(cursorMundo)) lienzo.style.cursor = "nesw-resize";
        else if (asaEn(cursorMundo)) lienzo.style.cursor = "ew-resize";
        else lienzo.style.cursor = elementoEn(cursorMundo) ? "move" : "default";
        pedirRender();
    }

    function alSoltar() {
        const terminado = arrastre;
        arrastre = null;
        lienzo.style.cursor = "default";
        if (!terminado) return;

        if (terminado.tipo === "crear") {
            const piso = pisoActivo();
            const esHueco = estado.herramienta === HERRAMIENTA_HUECO;
            let desde = Math.min(terminado.x0, terminado.x1);
            let hasta = Math.max(terminado.x0, terminado.x1);
            // Un clic sin arrastrar usa un ancho por defecto
            if (hasta - desde < (esHueco ? estado.snap : ANCHO_MINIMO)) {
                desde = esHueco ? Math.max(0, terminado.x0 - ANCHO_HUECO_NUEVO / 2) : terminado.x0;
                hasta = desde + (esHueco ? ANCHO_HUECO_NUEVO : ANCHO_NUEVA);
            }

            const antes = firma(piso);
            registrar();
            const { nueva, trampa } = pintarTramo(piso, desde, hasta, terminado.y, estado.herramienta);
            if (firma(piso) === antes) {
                historial.pasado.pop();
                avisar(esHueco ? "Ahí no hay piso para abrir un hueco." : "Ese tramo ya era de ese tipo.");
                pedirRender();
                return;
            }
            if (trampa && !piso.trampasHabilitadas.includes(trampa)) piso.trampasHabilitadas.push(trampa);
            estado.seleccion = nueva ? piso.plataformas.indexOf(nueva) : null;
            alCambiar();
            return;
        }

        if (terminado.registrado) alCambiar();
        else pedirRender();
    }

    function alRodar(evento) {
        evento.preventDefault();
        if (evento.ctrlKey || evento.metaKey) {
            const caja = lienzo.getBoundingClientRect();
            fijarZoom(vista.zoom * Math.exp(-evento.deltaY * 0.01), evento.clientX - caja.left);
            return;
        }
        const delta = Math.abs(evento.deltaX) > Math.abs(evento.deltaY) ? evento.deltaX : evento.deltaY;
        vista.x += delta / vista.zoom;
        limitarVista();
        pedirRender();
    }

    function moverMinimapa(evento) {
        const piso = pisoActivo();
        if (!piso) return;
        const caja = minimapa.getBoundingClientRect();
        vista.x = ((evento.clientX - caja.left) / caja.width) * anchoMundo(piso) - anchoVisible() / 2;
        limitarVista();
        pedirRender();
    }

    function fijarHerramienta(herramienta) {
        estado.herramienta = herramienta;
        if (herramienta !== "seleccionar") limpiarSeleccion();
        sincronizarInspector();
        pedirRender();
    }

    function alTeclear(evento) {
        const modal = document.querySelector(".modal:not([hidden])");
        if (modal) {
            if (evento.key === "Escape") cerrarModales();
            return;
        }

        const tecla = evento.key.toLowerCase();
        const comando = evento.metaKey || evento.ctrlKey;
        const enCampo = evento.target instanceof Element && evento.target.closest("input, textarea, select");

        if (comando && tecla === "s") {
            evento.preventDefault();
            guardar();
            return;
        }
        if (enCampo) return;

        if (comando && tecla === "z") {
            evento.preventDefault();
            if (evento.shiftKey) rehacer();
            else deshacer();
        } else if (comando && tecla === "y") {
            evento.preventDefault();
            rehacer();
        } else if (comando && tecla === "d") {
            evento.preventDefault();
            if (objetoSeleccionado()) duplicarObjeto();
            else duplicarPlataforma();
        } else if (comando) {
            return;
        } else if (evento.code === "Space") {
            evento.preventDefault();
            espacioPulsado = true;
        } else if (tecla === "delete" || tecla === "backspace") {
            evento.preventDefault();
            if (objetoSeleccionado()) eliminarObjeto();
            else eliminarPlataforma();
        } else if (tecla === "escape") {
            seleccionar(null);
        } else if (tecla === "v") {
            fijarHerramienta("seleccionar");
        } else if (["1", "2", "3"].includes(tecla)) {
            fijarHerramienta(TIPOS[Number(tecla) - 1].id);
        } else if (tecla === "4" || tecla === "h") {
            fijarHerramienta(HERRAMIENTA_HUECO);
        } else if (tecla === "5" || tecla === "o") {
            fijarHerramienta(HERRAMIENTA_OBJETO);
        } else if (tecla === "f") {
            encajar();
        } else if (tecla === "a") {
            verTodo();
        } else if (tecla.startsWith("arrow") && (plataformaSeleccionada() || objetoSeleccionado())) {
            evento.preventDefault();
            const paso = evento.shiftKey ? estado.snap * 4 : estado.snap;
            editar(() => {
                const p = plataformaSeleccionada() || objetoSeleccionado();
                if (tecla === "arrowleft") p.x = Math.max(0, p.x - paso);
                if (tecla === "arrowright") p.x += paso;
                if (tecla === "arrowup") p.y -= 16;
                if (tecla === "arrowdown") p.y += 16;
            });
        }
    }

    // ---------------------------------------------- Guardar, codigo y prueba

    function descargar(contenido) {
        const enlace = h("a", {
            href: URL.createObjectURL(new Blob([contenido], { type: "text/javascript" })),
            download: "niveles.js"
        });
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
    }

    function marcarGuardado() {
        estado.pisos.forEach((piso) => { piso._notas = []; });
        fijarLineaBase();
        alCambiar();
    }

    async function guardar() {
        const contenido = generarArchivoNiveles();
        const conErrores = estado.pisos.filter((piso) => contar(piso, "error")).length;
        const sufijo = conErrores ? ` Ojo: ${conErrores} ${conErrores === 1 ? "piso tiene" : "pisos tienen"} errores.` : "";

        if (!window.showSaveFilePicker) {
            descargar(contenido);
            marcarGuardado();
            avisar(`Se descargó niveles.js. Reemplaza con él el archivo de la carpeta del juego.${sufijo}`);
            return;
        }

        try {
            if (!manejadorArchivo) {
                manejadorArchivo = await window.showSaveFilePicker({
                    suggestedName: "niveles.js",
                    types: [{ description: "JavaScript", accept: { "text/javascript": [".js"] } }]
                });
            }
            const escritor = await manejadorArchivo.createWritable();
            await escritor.write(contenido);
            await escritor.close();
            marcarGuardado();
            avisar(manejadorArchivo.name === "niveles.js"
                ? `Guardado en niveles.js.${sufijo}`
                : `Guardado en ${manejadorArchivo.name}. El juego solo lee niveles.js.${sufijo}`);
        } catch (error) {
            if (error.name === "AbortError") return;
            manejadorArchivo = null;
            avisar(`No se pudo guardar: ${error.message}`, "error");
        }
    }

    function cerrarModales() {
        document.querySelectorAll(".modal").forEach((modal) => { modal.hidden = true; });
        $("marcoPrueba").removeAttribute("src");
    }

    function abrirCodigo() {
        $("textareaCodigo").value = generarArchivoNiveles();
        $("modalCodigo").hidden = false;
    }

    async function copiarCodigo() {
        const campo = $("textareaCodigo");
        try {
            await navigator.clipboard.writeText(campo.value);
        } catch (error) {
            campo.select();
            document.execCommand("copy");
        }
        avisar("Código copiado.");
    }

    function enviarPisosAPrueba() {
        const marco = $("marcoPrueba");
        const piso = pisoActivo();
        if (!marco.contentWindow || !piso) return;
        marco.contentWindow.postMessage({
            tipo: "juego_ame:cargar_pisos",
            pisos: estado.pisos.map(exportarPiso),
            idActivo: piso.id
        }, "*");
        marco.focus();
    }

    function abrirPrueba() {
        const piso = pisoActivo();
        if (!piso?.plataformas.length) return;
        $("tituloPrueba").textContent = piso.nombre;
        $("modalPrueba").hidden = false;
        $("marcoPrueba").src = "index.html?prueba=1";
    }

    function alRecibirMensaje(evento) {
        if (evento.source !== $("marcoPrueba").contentWindow) return;
        if (evento.data?.tipo === "juego_ame:listo") enviarPisosAPrueba();
        if (evento.data?.tipo === "juego_ame:cerrar_prueba") cerrarModales();
    }

    // ------------------------------------------------------------ Arranque

    function enlazarCampo(id, aplicar) {
        $(id).addEventListener("change", (evento) => {
            if (!pisoActivo()) return;
            editar((piso) => aplicar(piso, evento.target.value, plataformaSeleccionada()));
            sincronizarInspector();
        });
    }

    function enlazarCampoObjeto(id, aplicar) {
        $(id).addEventListener("change", (evento) => {
            if (!objetoSeleccionado()) return;
            editar(() => aplicar(objetoSeleccionado(), evento.target.value));
            sincronizarInspector();
        });
    }

    function entero(valor, respaldo, minimo = -Infinity) {
        const numero = Math.round(Number(valor));
        return Number.isFinite(numero) && valor !== "" ? Math.max(minimo, numero) : respaldo;
    }

    function crearChips(contenedor, enumeracion, clave) {
        $(contenedor).replaceChildren(...Object.entries(enumeracion).map(([nombre, valor]) =>
            h("button", {
                class: "chip",
                "data-valor": valor,
                onclick: () => editar((piso) => {
                    const lista = piso[clave];
                    if (lista.includes(valor)) lista.splice(lista.indexOf(valor), 1);
                    else lista.push(valor);
                })
            }, nombre)
        ));
    }

    function construirInterfaz() {
        $("campoTipoPiso").replaceChildren(...Object.entries(TIPOS_PISO).map(([nombre, valor]) =>
            h("option", { value: valor }, nombre.charAt(0) + nombre.slice(1).toLowerCase())
        ));
        $("selectPersonaje").replaceChildren(...Object.entries(personajesDisponibles).map(([clave, personaje]) =>
            h("option", { value: clave }, personaje.nombre)
        ));
        crearChips("chipsTrampas", TRAMPAS, "trampasHabilitadas");
        crearChips("chipsProps", PROPS, "propsPermitidos");
        $("segTipo").replaceChildren(...TIPOS.map((tipo) =>
            h("button", {
                "data-tipo": tipo.id,
                onclick: () => editar(() => { plataformaSeleccionada().tipo = tipo.id; })
            }, h("i", { class: `punto tipo-${tipo.id}` }), tipo.nombre)
        ));

        $("segModo").replaceChildren(...MODOS.map((modo) =>
            h("button", {
                "data-modo": modo.id,
                title: modo.ayuda,
                onclick: () => editar(() => {
                    objetoSeleccionado().modo = modo.id;
                    estado.ultimoModo = modo.id;
                })
            }, h("i", { class: `punto modo-${modo.id}` }), modo.nombre)
        ));

        // Acepta el nombre solo, con .png o con la ruta completa
        enlazarCampoObjeto("objTipo", (o, valor) => {
            o.tipo = valor.trim().replace(/^.*[\\/]/, "").replace(/\.png$/i, "");
            if (o.tipo) estado.ultimoObjeto = o.tipo;
        });
        enlazarCampoObjeto("objX", (o, valor) => { o.x = entero(valor, o.x, 0); });
        enlazarCampoObjeto("objY", (o, valor) => { o.y = entero(valor, o.y); });
        enlazarCampoObjeto("objAncho", (o, valor) => { o.ancho = entero(valor, o.ancho, LADO_MINIMO_OBJETO); });
        enlazarCampoObjeto("objAlto", (o, valor) => { o.alto = entero(valor, o.alto, LADO_MINIMO_OBJETO); });

        enlazarCampo("campoId", (piso, valor) => { piso.id = entero(valor, piso.id, 1); });
        enlazarCampo("campoNombre", (piso, valor) => { piso.nombre = valor.trim(); });
        enlazarCampo("campoFondo", (piso, valor) => { piso.fondoRuta = valor.trim(); });
        enlazarCampo("campoColor", (piso, valor) => { piso.colorPlaceholder = valor; });
        enlazarCampo("campoTipoPiso", (piso, valor) => { piso.tipoPiso = valor; });
        enlazarCampo("campoTema", (piso, valor) => { piso.tilesTema = valor.trim() || TEMA_TILES_DEFAULT; });
        enlazarCampo("campoVariantes", (piso, valor) => { piso.tilesVariantes = Math.min(MAX_VARIANTES, entero(valor, piso.tilesVariantes, 0)); });
        enlazarCampo("platX", (piso, valor, p) => { p.x = entero(valor, p.x, 0); });
        enlazarCampo("platAncho", (piso, valor, p) => { p.ancho = entero(valor, p.ancho, ANCHO_MINIMO); });
        enlazarCampo("platY", (piso, valor, p) => { p.y = entero(valor, p.y, 1); });
        enlazarCampo("platHueco", (piso, valor) => {
            const actual = huecoDespues(piso.plataformas, estado.seleccion);
            desplazarDesde(piso, estado.seleccion + 1, entero(valor, actual, 0) - actual);
        });

        $("btnDeshacer").addEventListener("click", deshacer);
        $("btnRehacer").addEventListener("click", rehacer);
        $("btnGuardar").addEventListener("click", guardar);
        $("btnCodigo").addEventListener("click", abrirCodigo);
        $("btnProbar").addEventListener("click", abrirPrueba);
        $("btnReiniciarPrueba").addEventListener("click", enviarPisosAPrueba);
        $("btnCopiarCodigo").addEventListener("click", copiarCodigo);
        $("btnDescargarCodigo").addEventListener("click", () => descargar($("textareaCodigo").value));
        $("btnNuevoPiso").addEventListener("click", nuevoPiso);
        $("btnDuplicarPiso").addEventListener("click", duplicarPiso);
        $("btnSubirPiso").addEventListener("click", () => moverPiso(-1));
        $("btnBajarPiso").addEventListener("click", () => moverPiso(1));
        $("btnEliminarPiso").addEventListener("click", eliminarPiso);
        $("btnDuplicarPlat").addEventListener("click", duplicarPlataforma);
        $("btnEliminarPlat").addEventListener("click", eliminarPlataforma);
        $("btnTamanoOriginal").addEventListener("click", usarTamanoOriginal);
        $("btnApoyarObjeto").addEventListener("click", apoyarObjeto);
        $("btnDuplicarObjeto").addEventListener("click", duplicarObjeto);
        $("btnEliminarObjeto").addEventListener("click", eliminarObjeto);
        $("btnZoomMenos").addEventListener("click", () => fijarZoom(vista.zoom / 1.25));
        $("btnZoomMas").addEventListener("click", () => fijarZoom(vista.zoom * 1.25));
        $("btnEncajar").addEventListener("click", encajar);
        $("btnVerTodo").addEventListener("click", verTodo);

        document.querySelectorAll(".herramienta").forEach((boton) => {
            boton.addEventListener("click", () => fijarHerramienta(boton.dataset.herramienta));
        });
        document.querySelectorAll("[data-cerrar]").forEach((boton) => boton.addEventListener("click", cerrarModales));
        document.querySelectorAll(".modal").forEach((modal) => {
            modal.addEventListener("pointerdown", (evento) => {
                if (evento.target === modal) cerrarModales();
            });
        });

        $("selectSnap").addEventListener("change", (evento) => { estado.snap = Number(evento.target.value); });
        $("selectPersonaje").addEventListener("change", (evento) => {
            estado.personaje = evento.target.value;
            pedirRender();
        });
        $("chkArcos").addEventListener("change", (evento) => {
            estado.verArcos = evento.target.checked;
            pedirRender();
        });
        $("chkFondo").addEventListener("change", (evento) => {
            estado.verFondo = evento.target.checked;
            pedirRender();
        });

        lienzo.addEventListener("pointerdown", alPulsar);
        lienzo.addEventListener("pointermove", alMover);
        lienzo.addEventListener("pointerup", alSoltar);
        lienzo.addEventListener("pointercancel", alSoltar);
        lienzo.addEventListener("pointerleave", () => {
            cursorMundo = null;
            pedirRender();
        });
        lienzo.addEventListener("wheel", alRodar, { passive: false });
        lienzo.addEventListener("contextmenu", (evento) => evento.preventDefault());
        minimapa.addEventListener("pointerdown", (evento) => {
            minimapa.setPointerCapture(evento.pointerId);
            moverMinimapa(evento);
        });
        minimapa.addEventListener("pointermove", (evento) => {
            if (evento.buttons) moverMinimapa(evento);
        });

        // Un campo a medio escribir no se sobrescribe; al confirmarlo vuelve a mostrar el valor real
        document.addEventListener("input", (evento) => { campoEditando = evento.target; });
        document.addEventListener("change", () => { campoEditando = null; }, true);
        window.addEventListener("keydown", alTeclear);
        window.addEventListener("keyup", (evento) => {
            if (evento.code === "Space") espacioPulsado = false;
        });
        window.addEventListener("message", alRecibirMensaje);
        new ResizeObserver(ajustarLienzo).observe($("contenedorLienzo"));

        Object.values(personajesDisponibles).forEach((personaje) => {
            personaje.animaciones?.quieto?.spriteSheet?.addEventListener?.("load", pedirRender);
        });
    }

    function iniciar() {
        estado.pisos = PISOS_CONFIG.map(importarPiso);
        fijarLineaBase();
        construirInterfaz();
        ajustarLienzo();
        alCambiar();
        revisarBorrador();
    }

    iniciar();
})();
