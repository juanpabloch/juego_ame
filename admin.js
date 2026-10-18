// Editor de pisos. Lee PISOS_CONFIG (niveles.js) y genera un niveles.js nuevo al guardar.
// Va dentro de una funcion para no chocar con los nombres globales de niveles_base.js.
(() => {
    "use strict";

    // Deben coincidir con motor.js y escenario.js
    const ANCHO_PANTALLA = 1366;
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
        { id: TIPOS_PLATAFORMA.RESBALADIZO, nombre: "Resbaladizo", color: "#5cc8e0", sinHueco: "pisoResbaladizo", conHueco: "pisoResbaladizoConHueco" },
        { id: TIPOS_PLATAFORMA.QUEBRADIZO, nombre: "Quebradizo", color: "#d9822b", sinHueco: "pisoQuebradizo", conHueco: "pisoQuebradizoConHueco" },
        { id: TIPOS_PLATAFORMA.MOVIL, nombre: "Móvil", color: "#5ce1e6", sinHueco: "plataformaMovil", conHueco: "plataformaMovil" },
        { id: TIPOS_PLATAFORMA.CINTA, nombre: "Cinta", color: "#ffe14d", sinHueco: "cintaTransportadora", conHueco: "cintaTransportadora" },
        { id: TIPOS_PLATAFORMA.REBOTE, nombre: "Rebote", color: "#ff3b5c", sinHueco: "plataformaRebote", conHueco: "plataformaRebote" }
    ];
    const TIPOS_TRAMPAS_UI = [
        { id: TIPOS_TRAMPA_ACTIVA.PINCHOS, nombre: "Pinchos", color: "#f0616d", ancho: 88, alto: 26, ayuda: "Pinchos o cables eléctricos fijos en piso o techo." },
        { id: TIPOS_TRAMPA_ACTIVA.VAPOR, nombre: "Vapor", color: "#fb923c", ancho: 48, alto: 130, ayuda: "Chorro de vapor o fuego con ciclo de aviso, disparo y pausa." },
        { id: TIPOS_TRAMPA_ACTIVA.LASER, nombre: "Láser", color: "#ff3b5c", ancho: 130, alto: 24, ayuda: "Rayo láser con ciclo. Ponlo a media altura para pasar agachado." },
        { id: TIPOS_TRAMPA_ACTIVA.APLASTADOR, nombre: "Aplastador", color: "#94a3b8", ancho: 72, alto: 84, ayuda: "Prensa pesada que baja de golpe desde arriba y vuelve a subir." },
        { id: TIPOS_TRAMPA_ACTIVA.SIERRA, nombre: "Sierra", color: "#facc15", ancho: 52, alto: 52, ayuda: "Obstáculo móvil que patrulla de un lado a otro en X o Y." }
    ];
    const TIPOS_ITEMS_UI = [
        { id: TIPOS_ITEM.VIDA, nombre: "Vida (+1 ♥)", color: "#ff4d6d" },
        { id: TIPOS_ITEM.DOBLE_SALTO, nombre: "Doble Salto (2X ▲)", color: "#5ce1e6" },
        { id: TIPOS_ITEM.TARJETA, nombre: "Tarjeta Acceso", color: "#fbbf24" }
    ];
    const TIPOS_INTERRUPTORES_UI = [
        { id: TIPOS_INTERRUPTOR.BOTON_PISO, nombre: "Botón de piso" },
        { id: TIPOS_INTERRUPTOR.PALANCA, nombre: "Palanca / Tablero" },
        { id: TIPOS_INTERRUPTOR.VALVULA, nombre: "Válvula / Tubería" }
    ];
    const MODOS = [
        { id: MODOS_OBJETO.FONDO, nombre: "Fondo", color: "#b9a3f5", ayuda: "Solo se ve. El jugador pasa por delante." },
        { id: MODOS_OBJETO.PLATAFORMA, nombre: "Encima", color: "#7fd1a0", ayuda: "El jugador se para encima. De costado y desde abajo lo atraviesa." },
        { id: MODOS_OBJETO.SOLIDO, nombre: "Sólido", color: "#e879c5", ayuda: "El jugador se para encima y además choca de costado y desde abajo." }
    ];
    const HERRAMIENTA_OBJETO = "objeto";
    const HERRAMIENTA_FLOTANTE = "flotante";
    const HERRAMIENTA_TRAMPA = "trampa";
    const HERRAMIENTA_ELEMENTO = "elemento";
    const TAMANO_OBJETO = 96;
    const LADO_MINIMO_OBJETO = 16;
    const HERRAMIENTA_HUECO = "hueco";
    const ANCHO_HUECO_NUEVO = 128;
    const COLOR_HUECO = "#f0616d";
    const PISTAS = {
        seleccionar: "Seleccionar: haz clic en cualquier plataforma, trampa, vida, poder, checkpoint, meta u objeto para editarlo, cambiar su imagen y arrastrarlo.",
        normal: "Piso: arrastra en horizontal para pintar piso normal. Rellena huecos y reemplaza las trampas que haya en ese tramo.",
        pivote: "Pivote: arrastra sobre el piso para convertir ese tramo en una trampa que se cae al pisarla.",
        resbaladizo: "Resbaladizo: arrastra sobre el piso para convertir ese tramo en piso resbaladizo.",
        quebradizo: "Quebradizo: arrastra sobre el piso para crear un tramo que tiembla al pisarlo, se rompe y se regenera.",
        hueco: "Hueco: arrastra sobre el piso para abrir un hueco de ese ancho. Un clic abre uno de 128px.",
        flotante: "Aérea/Móvil: haz clic en el aire para colocar una plataforma flotante (puedes cambiarla a Móvil, Cinta o Rebote en el panel derecho).",
        trampa: "Trampa: haz clic donde quieras para colocar la trampa elegida (pinchos, vapor, láser, aplastador o sierra) y asignarle imagen PNG.",
        elemento: "Vida/Poder/Meta: haz clic donde quieras para colocar una Vida (+1 ♥), el Poder de Doble Salto (2X), una Tarjeta, un Checkpoint o el Ascensor Meta.",
        objeto: "Objeto: haz clic donde quieras colocarlo. Después elige su imagen PNG y si es de fondo, para saltar encima o sólido."
    };
    const COLORES_SALTO = { ok: "#4cc38a", justo: "#f2b84b", parcial: "#f2b84b", imposible: "#f0616d" };
    const CLAVES_PISO = [
        "id", "nombre", "fondoRuta", "colorPlaceholder", "tipoPiso", "tilesTema",
        "tilesVariantes", "trampasHabilitadas", "propsPermitidos", "objetos", "plataformas",
        "trampas", "interruptores", "checkpoints", "items", "meta"
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
        seleccionTrampa: null,
        seleccionElemento: null, // { categoria: "checkpoint" | "item" | "interruptor" | "meta", indice: number }
        catalogo: [],
        tipoCatalogo: null,
        ultimoObjeto: PROPS.CAJAS,
        ultimoModo: MODOS_OBJETO.FONDO,
        ultimaTrampa: TIPOS_TRAMPA_ACTIVA.PINCHOS,
        ultimaCategoriaElemento: "item",
        ultimoSubtipoItem: TIPOS_ITEM.VIDA,
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
    let callbackSelectorImagen = null;

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

    function trampaSeleccionada() {
        const piso = pisoActivo();
        return piso && estado.seleccionTrampa !== null ? (piso.trampas || [])[estado.seleccionTrampa] || null : null;
    }

    function elementoSeleccionado() {
        const piso = pisoActivo();
        const sel = estado.seleccionElemento;
        if (!piso || !sel) return null;
        const categoria = sel.categoria || sel.clase;
        if (categoria === "checkpoint") {
            const datos = (piso.checkpoints || [])[sel.indice];
            return datos ? { categoria: "checkpoint", indice: sel.indice, datos } : null;
        }
        if (categoria === "item") {
            const datos = (piso.items || [])[sel.indice];
            return datos ? { categoria: "item", indice: sel.indice, datos } : null;
        }
        if (categoria === "interruptor") {
            const datos = (piso.interruptores || [])[sel.indice];
            return datos ? { categoria: "interruptor", indice: sel.indice, datos } : null;
        }
        if (categoria === "meta") {
            return piso.meta ? { categoria: "meta", indice: 0, datos: piso.meta } : null;
        }
        return null;
    }

    function tipoSeleccionado() {
        return buscarTipoObjeto(estado.tipoCatalogo, estado.catalogo);
    }

    function esPlataformaFlotante(p) {
        if (!p) return false;
        return Boolean(
            p.flotante
            || p.tipo === TIPOS_PLATAFORMA.MOVIL
            || p.movil
            || Math.abs((p.y ?? ALTURA_PLATAFORMA_DEFAULT) - ALTURA_PLATAFORMA_DEFAULT) >= ALTO_TILE
        );
    }

    // Caja de colision del objeto segun el catalogo del editor (que puede no estar guardado)
    function cajaObjeto(o) {
        return cajaColisionObjeto(o, estado.catalogo);
    }

    function usosDeTipo(id) {
        return estado.pisos.reduce((total, piso) => total + piso.objetos.filter((o) => o.tipo === id).length, 0);
    }

    // Nombre de archivo valido: minusculas, sin tildes, espacios como _ y solo letras, numeros y _
    function normalizarId(texto) {
        return String(texto || "").trim()
            .replace(/^.*[\\/]/, "")
            .replace(/\.png$/i, "")
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[\s-]+/g, "_")
            .replace(/[^a-z0-9_]/g, "");
    }

    // caja_sotano_01 -> caja_sotano_02 (el primero libre)
    function idLibre(base) {
        const raiz = base.replace(/_\d+$/, "");
        for (let n = 1; ; n++) {
            const id = `${raiz}_${String(n).padStart(2, "0")}`;
            if (!buscarTipoObjeto(id, estado.catalogo)) return id;
        }
    }

    function limpiarSeleccion() {
        estado.seleccion = null;
        estado.seleccionObjeto = null;
        estado.seleccionTrampa = null;
        estado.seleccionElemento = null;
    }

    // ---------------------------------------------------------------- Modelo

    function ordenar(piso, mantener = null) {
        piso.plataformas.sort((a, b) => {
            const fa = esPlataformaFlotante(a) ? 1 : 0;
            const fb = esPlataformaFlotante(b) ? 1 : 0;
            if (fa !== fb) return fa - fb;
            return a.x - b.x || a.y - b.y;
        });
        if (mantener) estado.seleccion = piso.plataformas.indexOf(mantener);
    }

    function siguienteIndiceSuelo(plataformas, indice) {
        const actual = plataformas[indice];
        if (!actual || esPlataformaFlotante(actual)) return -1;
        for (let j = indice + 1; j < plataformas.length; j++) {
            if (!esPlataformaFlotante(plataformas[j])) return j;
        }
        return -1;
    }

    // El hueco solo se mide entre plataformas de suelo consecutivas (las flotantes no parten el piso)
    function huecoDespues(plataformas, indice) {
        const sigIdx = siguienteIndiceSuelo(plataformas, indice);
        if (sigIdx === -1) return 0;
        const siguiente = plataformas[sigIdx];
        return Math.max(0, siguiente.x - (plataformas[indice].x + plataformas[indice].ancho));
    }

    function anchoMundo(piso) {
        const maxPlat = piso.plataformas.reduce((maximo, p) => Math.max(maximo, p.x + p.ancho), ANCHO_MUNDO_MINIMO);
        const maxMeta = piso.meta ? piso.meta.x + (piso.meta.ancho || 88) + 80 : 0;
        return Math.max(maxPlat, maxMeta);
    }

    function importarTrampa(t) {
        const tipo = TIPOS_TRAMPAS_UI.some((d) => d.id === t.tipo) ? t.tipo : TIPOS_TRAMPA_ACTIVA.PINCHOS;
        const def = TIPOS_TRAMPAS_UI.find((d) => d.id === tipo) || TIPOS_TRAMPAS_UI[0];
        const obj = {
            tipo,
            x: Number(t.x) || 0,
            y: Number.isFinite(t.y) ? Number(t.y) : ALTURA_PLATAFORMA_DEFAULT - def.alto,
            ancho: Number(t.ancho) || def.ancho,
            alto: Number(t.alto) || def.alto,
            orientacion: t.orientacion || "horizontal",
            intervaloMs: Number(t.intervaloMs) || 2200,
            duracionMs: Number(t.duracionMs) || 1100,
            avisoMs: Number(t.avisoMs) || 450,
            rango: Number.isFinite(t.rango) ? Number(t.rango) : 110,
            velocidad: Number(t.velocidad) || 2.2,
            eje: t.eje === "y" ? "y" : "x"
        };
        if (t.canal) obj.canal = String(t.canal).trim();
        if (t.imagen) obj.imagen = String(t.imagen);
        return obj;
    }

    function importarPiso(crudo) {
        const piso = JSON.parse(JSON.stringify(crudo));
        const originales = [...(crudo.plataformas || [])].sort((a, b) => {
            const fa = (a.flotante || a.tipo === TIPOS_PLATAFORMA.MOVIL || a.movil || Math.abs((a.y ?? ALTURA_PLATAFORMA_DEFAULT) - ALTURA_PLATAFORMA_DEFAULT) >= ALTO_TILE) ? 1 : 0;
            const fb = (b.flotante || b.tipo === TIPOS_PLATAFORMA.MOVIL || b.movil || Math.abs((b.y ?? ALTURA_PLATAFORMA_DEFAULT) - ALTURA_PLATAFORMA_DEFAULT) >= ALTO_TILE) ? 1 : 0;
            if (fa !== fb) return fa - fb;
            return a.x - b.x || a.y - b.y;
        });

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
        piso.plataformas = originales.map((p) => {
            const y = Number.isFinite(p.y) ? p.y : ALTURA_PLATAFORMA_DEFAULT;
            const tipo = p.tipo || TIPOS_PLATAFORMA.NORMAL;
            const flotante = Boolean(p.flotante || tipo === TIPOS_PLATAFORMA.MOVIL || p.movil || Math.abs(y - ALTURA_PLATAFORMA_DEFAULT) >= ALTO_TILE);
            const plat = {
                x: Number(p.x) || 0,
                y,
                ancho: Number(p.ancho) || ANCHO_TILE,
                tipo,
                flotante
            };
            if (p.canal) plat.canal = String(p.canal).trim();
            if (p.ocultaInicial) plat.ocultaInicial = Boolean(p.ocultaInicial);
            if (tipo === TIPOS_PLATAFORMA.MOVIL || p.movil) {
                plat.movil = {
                    eje: p.movil?.eje === "y" ? "y" : "x",
                    rango: Number(p.movil?.rango) || 140,
                    velocidad: Number(p.movil?.velocidad) || 2.1
                };
            }
            if (tipo === TIPOS_PLATAFORMA.CINTA || Number.isFinite(p.velocidadCinta)) {
                plat.velocidadCinta = Number.isFinite(p.velocidadCinta) ? Number(p.velocidadCinta) : 2.6;
            }
            if (tipo === TIPOS_PLATAFORMA.REBOTE || Number.isFinite(p.fuerzaRebote)) {
                plat.fuerzaRebote = Number.isFinite(p.fuerzaRebote) ? Number(p.fuerzaRebote) : -19.5;
            }
            return plat;
        });
        piso.objetos = (crudo.objetos || []).map((o) => {
            const obj = {
                tipo: String(o.tipo || ""),
                x: Number(o.x) || 0,
                y: Number(o.y) || 0,
                ancho: Number(o.ancho) || TAMANO_OBJETO,
                alto: Number(o.alto) || TAMANO_OBJETO,
                modo: MODOS.some((modo) => modo.id === o.modo) ? o.modo : MODOS_OBJETO.FONDO
            };
            if (o.imagen) obj.imagen = String(o.imagen);
            return obj;
        });
        const trampasCrudas = crudo.trampas || crudo.trampasActivas || [];
        delete piso.trampasActivas;
        piso.trampas = trampasCrudas.map(importarTrampa);
        piso.interruptores = (crudo.interruptores || []).map((sw) => {
            const estilo = sw.estilo || sw.tipo || "boton_piso";
            const esBotonPiso = estilo === "boton_piso";
            const modoCrudo = sw.modo || "activar";
            const modo = modoCrudo === "permanente"
                ? "activar"
                : (modoCrudo === "temporal" || modoCrudo === "temporizado")
                    ? "tiempo"
                    : modoCrudo;
            const obj = {
                estilo,
                tipo: estilo,
                x: Number(sw.x) || 0,
                y: Number.isFinite(sw.y) ? Number(sw.y) : ALTURA_PLATAFORMA_DEFAULT - (esBotonPiso ? 22 : 56),
                ancho: Number(sw.ancho) || (esBotonPiso ? 52 : 44),
                alto: Number(sw.alto) || (esBotonPiso ? 22 : 56),
                canal: String(sw.canal || "A").trim(),
                modo,
                duracionMs: Number(sw.duracionMs) || 5000,
                etiqueta: sw.etiqueta || String(sw.canal || "BOTON").toUpperCase()
            };
            if (sw.imagen) obj.imagen = String(sw.imagen);
            return obj;
        });
        piso.checkpoints = (crudo.checkpoints || []).map((cp) => {
            const obj = {
                x: Number(cp.x) || 0,
                y: Number.isFinite(cp.y) ? Number(cp.y) : ALTURA_PLATAFORMA_DEFAULT - 110,
                ancho: Number(cp.ancho) || 48,
                alto: Number(cp.alto) || 110,
                nombre: cp.nombre || "Fichador"
            };
            if (cp.imagen) obj.imagen = String(cp.imagen);
            return obj;
        });
        piso.items = (crudo.items || []).map((it) => {
            const tipoRaw = it.tipo === TIPOS_ITEM.CAFE ? TIPOS_ITEM.VIDA : (it.tipo || TIPOS_ITEM.VIDA);
            const tipo = TIPOS_ITEMS_UI.some((d) => d.id === tipoRaw) ? tipoRaw : TIPOS_ITEM.VIDA;
            const obj = {
                tipo,
                x: Number(it.x) || 0,
                y: Number.isFinite(it.y) ? Number(it.y) : ALTURA_PLATAFORMA_DEFAULT - 64,
                ancho: Number(it.ancho) || 40,
                alto: Number(it.alto) || 40
            };
            if (it.imagen) obj.imagen = String(it.imagen);
            return obj;
        });
        piso.meta = crudo.meta ? {
            x: Number(crudo.meta.x) || 0,
            y: Number.isFinite(crudo.meta.y) ? Number(crudo.meta.y) : ALTURA_PLATAFORMA_DEFAULT - 144,
            ancho: Number(crudo.meta.ancho) || 92,
            alto: Number(crudo.meta.alto) || 144,
            requiereLlave: crudo.meta.requiereLlave !== undefined ? Boolean(crudo.meta.requiereLlave) : true,
            etiqueta: crudo.meta.etiqueta || "ASCENSOR",
            ...(crudo.meta.imagen ? { imagen: String(crudo.meta.imagen) } : {})
        } : null;

        if (!crudo._notas) {
            piso._notas = [];
            originales.forEach((p, i) => {
                if (esPlataformaFlotante(piso.plataformas[i])) return;
                const declarado = p.tieneHuecoDespues ? p.anchoHueco || 0 : 0;
                const real = huecoDespues(piso.plataformas, i);
                if (declarado === real) return;
                const sigIdx = siguienteIndiceSuelo(piso.plataformas, i);
                piso._notas.push({
                    plataforma: i,
                    mensaje: sigIdx === -1
                        ? `niveles.js declara un hueco de ${declarado}px después de la última plataforma. No tiene nada del otro lado, así que se descarta.`
                        : `niveles.js declara un hueco de ${declarado}px después de la plataforma ${i + 1}, pero el espacio real hasta la siguiente es de ${real}px. El editor usa el espacio real.`
                });
            });
        }

        return piso;
    }

    function importarTipo(crudo) {
        const margenes = crudo.margenes || {};
        const margen = (valor) => Math.max(0, Math.round(Number(valor)) || 0);
        return {
            id: String(crudo.id || ""),
            nombre: String(crudo.nombre || crudo.id || ""),
            ancho: Math.max(LADO_MINIMO_OBJETO, Number(crudo.ancho) || TAMANO_OBJETO),
            alto: Math.max(LADO_MINIMO_OBJETO, Number(crudo.alto) || TAMANO_OBJETO),
            modo: MODOS.some((modo) => modo.id === crudo.modo) ? crudo.modo : MODOS_OBJETO.SOLIDO,
            margenes: { izquierda: margen(margenes.izquierda), derecha: margen(margenes.derecha), arriba: margen(margenes.arriba) }
        };
    }

    function exportarPlataformas(piso) {
        return piso.plataformas.map((p, i) => {
            const flotante = esPlataformaFlotante(p);
            const hueco = flotante ? 0 : huecoDespues(piso.plataformas, i);
            const salida = {
                x: p.x,
                y: p.y,
                ancho: p.ancho,
                tipo: p.tipo,
                tieneHuecoDespues: hueco > 0,
                anchoHueco: hueco,
                flotante
            };
            if (p.canal) salida.canal = p.canal;
            if (p.ocultaInicial) salida.ocultaInicial = Boolean(p.ocultaInicial);
            if (p.tipo === TIPOS_PLATAFORMA.MOVIL || p.movil) {
                salida.movil = {
                    eje: p.movil?.eje || "x",
                    rango: Number(p.movil?.rango) || 140,
                    velocidad: Number(p.movil?.velocidad) || 2.1
                };
            }
            if (p.tipo === TIPOS_PLATAFORMA.CINTA || Number.isFinite(p.velocidadCinta)) {
                salida.velocidadCinta = Number.isFinite(p.velocidadCinta) ? p.velocidadCinta : 2.6;
            }
            if (p.tipo === TIPOS_PLATAFORMA.REBOTE || Number.isFinite(p.fuerzaRebote)) {
                salida.fuerzaRebote = Number.isFinite(p.fuerzaRebote) ? p.fuerzaRebote : 1.38;
            }
            return salida;
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
        const extrasCanal = [
            p.canal && `canal: ${JSON.stringify(p.canal)}`,
            p.ocultaInicial && `ocultaInicial: true`
        ].filter(Boolean);

        if (p.tipo === TIPOS_PLATAFORMA.MOVIL) {
            const m = p.movil || { eje: "x", rango: 140, velocidad: 2.1 };
            const optsMovil = [
                `eje: ${JSON.stringify(m.eje)}`,
                `rango: ${m.rango}`,
                `velocidad: ${m.velocidad}`
            ].join(", ");
            const optsExtra = extrasCanal.join(", ");
            return `plataformaMovil(${p.x}, ${p.y}, ${p.ancho}, { ${optsMovil} }${optsExtra ? `, { ${optsExtra} }` : ""})`;
        }
        if (p.tipo === TIPOS_PLATAFORMA.CINTA) {
            const vel = Number.isFinite(p.velocidadCinta) ? p.velocidadCinta : 2.6;
            const optsCinta = [
                p.y !== ALTURA_PLATAFORMA_DEFAULT && `y: ${p.y}`,
                p.tieneHuecoDespues && `tieneHuecoDespues: true, anchoHueco: ${p.anchoHueco}`,
                p.flotante && `flotante: true`,
                ...extrasCanal
            ].filter(Boolean).join(", ");
            return `cintaTransportadora(${p.x}, ${p.ancho}, ${vel}${optsCinta ? `, { ${optsCinta} }` : ""})`;
        }
        if (p.tipo === TIPOS_PLATAFORMA.REBOTE) {
            const fuerza = Number.isFinite(p.fuerzaRebote) && p.fuerzaRebote > 0 ? p.fuerzaRebote : 1.38;
            const optsRebote = [
                p.tieneHuecoDespues && `tieneHuecoDespues: true, anchoHueco: ${p.anchoHueco}`,
                p.flotante && `flotante: true`,
                ...extrasCanal
            ].filter(Boolean).join(", ");
            return `plataformaRebote(${p.x}, ${p.y}, ${p.ancho}, ${fuerza}${optsRebote ? `, { ${optsRebote} }` : ""})`;
        }
        if (p.flotante && p.tipo === TIPOS_PLATAFORMA.NORMAL) {
            const optsFlot = extrasCanal.join(", ");
            return `plataformaFlotante(${p.x}, ${p.y}, ${p.ancho}${optsFlot ? `, TIPOS_PLATAFORMA.NORMAL, { ${optsFlot} }` : ""})`;
        }

        const tipo = TIPOS.find((t) => t.id === p.tipo);
        const extrasOpciones = [
            p.y !== ALTURA_PLATAFORMA_DEFAULT && `y: ${p.y}`,
            p.flotante && `flotante: true`,
            ...extrasCanal
        ].filter(Boolean).join(", ");
        const opciones = extrasOpciones ? `, { ${extrasOpciones} }` : "";

        if (!tipo) {
            const todas = [
                extrasOpciones,
                p.tieneHuecoDespues && `tieneHuecoDespues: true, anchoHueco: ${p.anchoHueco}`
            ].filter(Boolean).join(", ");
            return `crearPlataforma(${p.x}, ${p.ancho}, ${JSON.stringify(p.tipo)}${todas ? `, { ${todas} }` : ""})`;
        }

        return p.tieneHuecoDespues
            ? `${tipo.conHueco}(${p.x}, ${p.ancho}, ${p.anchoHueco}${opciones})`
            : `${tipo.sinHueco}(${p.x}, ${p.ancho}${opciones})`;
    }

    function codigoTrampa(t) {
        const opts = [
            t.orientacion && t.orientacion !== "horizontal" && `orientacion: ${JSON.stringify(t.orientacion)}`,
            t.intervaloMs && t.intervaloMs !== 2200 && `intervaloMs: ${t.intervaloMs}`,
            t.duracionMs && t.duracionMs !== 1100 && `duracionMs: ${t.duracionMs}`,
            t.avisoMs && t.avisoMs !== 450 && `avisoMs: ${t.avisoMs}`,
            t.tipo === TIPOS_TRAMPA_ACTIVA.SIERRA && `eje: ${JSON.stringify(t.eje || "x")}, rango: ${t.rango ?? 110}, velocidad: ${t.velocidad || 2.2}`,
            t.canal && `canal: ${JSON.stringify(t.canal)}`,
            t.imagen && `imagen: ${JSON.stringify(t.imagen)}`
        ].filter(Boolean).join(", ");
        return `            trampa(${refEnum("TIPOS_TRAMPA_ACTIVA", TIPOS_TRAMPA_ACTIVA, t.tipo)}, ${t.x}, ${t.y}, ${t.ancho}, ${t.alto}${opts ? `, { ${opts} }` : ""})`;
    }

    function codigoInterruptor(sw) {
        const estilo = sw.estilo || sw.tipo || "boton_piso";
        const modo = sw.modo || "activar";
        const opts = [
            estilo !== "boton_piso" && `estilo: ${refEnum("TIPOS_INTERRUPTOR", TIPOS_INTERRUPTOR, estilo)}`,
            sw.ancho && sw.ancho !== (estilo === "boton_piso" ? 52 : 44) && `ancho: ${sw.ancho}`,
            sw.alto && sw.alto !== (estilo === "boton_piso" ? 22 : 56) && `alto: ${sw.alto}`,
            modo !== "activar" && `modo: ${refEnum("MODOS_INTERRUPTOR", MODOS_INTERRUPTOR, modo)}`,
            modo === "tiempo" && sw.duracionMs && `duracionMs: ${sw.duracionMs}`,
            sw.etiqueta && sw.etiqueta !== String(sw.canal || "").toUpperCase() && `etiqueta: ${JSON.stringify(sw.etiqueta)}`,
            sw.imagen && `imagen: ${JSON.stringify(sw.imagen)}`
        ].filter(Boolean).join(", ");
        return `            interruptor(${sw.x}, ${sw.y}, ${JSON.stringify(sw.canal || "A")}${opts ? `, { ${opts} }` : ""})`;
    }

    function codigoCheckpoint(cp) {
        const opts = [
            cp.ancho && cp.ancho !== 44 && `ancho: ${cp.ancho}`,
            cp.alto && cp.alto !== 96 && `alto: ${cp.alto}`,
            cp.nombre && cp.nombre !== "Fichador" && cp.nombre !== "Reloj Fichador" && `nombre: ${JSON.stringify(cp.nombre)}`,
            cp.imagen && `imagen: ${JSON.stringify(cp.imagen)}`
        ].filter(Boolean).join(", ");
        return `            checkpoint(${cp.x}, ${cp.y}${opts ? `, { ${opts} }` : ""})`;
    }

    function codigoItem(it) {
        const opts = [
            it.ancho && it.ancho !== 40 && `ancho: ${it.ancho}`,
            it.alto && it.alto !== 40 && `alto: ${it.alto}`,
            it.imagen && `imagen: ${JSON.stringify(it.imagen)}`
        ].filter(Boolean).join(", ");
        return `            item(${refEnum("TIPOS_ITEM", TIPOS_ITEM, it.tipo)}, ${it.x}, ${it.y}${opts ? `, { ${opts} }` : ""})`;
    }

    function codigoMeta(m) {
        if (!m) return "";
        const opts = [
            m.ancho && m.ancho !== 92 && `ancho: ${m.ancho}`,
            m.alto && m.alto !== 144 && `alto: ${m.alto}`,
            m.requiereLlave === false && `requiereLlave: false`,
            m.etiqueta && m.etiqueta !== "ASCENSOR" && `etiqueta: ${JSON.stringify(m.etiqueta)}`,
            m.imagen && `imagen: ${JSON.stringify(m.imagen)}`
        ].filter(Boolean).join(", ");
        return `meta: metaPiso(${m.x}, ${m.y}${opts ? `, { ${opts} }` : ""})`;
    }

    function codigoObjeto(o) {
        const extra = o.imagen ? `, { imagen: ${JSON.stringify(o.imagen)} }` : "";
        return `            objeto(${JSON.stringify(o.tipo)}, ${o.x}, ${o.y}, ${o.ancho}, ${o.alto}, ${refEnum("MODOS_OBJETO", MODOS_OBJETO, o.modo)}${extra})`;
    }

    function codigoPiso(piso) {
        const extras = Object.keys(piso)
            .filter((clave) => !CLAVES_PISO.includes(clave) && !clave.startsWith("_"))
            .map((clave) => `${clave}: ${JSON.stringify(piso[clave])}`);
        const plataformas = exportarPlataformas(piso).map((p) => `            ${codigoPlataforma(p)}`);
        const objetos = (piso.objetos || []).map(codigoObjeto);
        const trampas = (piso.trampas || []).map(codigoTrampa);
        const interruptores = (piso.interruptores || []).map(codigoInterruptor);
        const checkpoints = (piso.checkpoints || []).map(codigoCheckpoint);
        const items = (piso.items || []).map(codigoItem);
        const metaLinea = piso.meta ? codigoMeta(piso.meta) : "";

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
            trampas.length && `trampas: [\n${trampas.join(",\n")}\n        ]`,
            interruptores.length && `interruptores: [\n${interruptores.join(",\n")}\n        ]`,
            checkpoints.length && `checkpoints: [\n${checkpoints.join(",\n")}\n        ]`,
            items.length && `items: [\n${items.join(",\n")}\n        ]`,
            metaLinea,
            plataformas.length ? `plataformas: [\n${plataformas.join(",\n")}\n        ]` : "plataformas: []"
        ].filter(Boolean);
        return `    {\n${lineas.map((linea) => `        ${linea}`).join(",\n")}\n    }`;
    }

    function codigoTipo(t) {
        const m = t.margenes;
        const margenes = [
            m.izquierda && `izquierda: ${m.izquierda}`,
            m.derecha && `derecha: ${m.derecha}`,
            m.arriba && `arriba: ${m.arriba}`
        ].filter(Boolean).join(", ");
        return `    tipoObjeto(${JSON.stringify(t.id)}, ${JSON.stringify(t.nombre)}, ${t.ancho}, ${t.alto}, ${refEnum("MODOS_OBJETO", MODOS_OBJETO, t.modo)}${margenes ? `, { margenes: { ${margenes} } }` : ""})`;
    }

    function generarArchivoNiveles() {
        const catalogo = estado.catalogo.map(codigoTipo);
        return [
            "// Datos de los pisos. admin.html reescribe este archivo al guardar.",
            "// Las constantes y funciones que usa (TIPOS_PISO, TRAMPAS, PROPS, piso, pisoConHueco, objeto, tipoObjeto, ...)",
            "// estan en niveles_base.js.",
            "",
            "// Catalogo de objetos: cada tipo es una imagen de assets/props con su tamano, modo y caja de colision.",
            catalogo.length ? `const CATALOGO_OBJETOS = [\n${catalogo.join(",\n")}\n];` : "const CATALOGO_OBJETOS = [];",
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

    function alcanceSaltoConDash(personaje, desnivel) {
        const base = alcanceSalto(personaje, desnivel);
        if (!base) return 0;
        const velDash = personaje.velocidadDash || 13.5;
        const framesDash = Math.round((personaje.duracionDashMs || 175) / 16.67);
        return Math.floor(base + velDash * framesDash);
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
        const centro = o.x + (o.ancho || 32) / 2;
        const debajo = piso.plataformas
            .filter((p) => centro >= p.x && centro <= p.x + p.ancho && p.y >= o.y)
            .sort((a, b) => a.y - b.y)[0];
        return debajo ? debajo.y : null;
    }

    function validarObjetos(piso, agregar) {
        const personajes = Object.values(personajesDisponibles);
        const altoMinimo = Math.min(...personajes.map((personaje) => personaje.colision?.alto || 172));

        piso.objetos.forEach((o, i) => {
            const rutaObj = obtenerRutaObjeto(o.tipo, o.imagen);
            const nombre = `El objeto ${i + 1} (${o.imagen || o.tipo || "sin imagen"})`;
            if (!rutaObj) {
                agregar("aviso", `${nombre} no tiene imagen asignada.`, { objeto: i });
            } else if (activo(rutaObj).estado === "falta") {
                agregar("info", `No existe ${rutaObj}. El juego dibuja una caja de color en su lugar.`, { objeto: i });
            }
            if (!o.imagen && o.tipo && estado.catalogo.length && !buscarTipoObjeto(o.tipo, estado.catalogo)) {
                agregar("info", `${nombre} no está en el catálogo. Funciona igual, pero sin márgenes de colisión ni tamaño de referencia.`, { objeto: i });
            }
            if (o.modo === MODOS_OBJETO.FONDO) return;

            const suelo = pisoBajo(piso, o);
            if (suelo === null) return;
            const desnivel = suelo - cajaObjeto(o).y;
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
        const sigIdx = siguienteIndiceSuelo(piso.plataformas, indice);
        const destino = sigIdx !== -1 ? piso.plataformas[sigIdx] : origen;
        const ancho = huecoDespues(piso.plataformas, indice);
        const alcances = Object.entries(personajesDisponibles).map(([clave, personaje]) => ({
            clave,
            nombre: personaje.nombre,
            alcance: alcanceSalto(personaje, destino.y - origen.y),
            alcanceDash: alcanceSaltoConDash(personaje, destino.y - origen.y)
        }));
        const minimo = Math.min(...alcances.map((a) => a.alcance));
        const maximo = Math.max(...alcances.map((a) => a.alcance));
        const maximoDash = Math.max(...alcances.map((a) => a.alcanceDash));

        let resultado = "ok";
        if (ancho > maximoDash) resultado = "imposible";
        else if (ancho > maximo) resultado = "justo";
        else if (ancho > minimo) resultado = "parcial";
        else if (ancho > minimo * 0.9) resultado = "justo";

        return { ancho, alcances, minimo, maximo, maximoDash, resultado };
    }

    function desplazarDesde(piso, indice, delta) {
        piso.plataformas.slice(indice).forEach((p) => {
            if (!esPlataformaFlotante(p)) {
                p.x = Math.max(0, p.x + delta);
            }
        });
    }

    function alturaEn(punto) {
        const debajo = (pisoActivo()?.plataformas || [])
            .filter((p) => !esPlataformaFlotante(p) && punto.x >= p.x && punto.x <= p.x + p.ancho)
            .sort((a, b) => Math.abs(a.y - punto.y) - Math.abs(b.y - punto.y))[0];
        return debajo ? debajo.y : ALTURA_PLATAFORMA_DEFAULT;
    }

    // Une la plataforma con sus vecinas pegadas del mismo tipo. Los pivotes y plataformas especiales no se fusionan.
    function fusionar(piso, plataforma) {
        if (
            esPlataformaFlotante(plataforma)
            || plataforma.tipo === TIPOS_PLATAFORMA.PIVOTE
            || plataforma.tipo === TIPOS_PLATAFORMA.QUEBRADIZO
            || plataforma.tipo === TIPOS_PLATAFORMA.MOVIL
            || plataforma.tipo === TIPOS_PLATAFORMA.REBOTE
        ) return;
        piso.plataformas = piso.plataformas.filter((otra) => {
            if (otra === plataforma || esPlataformaFlotante(otra) || otra.tipo !== plataforma.tipo || otra.y !== plataforma.y) return true;
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

    // Las herramientas pintan sobre el suelo: lo que habia en el tramo se recorta y se reemplaza (o queda vacio si es un hueco)
    function pintarTramo(piso, desde, hasta, y, herramienta) {
        const resultado = [];
        piso.plataformas.forEach((p) => {
            const fin = p.x + p.ancho;
            if (esPlataformaFlotante(p) || Math.abs(p.y - y) >= ALTO_TILE || fin <= desde || p.x >= hasta) {
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
            [TIPOS_PLATAFORMA.RESBALADIZO]: TRAMPAS.RESBALADIZO,
            [TIPOS_PLATAFORMA.QUEBRADIZO]: TRAMPAS.QUEBRADIZO
        }[herramienta];

        let nueva = null;
        if (herramienta !== HERRAMIENTA_HUECO) {
            nueva = { x: desde, y, ancho: hasta - desde, tipo: herramienta, flotante: false };
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
            if (!esPlataformaFlotante(p) && p.ancho < ANCHO_TILE) {
                agregar("aviso", `La plataforma ${i + 1} mide ${p.ancho}px, menos que un tile (${ANCHO_TILE}px): el arte se va a ver comprimido.`, { plataforma: i });
            }
            if (p.y < 140 || p.y > ALTO_MUNDO - ALTO_TILE) {
                agregar("aviso", `La plataforma ${i + 1} está en y=${p.y}: el jugador o el piso quedan fuera de la pantalla (${ALTO_MUNDO}px de alto).`, { plataforma: i });
            }

            if (!esPlataformaFlotante(p)) {
                for (let j = i + 1; j < plataformas.length && plataformas[j].x < fin; j++) {
                    if (esPlataformaFlotante(plataformas[j]) || Math.abs(plataformas[j].y - p.y) >= ALTO_TILE) continue;
                    const solape = fin - plataformas[j].x;
                    agregar("error", `Las plataformas ${i + 1} y ${j + 1} se superponen ${solape}px.`, {
                        plataforma: j,
                        arreglo: { etiqueta: "Separar", accion: () => desplazarDesde(piso, j, solape) }
                    });
                }
            }

            if (esPlataformaFlotante(p) || huecoDespues(plataformas, i) === 0) return;
            const hueco = analizarHueco(piso, i);
            const detalle = hueco.alcances.map((a) => `${a.nombre} ${a.alcance}px (Dash: ${a.alcanceDash}px)`).join(", ");
            const seguro = Math.floor((hueco.minimo * 0.85) / 16) * 16;
            const sigIdx = siguienteIndiceSuelo(plataformas, i);
            const arreglo = sigIdx !== -1 ? {
                etiqueta: `Reducir a ${seguro}px`,
                accion: () => desplazarDesde(piso, sigIdx, seguro - hueco.ancho)
            } : null;

            if (hueco.resultado === "imposible") {
                agregar("error", `Hueco de ${hueco.ancho}px después de la plataforma ${i + 1}: requiere Poder de Doble Salto o plataforma aérea (${detalle}).`, { plataforma: i, arreglo });
            } else if (hueco.resultado === "parcial") {
                const llegan = hueco.alcances.filter((a) => a.alcance >= hueco.ancho).map((a) => a.nombre).join(", ");
                agregar("aviso", `Hueco de ${hueco.ancho}px después de la plataforma ${i + 1}: sin Dash solo llega ${llegan || "con Dash"} (${detalle}).`, { plataforma: i, arreglo });
            } else if (hueco.resultado === "justo") {
                agregar("info", `Hueco de ${hueco.ancho}px después de la plataforma ${i + 1}: requiere Salto + Dash aéreo o Doble Salto (${detalle}).`, { plataforma: i });
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
        if (usa(TIPOS_PLATAFORMA.QUEBRADIZO) && !tiene(TRAMPAS.QUEBRADIZO)) {
            agregar("info", "Hay piso quebradizo pero la trampa QUEBRADIZO no está en la lista.", { arreglo: habilitar(TRAMPAS.QUEBRADIZO) });
        }
        if (hayHuecos && !tiene(TRAMPAS.HUECO_ROTO)) {
            agregar("info", "Hay huecos pero la trampa HUECO_ROTO no está en la lista.", { arreglo: habilitar(TRAMPAS.HUECO_ROTO) });
        }
        if (plataformas.length && anchoMundo(piso) < ANCHO_PANTALLA) {
            agregar("info", `El piso mide ${anchoMundo(piso)}px, menos que la pantalla (${ANCHO_PANTALLA}px).`);
        }

        if (piso.meta?.requiereLlave && !(piso.items || []).some((it) => it.tipo === TIPOS_ITEM.TARJETA) && (piso.items || []).length > 0) {
            agregar("aviso", "El Ascensor Meta requiere Tarjeta de Acceso, pero pusiste items y ninguna Tarjeta en el piso.");
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
        return JSON.stringify({
            pisos: estado.pisos,
            catalogo: estado.catalogo,
            indice: estado.indice,
            seleccion: estado.seleccion,
            seleccionObjeto: estado.seleccionObjeto,
            seleccionTrampa: estado.seleccionTrampa,
            seleccionElemento: estado.seleccionElemento,
            tipoCatalogo: estado.tipoCatalogo
        });
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
        estado.seleccionTrampa = datos.seleccionTrampa ?? null;
        estado.seleccionElemento = datos.seleccionElemento ?? null;
        estado.catalogo = datos.catalogo || estado.catalogo;
        estado.tipoCatalogo = datos.tipoCatalogo ?? null;
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

    function editarCatalogo(accion) {
        registrar();
        accion(tipoSeleccionado());
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
        if (!piso || !(piso.trampas || [])[estado.seleccionTrampa]) estado.seleccionTrampa = null;
        if (!elementoSeleccionado()) estado.seleccionElemento = null;
        if (!tipoSeleccionado()) estado.tipoCatalogo = null;
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
                    localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ fecha: Date.now(), pisos: estado.pisos, catalogo: estado.catalogo }));
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

        const actuales = { pisos: estado.pisos, catalogo: estado.catalogo };
        estado.pisos = borrador.pisos;
        estado.catalogo = borrador.catalogo || estado.catalogo;
        const distinto = generarArchivoNiveles() !== contenidoBase;
        Object.assign(estado, actuales);
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
            estado.pisos.forEach((piso) => {
                piso.objetos = piso.objetos || [];
                piso.trampas = (piso.trampas || piso.trampasActivas || []).map(importarTrampa);
                delete piso.trampasActivas;
                piso.checkpoints = piso.checkpoints || [];
                piso.items = piso.items || [];
                piso.meta = piso.meta || null;
            });
            estado.catalogo = (borrador.catalogo || estado.catalogo).map(importarTipo);
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
        if (campo && campo !== campoEditando) campo.value = valor ?? "";
    }

    function ponerOpciones(id, valores) {
        const lista = $(id);
        if (!lista || lista.dataset.valores === valores.join("|")) return;
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

        // 1. Plataforma seleccionada
        const plataforma = plataformaSeleccionada();
        $("panelPlataforma").hidden = !plataforma;
        $("vacioPlataforma").hidden = Boolean(plataforma);
        $("tituloPlataforma").textContent = plataforma ? `${estado.seleccion + 1} de ${piso.plataformas.length}` : "";
        if (plataforma) {
            const flotante = esPlataformaFlotante(plataforma);
            const sigIdx = siguienteIndiceSuelo(piso.plataformas, estado.seleccion);
            const sinHueco = flotante || sigIdx === -1;
            poner("platX", plataforma.x);
            poner("platAncho", plataforma.ancho);
            poner("platY", plataforma.y);
            poner("platHueco", huecoDespues(piso.plataformas, estado.seleccion));
            $("platFlotante").checked = flotante;
            $("grupoHueco").hidden = sinHueco;
            $("ayudaHueco").hidden = sinHueco;
            if (!sinHueco) {
                const hueco = analizarHueco(piso, estado.seleccion);
                $("ayudaHueco").textContent = `Alcance de salto: ${hueco.alcances.map((a) => `${a.nombre} ${a.alcance}px (Dash: ${a.alcanceDash}px)`).join(" · ")}. Cambiar el hueco mueve las plataformas de suelo que siguen.`;
            }
            $("segTipo").querySelectorAll("button").forEach((boton) => {
                boton.classList.toggle("activo", boton.dataset.tipo === plataforma.tipo);
            });
            $("grupoPlatMovil").hidden = plataforma.tipo !== TIPOS_PLATAFORMA.MOVIL;
            $("grupoPlatCinta").hidden = plataforma.tipo !== TIPOS_PLATAFORMA.CINTA;
            $("grupoPlatRebote").hidden = plataforma.tipo !== TIPOS_PLATAFORMA.REBOTE;
            const movil = plataforma.movil || { eje: "x", rango: 140, velocidad: 2.1 };
            poner("platMovilEje", movil.eje || "x");
            poner("platMovilRango", movil.rango ?? 140);
            poner("platMovilVel", movil.velocidad ?? 2.1);
            poner("platVelocidadCinta", plataforma.velocidadCinta ?? 2.6);
            poner("platFuerzaRebote", plataforma.fuerzaRebote ?? -19.5);
            poner("platCanal", plataforma.canal || "");
            if ($("platOcultaInicial")) $("platOcultaInicial").checked = Boolean(plataforma.ocultaInicial);
        }

        // 2. Objeto decorativo / solido seleccionado
        const objeto = objetoSeleccionado();
        $("panelObjeto").hidden = !objeto;
        $("vacioObjeto").hidden = Boolean(objeto);
        $("tituloObjeto").textContent = objeto ? `${estado.seleccionObjeto + 1} de ${piso.objetos.length}` : "";
        if (objeto) {
            const rutaObj = obtenerRutaObjeto(objeto.tipo, objeto.imagen);
            const imagen = rutaObj ? activo(rutaObj) : { estado: "falta" };
            poner("objTipo", objeto.tipo);
            poner("objImagen", objeto.imagen || "");
            poner("objX", objeto.x);
            poner("objY", objeto.y);
            poner("objAncho", objeto.ancho);
            poner("objAlto", objeto.alto);
            $("estadoObjeto").textContent = { ok: "✓ existe", falta: "✕ no existe", cargando: "" }[imagen.estado];
            $("estadoObjeto").className = `estado-activo ${imagen.estado}`;
            $("ayudaObjeto").textContent = rutaObj
                ? `${rutaObj}${imagen.estado === "ok" ? ` · ${imagen.img.naturalWidth}×${imagen.img.naturalHeight}px` : ""}`
                : "Escribe el nombre del archivo de assets/props o carga una ruta de imagen personalizada.";
            $("btnTamanoOriginal").disabled = imagen.estado !== "ok";
            $("ayudaModo").textContent = MODOS.find((modo) => modo.id === objeto.modo)?.ayuda || "";
            $("segModo").querySelectorAll("button").forEach((boton) => {
                boton.classList.toggle("activo", boton.dataset.modo === objeto.modo);
            });
            pintarCatalogoDeObjeto(piso, objeto);
        }

        // 3. Trampa activa seleccionada
        const trampa = trampaSeleccionada();
        $("panelTrampa").hidden = !trampa;
        $("vacioTrampa").hidden = Boolean(trampa);
        $("tituloTrampa").textContent = trampa ? `${estado.seleccionTrampa + 1} de ${(piso.trampas || []).length}` : "";
        if (trampa) {
            poner("trampaTipo", trampa.tipo);
            poner("trampaImagen", trampa.imagen || "");
            poner("trampaX", trampa.x);
            poner("trampaY", trampa.y);
            poner("trampaAncho", trampa.ancho);
            poner("trampaAlto", trampa.alto);
            poner("trampaOrientacion", trampa.orientacion || "horizontal");
            poner("trampaIntervalo", trampa.intervaloMs ?? 2200);
            poner("trampaDuracion", trampa.duracionMs ?? 1100);
            poner("trampaAviso", trampa.avisoMs ?? 450);
            poner("trampaEje", trampa.eje || "x");
            poner("trampaRango", trampa.rango ?? 110);
            poner("trampaVelocidad", trampa.velocidad ?? 2.2);
            poner("trampaCanal", trampa.canal || "");
            const usaCiclo = [TIPOS_TRAMPA_ACTIVA.VAPOR, TIPOS_TRAMPA_ACTIVA.LASER, TIPOS_TRAMPA_ACTIVA.APLASTADOR].includes(trampa.tipo);
            $("grupoTrampaTiempos").hidden = !usaCiclo;
            $("grupoTrampaMovimiento").hidden = trampa.tipo !== TIPOS_TRAMPA_ACTIVA.SIERRA;
        }

        // 4. Elemento de nivel (Item / Checkpoint / Interruptor / Meta)
        const elem = elementoSeleccionado();
        $("panelElemento").hidden = !elem;
        $("vacioElemento").hidden = Boolean(elem);
        $("tituloElemento").textContent = elem
            ? { checkpoint: "Checkpoint", item: "Vida / Poder / Item", interruptor: "Botón / Interruptor", meta: "Ascensor Meta" }[elem.categoria]
            : "";
        if (elem) {
            poner("elemCategoria", elem.categoria);
            poner("elemImagen", elem.datos.imagen || "");
            poner("elemX", elem.datos.x);
            poner("elemY", elem.datos.y);
            poner("elemAncho", elem.datos.ancho || (elem.categoria === "checkpoint" ? 48 : elem.categoria === "meta" ? 92 : elem.categoria === "interruptor" ? 56 : 40));
            poner("elemAlto", elem.datos.alto || (elem.categoria === "checkpoint" ? 110 : elem.categoria === "meta" ? 144 : elem.categoria === "interruptor" ? 20 : 40));
            $("grupoElemSubtipo").hidden = elem.categoria !== "item" && elem.categoria !== "interruptor";
            $("grupoElemEtiqueta").hidden = elem.categoria === "item";
            $("grupoElemLlave").hidden = elem.categoria !== "meta";
            if ($("grupoElemInterruptor")) $("grupoElemInterruptor").hidden = elem.categoria !== "interruptor";
            if (elem.categoria === "item") {
                $("elemSubtipo")?.replaceChildren(...TIPOS_ITEMS_UI.map((it) =>
                    h("option", { value: it.id }, it.nombre)
                ));
                poner("elemSubtipo", elem.datos.tipo || TIPOS_ITEM.VIDA);
            } else if (elem.categoria === "interruptor") {
                $("elemSubtipo")?.replaceChildren(...TIPOS_INTERRUPTORES_UI.map((sw) =>
                    h("option", { value: sw.id }, sw.nombre)
                ));
                poner("elemSubtipo", elem.datos.estilo || elem.datos.tipo || TIPOS_INTERRUPTOR.BOTON_PISO);
                poner("elemEtiqueta", elem.datos.etiqueta || "CANAL A");
            } else {
                poner("elemEtiqueta", elem.datos.etiqueta || (elem.categoria === "meta" ? "ASCENSOR" : "CP"));
            }
            if (elem.categoria === "interruptor") {
                poner("elemCanal", elem.datos.canal || "A");
                poner("elemModoInterruptor", elem.datos.modo || "activar");
                poner("elemDuracionInterruptor", elem.datos.duracionMs ?? 5000);
            }
            if (elem.categoria === "meta") {
                $("elemRequiereLlave").checked = elem.datos.requiereLlave !== false;
            }
        }

        pintarCatalogo();
        ponerOpciones("listaObjetos", [...new Set([
            ...estado.catalogo.map((t) => t.id),
            ...Object.values(PROPS),
            ...estado.pisos.flatMap((p) => (p.objetos || []).map((o) => o.tipo))
        ].filter(Boolean))].sort());

        document.querySelectorAll(".herramienta").forEach((boton) => {
            boton.classList.toggle("activa", boton.dataset.herramienta === estado.herramienta);
        });
        $("pistaHerramienta").textContent = estado.herramienta === HERRAMIENTA_OBJETO
            ? `${PISTAS.objeto} Colocando: ${estado.ultimoObjeto}${buscarTipoObjeto(estado.ultimoObjeto, estado.catalogo) ? " (del catálogo)" : ""}.`
            : estado.herramienta === HERRAMIENTA_TRAMPA
            ? `${PISTAS.trampa} Tipo activo: ${TIPOS_TRAMPAS_UI.find((t) => t.id === estado.ultimaTrampa)?.nombre || estado.ultimaTrampa}.`
            : estado.herramienta === HERRAMIENTA_ELEMENTO
            ? `${PISTAS.elemento} Colocando: ${estado.ultimaCategoriaElemento === "item" ? (TIPOS_ITEMS_UI.find((i) => i.id === estado.ultimoSubtipoItem)?.nombre || estado.ultimoSubtipoItem) : estado.ultimaCategoriaElemento}.`
            : PISTAS[estado.herramienta] || "";

        const nTrampas = (piso.trampas || []).length;
        const nElem = (piso.checkpoints || []).length + (piso.items || []).length + (piso.interruptores || []).length + (piso.meta ? 1 : 0);
        $("datoMundo").textContent = `${piso.plataformas.length} plat · ${piso.objetos.length} obj · ${nTrampas} trampas · ${nElem} elem · ${anchoMundo(piso)}px (${(anchoMundo(piso) / ANCHO_PANTALLA).toFixed(1)} pant)`;
    }

    // Debajo del objeto: si es del catalogo y a que altura queda para cada personaje
    function pintarCatalogoDeObjeto(piso, o) {
        const tipo = buscarTipoObjeto(o.tipo, estado.catalogo);
        const igual = tipo && tipo.ancho === o.ancho && tipo.alto === o.alto && tipo.modo === o.modo;
        if (tipo) {
            $("catalogoObjeto").replaceChildren(
                `Catálogo: ${tipo.nombre} · ${tipo.ancho}×${tipo.alto} · ${MODOS.find((m) => m.id === tipo.modo)?.nombre}. `,
                igual
                    ? h("button", { class: "btn btn-mini", onclick: () => elegirTipo(tipo.id, false) }, "Editar tipo")
                    : h("button", { class: "btn btn-mini", onclick: restablecerObjeto, title: "Volver al tamaño y modo del catálogo" }, "Restablecer")
            );
        } else {
            $("catalogoObjeto").replaceChildren(
                o.tipo ? "No está en el catálogo. " : "",
                o.tipo && h("button", { class: "btn btn-mini", onclick: tipoDesdeObjeto }, "Agregar al catálogo")
            );
        }

        const suelo = o.modo === MODOS_OBJETO.FONDO ? null : pisoBajo(piso, o);
        if (suelo === null) {
            $("alcanceObjeto").textContent = "";
            return;
        }
        const desnivel = suelo - cajaObjeto(o).y;
        const alcances = Object.values(personajesDisponibles)
            .map((personaje) => `${personaje.nombre} ${alturaSalto(personaje) >= desnivel ? "✓" : "✕"}`);
        $("alcanceObjeto").textContent = `Se pisa a ${desnivel}px sobre el piso · se sube de un salto: ${alcances.join(" · ")}`;
    }

    function miniaturaTipo(tipo) {
        const modo = MODOS.find((m) => m.id === tipo.modo) || MODOS[0];
        const imagen = activo(obtenerRutaObjeto(tipo.id));
        const escala = Math.min(1, 44 / tipo.alto, 64 / tipo.ancho);
        return h("span", { class: "tipo-miniatura" },
            imagen.estado === "ok"
                ? h("img", { src: imagen.img.src, alt: "" })
                : h("span", { class: "tipo-caja", style: `color:${modo.color};width:${Math.round(tipo.ancho * escala)}px;height:${Math.round(tipo.alto * escala)}px` }),
            h("i", { class: `punto modo-${tipo.modo}`, title: modo.nombre })
        );
    }

    function pintarCatalogo() {
        const lista = $("listaCatalogo");
        const firmaLista = JSON.stringify([estado.catalogo, estado.tipoCatalogo, estado.catalogo.map((t) => [activo(obtenerRutaObjeto(t.id)).estado, usosDeTipo(t.id)])]);
        if (lista.dataset.firma !== firmaLista) {
            lista.dataset.firma = firmaLista;
            lista.replaceChildren(...estado.catalogo.map((tipo) => {
                const falta = activo(obtenerRutaObjeto(tipo.id)).estado === "falta";
                const usos = usosDeTipo(tipo.id);
                return h("button", {
                    class: `tipo-item ${tipo.id === estado.tipoCatalogo ? "activo" : ""}`,
                    title: `${tipo.id}.png · ${usos} ${usos === 1 ? "colocado" : "colocados"}${falta ? " · falta la imagen" : ""}`,
                    onclick: () => elegirTipo(tipo.id)
                },
                    miniaturaTipo(tipo),
                    h("span", { class: "tipo-titulo" }, tipo.nombre),
                    h("span", { class: `tipo-dato ${falta ? "falta" : ""}` }, `${tipo.ancho}×${tipo.alto}${usos ? ` ·${usos}` : ""}`)
                );
            }));
        }
        $("totalCatalogo").textContent = estado.catalogo.length || "";

        const tipo = tipoSeleccionado();
        $("panelTipo").hidden = !tipo;
        if (!tipo) return;
        const imagen = activo(obtenerRutaObjeto(tipo.id));
        poner("tipoId", tipo.id);
        poner("tipoNombre", tipo.nombre);
        poner("tipoAncho", tipo.ancho);
        poner("tipoAlto", tipo.alto);
        poner("tipoMargenIzq", tipo.margenes.izquierda);
        poner("tipoMargenDer", tipo.margenes.derecha);
        poner("tipoMargenArriba", tipo.margenes.arriba);
        $("estadoTipo").textContent = { ok: "✓ existe", falta: "✕ no existe", cargando: "" }[imagen.estado];
        $("estadoTipo").className = `estado-activo ${imagen.estado}`;
        $("ayudaTipo").textContent = `${obtenerRutaObjeto(tipo.id)}${imagen.estado === "ok" ? ` · ${imagen.img.naturalWidth}×${imagen.img.naturalHeight}px` : " · se dibuja una caja de color hasta que exista"}. Formato: objeto_tema_NN.`;
        $("btnTamanoTipo").disabled = imagen.estado !== "ok";
        const usos = usosDeTipo(tipo.id);
        $("btnAplicarTipo").disabled = !usos;
        $("btnAplicarTipo").textContent = usos ? `Aplicar a todos (${usos})` : "Sin colocar";
        $("segModoTipo").querySelectorAll("button").forEach((boton) => {
            boton.classList.toggle("activo", boton.dataset.modo === tipo.modo);
        });
        dibujarVistaTipo(tipo, imagen);
    }

    // Vista previa: la imagen, la caja de colision recortada y a escala la altura de salto de cada personaje
    function dibujarVistaTipo(tipo, imagen) {
        const lienzoTipo = $("vistaTipo");
        const c = lienzoTipo.getContext("2d");
        const { width: ancho, height: alto } = lienzoTipo;
        const suelo = alto - 14;
        const saltos = Object.values(personajesDisponibles).map((personaje) => ({ nombre: personaje.nombre, altura: alturaSalto(personaje) }));
        const escala = Math.min(1, (ancho - 70) / tipo.ancho, (suelo - 22) / Math.max(tipo.alto, ...saltos.map((s) => s.altura)));
        const w = tipo.ancho * escala;
        const hh = tipo.alto * escala;
        const x = 12;
        const y = suelo - hh;
        const modo = MODOS.find((m) => m.id === tipo.modo) || MODOS[0];
        const caja = cajaColisionObjeto({ tipo: tipo.id, x, y, ancho: w, alto: hh }, estado.catalogo);

        c.clearRect(0, 0, ancho, alto);
        c.fillStyle = "#363d49";
        c.fillRect(0, suelo, ancho, 2);
        if (imagen.estado === "ok") {
            c.imageSmoothingEnabled = false;
            c.drawImage(imagen.img, x, y, w, hh);
        } else {
            c.fillStyle = modo.color;
            c.globalAlpha = 0.25;
            c.fillRect(x, y, w, hh);
            c.globalAlpha = 1;
        }
        c.strokeStyle = "rgba(255, 255, 255, 0.45)";
        c.setLineDash([3, 3]);
        c.strokeRect(x + 0.5, y + 0.5, w - 1, hh - 1);
        c.setLineDash([]);
        if (tipo.modo !== MODOS_OBJETO.FONDO) {
            c.strokeStyle = modo.color;
            c.lineWidth = 1.5;
            c.strokeRect(caja.x + 0.5, caja.y + 0.5, caja.ancho - 1, caja.alto - 1);
            c.fillStyle = modo.color;
            c.fillRect(caja.x, caja.y, caja.ancho, 3);
        }

        c.font = `10px ${FUENTE_MONO}`;
        saltos.forEach((salto) => {
            const ys = suelo - salto.altura * escala;
            const llega = tipo.modo === MODOS_OBJETO.FONDO || salto.altura >= tipo.alto - tipo.margenes.arriba;
            c.strokeStyle = llega ? "#4cc38a" : "#f0616d";
            c.setLineDash([2, 3]);
            c.beginPath();
            c.moveTo(x + w + 6, ys);
            c.lineTo(ancho - 4, ys);
            c.stroke();
            c.setLineDash([]);
            c.fillStyle = c.strokeStyle;
            c.fillText(`${salto.nombre} ${salto.altura}`, x + w + 8, ys - 3);
        });
        c.fillStyle = "#8d95a3";
        c.fillText(`${tipo.ancho}×${tipo.alto}`, x, alto - 2);
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
        limpiarSeleccion();
        estado.seleccion = indice;
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
        limpiarSeleccion();
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

    function seleccionarTrampa(indice) {
        limpiarSeleccion();
        estado.seleccionTrampa = indice;
        sincronizarInspector();
        pedirRender();
    }

    function seleccionarElemento(ref) {
        limpiarSeleccion();
        estado.seleccionElemento = ref;
        sincronizarInspector();
        pedirRender();
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
        const copia = {
            ...JSON.parse(JSON.stringify(original)),
            x: esPlataformaFlotante(original) ? original.x + original.ancho + estado.snap * 2 : anchoMundoReal(piso) + estado.snap * 4
        };
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

    // --------------------------------------------------- Acciones de trampa y elemento

    function crearPlataformaFlotante(punto, libre) {
        const piso = pisoActivo();
        const ancho = 160;
        const nueva = {
            x: Math.max(0, ajustarGrilla(punto.x - ancho / 2, libre)),
            y: Math.max(140, Math.min(ALTURA_PLATAFORMA_DEFAULT - 64, ajustarGrilla(punto.y - 16, libre))),
            ancho,
            tipo: TIPOS_PLATAFORMA.NORMAL,
            flotante: true,
            movil: { eje: "x", rango: 140, velocidad: 2.1 },
            velocidadCinta: 2.6,
            fuerzaRebote: -19.5
        };
        registrar();
        piso.plataformas.push(nueva);
        ordenar(piso, nueva);
        estado.herramienta = "seleccionar";
        alCambiar();
    }

    function crearTrampa(punto, libre) {
        const piso = pisoActivo();
        const def = TIPOS_TRAMPAS_UI.find((t) => t.id === estado.ultimaTrampa) || TIPOS_TRAMPAS_UI[0];
        const x = Math.max(0, ajustarGrilla(punto.x - def.ancho / 2, libre));
        let y = ajustarGrilla(punto.y - def.alto / 2, libre);
        if (def.id === TIPOS_TRAMPA_ACTIVA.PINCHOS || def.id === TIPOS_TRAMPA_ACTIVA.VAPOR) {
            const suelo = pisoBajo(piso, { x, y: punto.y - def.alto, ancho: def.ancho, alto: def.alto }) ?? ALTURA_PLATAFORMA_DEFAULT;
            if (Math.abs(punto.y - suelo) <= 64) y = suelo - def.alto;
        }
        const nueva = importarTrampa({
            tipo: def.id,
            x,
            y,
            ancho: def.ancho,
            alto: def.alto
        });
        registrar();
        piso.trampas = piso.trampas || [];
        piso.trampas.push(nueva);
        estado.herramienta = "seleccionar";
        limpiarSeleccion();
        estado.seleccionTrampa = piso.trampas.length - 1;
        alCambiar();
    }

    function duplicarTrampa() {
        const original = trampaSeleccionada();
        if (!original) return;
        const piso = pisoActivo();
        registrar();
        piso.trampas.push({ ...original, x: original.x + original.ancho + estado.snap * 2 });
        limpiarSeleccion();
        estado.seleccionTrampa = piso.trampas.length - 1;
        alCambiar();
    }

    function eliminarTrampa() {
        if (!trampaSeleccionada()) return;
        const indice = estado.seleccionTrampa;
        registrar();
        pisoActivo().trampas.splice(indice, 1);
        limpiarSeleccion();
        alCambiar();
    }

    function apoyarTrampa() {
        const trampa = trampaSeleccionada();
        if (!trampa) return;
        const suelo = pisoBajo(pisoActivo(), trampa) ?? ALTURA_PLATAFORMA_DEFAULT;
        editar(() => { trampa.y = suelo - trampa.alto; });
    }

    function crearElemento(punto, libre) {
        const piso = pisoActivo();
        const categoria = estado.ultimaCategoriaElemento || "item";
        const x = Math.max(0, ajustarGrilla(punto.x, libre));
        registrar();
        limpiarSeleccion();
        estado.herramienta = "seleccionar";

        if (categoria === "checkpoint") {
            const suelo = pisoBajo(piso, { x, y: punto.y - 110, ancho: 48, alto: 110 }) ?? ALTURA_PLATAFORMA_DEFAULT;
            piso.checkpoints = piso.checkpoints || [];
            piso.checkpoints.push({ x, y: suelo - 110, ancho: 48, alto: 110, nombre: "Fichador" });
            estado.seleccionElemento = { categoria: "checkpoint", indice: piso.checkpoints.length - 1 };
        } else if (categoria === "item") {
            const y = Math.max(100, ajustarGrilla(punto.y - 20, libre));
            piso.items = piso.items || [];
            piso.items.push({ tipo: estado.ultimoSubtipoItem || TIPOS_ITEM.VIDA, x, y, ancho: 40, alto: 40 });
            estado.seleccionElemento = { categoria: "item", indice: piso.items.length - 1 };
        } else if (categoria === "interruptor") {
            const suelo = pisoBajo(piso, { x, y: punto.y - 22, ancho: 52, alto: 22 }) ?? ALTURA_PLATAFORMA_DEFAULT;
            piso.interruptores = piso.interruptores || [];
            piso.interruptores.push({
                estilo: "boton_piso",
                tipo: "boton_piso",
                x,
                y: suelo - 22,
                ancho: 52,
                alto: 22,
                canal: "A",
                modo: "activar",
                duracionMs: 5000,
                etiqueta: "CANAL A"
            });
            estado.seleccionElemento = { categoria: "interruptor", indice: piso.interruptores.length - 1 };
        } else if (categoria === "meta") {
            const suelo = pisoBajo(piso, { x, y: punto.y - 144, ancho: 92, alto: 144 }) ?? ALTURA_PLATAFORMA_DEFAULT;
            piso.meta = {
                x,
                y: suelo - 144,
                ancho: 92,
                alto: 144,
                etiqueta: "ASCENSOR",
                requiereLlave: (piso.items || []).some((it) => it.tipo === TIPOS_ITEM.TARJETA)
            };
            estado.seleccionElemento = { categoria: "meta", indice: 0 };
        }
        alCambiar();
    }

    function duplicarElemento() {
        const elem = elementoSeleccionado();
        if (!elem) return;
        const piso = pisoActivo();
        if (elem.categoria === "meta") {
            avisar("Solo puede haber un Ascensor Meta por piso.");
            return;
        }
        registrar();
        const lista = elem.categoria === "checkpoint"
            ? piso.checkpoints
            : elem.categoria === "interruptor"
                ? (piso.interruptores = piso.interruptores || [])
                : piso.items;
        lista.push({ ...elem.datos, x: elem.datos.x + 64 });
        limpiarSeleccion();
        estado.seleccionElemento = { categoria: elem.categoria, indice: lista.length - 1 };
        alCambiar();
    }

    function eliminarElemento() {
        const elem = elementoSeleccionado();
        if (!elem) return;
        const piso = pisoActivo();
        registrar();
        if (elem.categoria === "checkpoint") piso.checkpoints.splice(elem.indice, 1);
        else if (elem.categoria === "item") piso.items.splice(elem.indice, 1);
        else if (elem.categoria === "interruptor") (piso.interruptores || []).splice(elem.indice, 1);
        else if (elem.categoria === "meta") piso.meta = null;
        limpiarSeleccion();
        alCambiar();
    }

    function apoyarElemento() {
        const elem = elementoSeleccionado();
        if (!elem) return;
        const alto = elem.datos.alto || (elem.categoria === "checkpoint" ? 110 : elem.categoria === "meta" ? 144 : elem.categoria === "interruptor" ? 22 : 40);
        const suelo = pisoBajo(pisoActivo(), { x: elem.datos.x, y: elem.datos.y, ancho: elem.datos.ancho || 48, alto }) ?? ALTURA_PLATAFORMA_DEFAULT;
        editar(() => { elem.datos.y = suelo - alto; });
    }

    function cambiarCategoriaElemento(nuevaCat) {
        const elem = elementoSeleccionado();
        if (!elem || elem.categoria === nuevaCat) return;
        const piso = pisoActivo();
        const { x, y, imagen } = elem.datos;
        registrar();
        if (elem.categoria === "checkpoint") piso.checkpoints.splice(elem.indice, 1);
        else if (elem.categoria === "item") piso.items.splice(elem.indice, 1);
        else if (elem.categoria === "interruptor") (piso.interruptores || []).splice(elem.indice, 1);
        else if (elem.categoria === "meta") piso.meta = null;

        estado.ultimaCategoriaElemento = nuevaCat;
        if (nuevaCat === "checkpoint") {
            const obj = { x, y: ALTURA_PLATAFORMA_DEFAULT - 110, ancho: 48, alto: 110, nombre: "Fichador" };
            if (imagen) obj.imagen = imagen;
            piso.checkpoints.push(obj);
            estado.seleccionElemento = { categoria: "checkpoint", indice: piso.checkpoints.length - 1 };
        } else if (nuevaCat === "item") {
            const obj = { tipo: estado.ultimoSubtipoItem || TIPOS_ITEM.VIDA, x, y, ancho: 40, alto: 40 };
            if (imagen) obj.imagen = imagen;
            piso.items.push(obj);
            estado.seleccionElemento = { categoria: "item", indice: piso.items.length - 1 };
        } else if (nuevaCat === "interruptor") {
            piso.interruptores = piso.interruptores || [];
            const obj = { estilo: "boton_piso", tipo: "boton_piso", x, y: ALTURA_PLATAFORMA_DEFAULT - 22, ancho: 52, alto: 22, canal: "A", modo: "activar", duracionMs: 5000, etiqueta: "CANAL A" };
            if (imagen) obj.imagen = imagen;
            piso.interruptores.push(obj);
            estado.seleccionElemento = { categoria: "interruptor", indice: piso.interruptores.length - 1 };
        } else if (nuevaCat === "meta") {
            const obj = { x, y: ALTURA_PLATAFORMA_DEFAULT - 144, ancho: 92, alto: 144, etiqueta: "ASCENSOR", requiereLlave: false };
            if (imagen) obj.imagen = imagen;
            piso.meta = obj;
            estado.seleccionElemento = { categoria: "meta", indice: 0 };
        }
        alCambiar();
    }

    function generarCircuitoFase2EnPiso() {
        const actual = pisoActivo();
        if (!actual) return;
        const tieneElementos = (actual.trampas?.length || 0) + (actual.checkpoints?.length || 0) + (actual.items?.length || 0) + (actual.interruptores?.length || 0) > 0;
        if (tieneElementos && !window.confirm("¿Reemplazar las trampas, vidas, poderes, interruptores, checkpoints y plataformas flotantes de este piso por un circuito de prueba automático?")) {
            return;
        }
        registrar();
        const base = {
            id: actual.id,
            plataformas: actual.plataformas.filter((p) => !esPlataformaFlotante(p)),
            trampas: [],
            checkpoints: [],
            items: [],
            interruptores: [],
            meta: null
        };
        decorarPisoFase2(base);
        const reimportado = importarPiso({
            ...exportarPiso(actual),
            plataformas: base.plataformas,
            trampas: base.trampas,
            checkpoints: base.checkpoints,
            items: base.items,
            interruptores: base.interruptores,
            meta: base.meta
        });
        actual.plataformas = reimportado.plataformas;
        actual.trampas = reimportado.trampas;
        actual.checkpoints = reimportado.checkpoints;
        actual.items = reimportado.items;
        actual.interruptores = reimportado.interruptores;
        actual.meta = reimportado.meta;
        if (!actual.trampasHabilitadas.includes(TRAMPAS.QUEBRADIZO)) actual.trampasHabilitadas.push(TRAMPAS.QUEBRADIZO);
        limpiarSeleccion();
        alCambiar();
        avisar("⚡ Circuito generado en este piso (Plataformas, Trampas, Botones, Vidas, Poder Doble Salto, Checkpoints y Meta).");
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
            .map((apoyo) => (apoyo.modo ? cajaObjeto(apoyo) : apoyo))
            .filter((apoyo) => apoyo.x < o.x + o.ancho && apoyo.x + apoyo.ancho > o.x)
            .map((apoyo) => apoyo.y)
            .sort((a, b) => Math.abs(a - base) - Math.abs(b - base))[0];
        return cercano !== undefined && Math.abs(cercano - base) <= tolerancia ? cercano : ajustarGrilla(base, false);
    }

    function crearObjeto(punto, libre) {
        const piso = pisoActivo();
        const tipo = buscarTipoObjeto(estado.ultimoObjeto, estado.catalogo);
        const imagen = activo(obtenerRutaObjeto(estado.ultimoObjeto));
        const ancho = tipo ? tipo.ancho : imagen.estado === "ok" ? imagen.img.naturalWidth : TAMANO_OBJETO;
        const alto = tipo ? tipo.alto : imagen.estado === "ok" ? imagen.img.naturalHeight : TAMANO_OBJETO;
        const nuevo = {
            tipo: estado.ultimoObjeto,
            x: Math.max(0, ajustarGrilla(punto.x - ancho / 2, libre)),
            y: 0,
            ancho,
            alto,
            modo: tipo ? tipo.modo : estado.ultimoModo
        };
        // Si el clic cae cerca del piso, el objeto queda apoyado en el
        nuevo.y = ajustarBase(nuevo, punto.y + alto / 2, libre, alto / 2 + 10 / vista.zoom) - alto;

        registrar();
        piso.objetos.push(nuevo);
        estado.herramienta = "seleccionar";
        limpiarSeleccion();
        estado.seleccionObjeto = piso.objetos.length - 1;
        alCambiar();
    }

    function duplicarObjeto() {
        const original = objetoSeleccionado();
        if (!original) return;
        const piso = pisoActivo();
        registrar();
        piso.objetos.push({ ...original, x: original.x + original.ancho + estado.snap });
        limpiarSeleccion();
        estado.seleccionObjeto = piso.objetos.length - 1;
        alCambiar();
        irAObjeto(estado.seleccionObjeto);
    }

    function eliminarObjeto() {
        if (!objetoSeleccionado()) return;
        const indice = estado.seleccionObjeto;
        registrar();
        pisoActivo().objetos.splice(indice, 1);
        limpiarSeleccion();
        alCambiar();
    }

    function usarTamanoOriginal() {
        const objeto = objetoSeleccionado();
        const rutaObj = objeto ? obtenerRutaObjeto(objeto.tipo, objeto.imagen) : "";
        const imagen = rutaObj ? activo(rutaObj) : null;
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

    // ------------------------------------------------- Catalogo de objetos

    // Cambia tamano y modo dejando fija la base y el centro: el objeto sigue apoyado donde estaba
    function ajustarAlTipo(o, tipo) {
        const base = o.y + o.alto;
        const centro = o.x + o.ancho / 2;
        o.ancho = tipo.ancho;
        o.alto = tipo.alto;
        o.modo = tipo.modo;
        o.x = Math.max(0, Math.round(centro - o.ancho / 2));
        o.y = base - o.alto;
    }

    function colocados(id) {
        return estado.pisos.flatMap((piso) => piso.objetos.filter((o) => o.tipo === id));
    }

    // Elegir un tipo lo deja listo para colocar con la herramienta Objeto
    function elegirTipo(id, armar = true) {
        const tipo = buscarTipoObjeto(id, estado.catalogo);
        if (!tipo) return;
        estado.tipoCatalogo = id;
        estado.ultimoObjeto = id;
        estado.ultimoModo = tipo.modo;
        if (armar) {
            estado.herramienta = HERRAMIENTA_OBJETO;
            limpiarSeleccion();
        }
        sincronizarInspector();
        pedirRender();
    }

    function nuevoTipo(base = {}) {
        const piso = pisoActivo();
        const id = idLibre(base.id || `caja_${normalizarId(piso?.tilesTema) || TEMA_TILES_DEFAULT}`);
        const tipo = importarTipo({ modo: MODOS_OBJETO.SOLIDO, ...base, id, nombre: base.nombre || id });
        editarCatalogo(() => { estado.catalogo.push(tipo); });
        elegirTipo(id);
        $("tipoId").focus();
        $("tipoId").select();
    }

    function tipoDesdeObjeto() {
        const o = objetoSeleccionado();
        if (!o?.tipo || buscarTipoObjeto(o.tipo, estado.catalogo)) return;
        const id = normalizarId(o.tipo);
        if (!id) return;
        editarCatalogo(() => {
            estado.catalogo.push(importarTipo({ id, nombre: id, ancho: o.ancho, alto: o.alto, modo: o.modo }));
            // El nombre normalizado reemplaza al original en todos los pisos
            if (id !== o.tipo) colocados(o.tipo).forEach((otro) => { otro.tipo = id; });
        });
        elegirTipo(id, false);
        avisar(`${id} se agregó al catálogo.`);
    }

    function restablecerObjeto() {
        const o = objetoSeleccionado();
        const tipo = o && buscarTipoObjeto(o.tipo, estado.catalogo);
        if (tipo) editar(() => ajustarAlTipo(o, tipo));
    }

    // Los objetos que seguian igual al tipo (no se les cambio el tamano o el modo) siguen al tipo
    function editarTipo(cambiar) {
        const tipo = tipoSeleccionado();
        if (!tipo) return;
        const antes = { ...tipo, margenes: { ...tipo.margenes } };
        editarCatalogo(() => {
            cambiar(tipo);
            colocados(tipo.id).forEach((o) => {
                if (o.ancho === antes.ancho && o.alto === antes.alto && o.modo === antes.modo) ajustarAlTipo(o, tipo);
            });
        });
    }

    function renombrarTipo(valor) {
        const tipo = tipoSeleccionado();
        const id = normalizarId(valor);
        if (!tipo || !id || id === tipo.id) return;
        if (buscarTipoObjeto(id, estado.catalogo)) {
            avisar(`Ya hay un tipo llamado ${id}.`, "error");
            return;
        }
        const anterior = tipo.id;
        editarCatalogo(() => {
            colocados(anterior).forEach((o) => { o.tipo = id; });
            if (tipo.nombre === anterior) tipo.nombre = id;
            tipo.id = id;
        });
        elegirTipo(id, false);
    }

    function aplicarTipoAColocados() {
        const tipo = tipoSeleccionado();
        if (!tipo) return;
        const lista = colocados(tipo.id);
        editarCatalogo(() => lista.forEach((o) => ajustarAlTipo(o, tipo)));
        avisar(`${lista.length} ${lista.length === 1 ? "objeto actualizado" : "objetos actualizados"}.`);
    }

    function varianteTipo() {
        const tipo = tipoSeleccionado();
        if (tipo) nuevoTipo({ ...tipo, margenes: { ...tipo.margenes }, nombre: "" });
    }

    function eliminarTipo() {
        const tipo = tipoSeleccionado();
        if (!tipo) return;
        const usos = usosDeTipo(tipo.id);
        if (usos && !window.confirm(`${usos} ${usos === 1 ? "objeto usa" : "objetos usan"} ${tipo.id}. Seguirán en los pisos, pero sin catálogo. ¿Eliminar el tipo?`)) return;
        editarCatalogo(() => { estado.catalogo.splice(estado.catalogo.indexOf(tipo), 1); });
        estado.tipoCatalogo = null;
        sincronizarInspector();
    }

    function tamanoImagenTipo() {
        const tipo = tipoSeleccionado();
        const imagen = tipo && activo(obtenerRutaObjeto(tipo.id));
        if (imagen?.estado !== "ok") return;
        editarTipo((t) => {
            t.ancho = imagen.img.naturalWidth;
            t.alto = imagen.img.naturalHeight;
        });
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

    function dibujarTile(ruta, x, y, ancho, color, alto = ALTO_TILE) {
        const entrada = activo(ruta);
        if (entrada.estado === "ok") {
            ctx.drawImage(entrada.img, x, y, ancho, alto);
            return;
        }
        ctx.fillStyle = color;
        ctx.fillRect(x, y, ancho, alto);
        ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
        ctx.fillRect(x, y + alto - Math.min(12, alto / 3), ancho, Math.min(12, alto / 3));
    }

    function dibujarFondo(piso, ancho, desde, hasta) {
        // Todo por debajo de la linea del piso es negro solido (#000000) para que nunca se vea la imagen de fondo debajo del piso
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, ancho, ALTURA_PLATAFORMA_DEFAULT);
        ctx.clip();
        ctx.fillStyle = piso.colorPlaceholder;
        ctx.fillRect(0, 0, ancho, ALTURA_PLATAFORMA_DEFAULT);

        const fondo = estado.verFondo && piso.fondoRuta ? activo(piso.fondoRuta) : null;
        if (fondo?.estado === "ok") {
            const anchoFondo = fondo.img.naturalWidth * (ALTO_MUNDO / fondo.img.naturalHeight);
            for (let x = Math.floor(Math.max(0, desde) / anchoFondo) * anchoFondo; x < Math.min(ancho, hasta); x += anchoFondo) {
                ctx.drawImage(fondo.img, x, 0, anchoFondo, ALTO_MUNDO);
            }
        }
        ctx.fillStyle = "rgba(12, 14, 18, 0.38)";
        ctx.fillRect(0, 0, ancho, ALTURA_PLATAFORMA_DEFAULT);
        ctx.restore();

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, ALTURA_PLATAFORMA_DEFAULT, ancho, ALTO_MUNDO - ALTURA_PLATAFORMA_DEFAULT);
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

    function dibujarArco(origen, destino, personaje, color, conDash = false) {
        const anchoColision = personaje.colision?.ancho || 64;
        let x = origen.x + origen.ancho + anchoColision * (0.5 - APOYO_MINIMO);
        let y = origen.y;
        let velocidadY = -personaje.fuerzaSalto;
        const dashFrames = personaje.dashFrames || 11;
        const dashVel = personaje.velocidadDash || 13.5;
        let dashRestante = 0;
        let dashUsado = false;

        ctx.strokeStyle = color;
        ctx.lineWidth = (conDash ? 1.5 : 2) / vista.zoom;
        ctx.setLineDash(conDash ? [3 / vista.zoom, 4 / vista.zoom] : [5 / vista.zoom, 5 / vista.zoom]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let frames = 0; frames < 600; frames++) {
            if (conDash && !dashUsado && velocidadY >= 0) {
                dashUsado = true;
                dashRestante = dashFrames;
                velocidadY = 0;
            }
            if (dashRestante > 0) {
                dashRestante--;
                x += dashVel;
            } else {
                velocidadY += GRAVEDAD;
                y += velocidadY;
                x += personaje.velocidad;
            }
            ctx.lineTo(x, y);
            if ((velocidadY >= 0 && dashRestante === 0 && y >= destino.y) || y > ALTO_MUNDO) break;
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function dibujarHuecos(piso) {
        const personaje = personajesDisponibles[estado.personaje];
        piso.plataformas.forEach((p, i) => {
            const ancho = huecoDespues(piso.plataformas, i);
            if (!ancho) return;
            const sigIdx = siguienteIndiceSuelo(piso.plataformas, i);
            const siguiente = piso.plataformas[sigIdx];
            if (!siguiente) return;
            const inicio = p.x + p.ancho;
            const arriba = Math.min(p.y, siguiente.y);
            const hueco = analizarHueco(piso, i);
            const color = COLORES_SALTO[hueco.resultado];

            ctx.fillStyle = "#000000";
            ctx.fillRect(inicio, arriba, ancho, ALTO_MUNDO - arriba);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.75;
            ctx.fillRect(inicio, arriba + ALTO_TILE + 6 / vista.zoom, ancho, 3 / vista.zoom);
            ctx.globalAlpha = 1;

            if (estado.verArcos && personaje) {
                const llega = alcanceSalto(personaje, siguiente.y - p.y) >= ancho;
                dibujarArco(p, siguiente, personaje, llega ? COLORES_SALTO.ok : COLORES_SALTO.parcial, false);
                dibujarArco(p, siguiente, personaje, "#ff4fd8", true);
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
        const flotante = esPlataformaFlotante(p);
        const altoP = p.alto || (flotante ? 28 : ALTO_TILE);
        const color = COLORES_PISO[piso.tipoPiso] || piso.colorPlaceholder;
        const rutasTema = obtenerRutasTilesTema(piso.tilesTema);
        const rutas = rutasPiso(piso);

        if (!flotante) {
            ctx.fillStyle = "#000000";
            ctx.fillRect(p.x, p.y, p.ancho, ALTO_MUNDO - p.y);
            const antSuelo = plataformas.slice(0, indice).reverse().find((otra) => !esPlataformaFlotante(otra));
            const hayHuecoAntes = antSuelo ? p.x > antSuelo.x + antSuelo.ancho : false;
            const bordeIzq = hayHuecoAntes ? Math.min(ANCHO_TILE, p.ancho) : 0;
            const bordeDer = huecoDespues(plataformas, indice) > 0 ? Math.min(ANCHO_TILE, Math.max(0, p.ancho - bordeIzq)) : 0;

            if (bordeIzq) dibujarTile(rutasTema.bordeRotoIzq, p.x, p.y, bordeIzq, color);
            for (let x = bordeIzq, pieza = 0; x < p.ancho - bordeDer; pieza++) {
                const ancho = Math.min(ANCHO_TILE, p.ancho - bordeDer - x);
                dibujarTile(rutas[pieza % rutas.length], p.x + x, p.y, ancho, color);
                x += ancho;
            }
            if (bordeDer) dibujarTile(rutasTema.bordeRotoDer, p.x + p.ancho - bordeDer, p.y, bordeDer, color);
        } else {
            ctx.fillStyle = "#2b3340";
            ctx.fillRect(p.x, p.y, p.ancho, altoP);
            ctx.fillStyle = colorTipo(p.tipo);
            ctx.fillRect(p.x, p.y, p.ancho, Math.min(6, altoP));
        }

        if (p.tipo !== TIPOS_PLATAFORMA.NORMAL || flotante) {
            const tinte = colorTipo(p.tipo);
            ctx.fillStyle = tinte;
            ctx.globalAlpha = 0.28;
            ctx.fillRect(p.x, p.y, p.ancho, altoP);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = tinte;
            ctx.lineWidth = 2 / z;
            ctx.strokeRect(p.x, p.y, p.ancho, altoP);
            if (p.tipo === TIPOS_PLATAFORMA.PIVOTE) {
                ctx.fillStyle = tinte;
                ctx.fillRect(p.x + p.ancho / 2 - 3 / z, p.y, 6 / z, altoP);
            } else if (p.tipo === TIPOS_PLATAFORMA.MOVIL) {
                const dist = Number(p.movil?.rango) || 140;
                const ejeMov = p.movil?.eje === "y" ? "y" : "x";
                ctx.save();
                ctx.strokeStyle = tinte;
                ctx.setLineDash([4 / z, 4 / z]);
                ctx.beginPath();
                if (ejeMov === "y") {
                    ctx.moveTo(p.x + p.ancho / 2, p.y + altoP / 2 - dist);
                    ctx.lineTo(p.x + p.ancho / 2, p.y + altoP / 2 + dist);
                } else {
                    ctx.moveTo(p.x + p.ancho / 2 - dist, p.y + altoP / 2);
                    ctx.lineTo(p.x + p.ancho / 2 + dist, p.y + altoP / 2);
                }
                ctx.stroke();
                ctx.restore();
            } else if (p.tipo === TIPOS_PLATAFORMA.CINTA) {
                const dir = (Number(p.velocidadCinta) || 3.4) >= 0 ? ">>>" : "<<<";
                etiqueta(dir, p.x + p.ancho / 2, p.y + altoP / 2, "#ffffff");
            }
        }

        if (p.ancho * z > 65) {
            const nombre = TIPOS.find((t) => t.id === p.tipo)?.nombre || p.tipo;
            const prefijo = flotante ? "Flotante" : `${indice + 1}`;
            const texto = p.tipo === TIPOS_PLATAFORMA.NORMAL && !flotante
                ? `${indice + 1} · ${p.ancho}px`
                : `${prefijo} · ${nombre} · ${p.ancho}px`;
            etiqueta(texto, p.x + p.ancho / 2, p.y + altoP + 15 / z, flotante ? "#38bdf8" : colorTipo(p.tipo));
        }
    }

    function dibujarTrampasYElementos(piso, desde, hasta) {
        const z = vista.zoom;

        // Trampas activas
        (piso.trampas || []).forEach((trampa) => {
            if (trampa.x + trampa.ancho < desde - 200 || trampa.x > hasta + 200) return;
            const def = TIPOS_TRAMPAS_UI.find((t) => t.id === trampa.tipo) || TIPOS_TRAMPAS_UI[0];
            const color = def.color;

            if (trampa.tipo === TIPOS_TRAMPA_ACTIVA.SIERRA) {
                const dist = Number(trampa.rango) || 160;
                ctx.save();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5 / z;
                ctx.setLineDash([4 / z, 4 / z]);
                ctx.beginPath();
                const cx = trampa.x + trampa.ancho / 2;
                const cy = trampa.y + trampa.alto / 2;
                if (trampa.eje === "y") {
                    ctx.moveTo(cx, cy - dist);
                    ctx.lineTo(cx, cy + dist);
                } else {
                    ctx.moveTo(cx - dist, cy);
                    ctx.lineTo(cx + dist, cy);
                }
                ctx.stroke();
                ctx.restore();
            }

            const rutaImg = typeof obtenerRutaTrampa === "function" ? obtenerRutaTrampa(trampa) : trampa.imagen;
            const imgPersonalizada = rutaImg ? activo(rutaImg) : null;
            if (imgPersonalizada?.estado === "ok") {
                ctx.drawImage(imgPersonalizada.img, trampa.x, trampa.y, trampa.ancho, trampa.alto);
            } else {
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.32;
                ctx.fillRect(trampa.x, trampa.y, trampa.ancho, trampa.alto);
                ctx.globalAlpha = 1;
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 2 / z;
            ctx.strokeRect(trampa.x, trampa.y, trampa.ancho, trampa.alto);
            if (trampa.ancho * z > 36) {
                etiqueta(def.nombre, trampa.x + trampa.ancho / 2, trampa.y - 12 / z, color);
            }
        });

        // Checkpoints
        (piso.checkpoints || []).forEach((cp, idx) => {
            const w = cp.ancho || 44;
            const hCp = cp.alto || 96;
            if (cp.x + w < desde || cp.x > hasta) return;
            const imgCp = cp.imagen ? activo(cp.imagen) : null;
            if (imgCp?.estado === "ok") {
                ctx.drawImage(imgCp.img, cp.x, cp.y, w, hCp);
            } else {
                ctx.fillStyle = "rgba(52, 211, 153, 0.25)";
                ctx.fillRect(cp.x, cp.y, w, hCp);
            }
            ctx.strokeStyle = "#34d399";
            ctx.lineWidth = 2 / z;
            ctx.strokeRect(cp.x, cp.y, w, hCp);
            etiqueta(cp.etiqueta || `CP ${idx + 1}`, cp.x + w / 2, cp.y - 12 / z, "#34d399");
        });

        // Items coleccionables y poderes
        (piso.items || []).forEach((it) => {
            const w = it.ancho || 36;
            const hIt = it.alto || 36;
            if (it.x + w < desde || it.x > hasta) return;
            const defItem = TIPOS_ITEMS_UI.find((t) => t.id === it.tipo) || TIPOS_ITEMS_UI[0];
            const color = defItem.color;
            const rutaImg = typeof obtenerRutaItem === "function" ? obtenerRutaItem(it) : it.imagen;
            const imgItem = rutaImg ? activo(rutaImg) : null;
            if (imgItem?.estado === "ok") {
                ctx.drawImage(imgItem.img, it.x, it.y, w, hIt);
            } else {
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.32;
                ctx.fillRect(it.x, it.y, w, hIt);
                ctx.globalAlpha = 1;
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 2 / z;
            ctx.strokeRect(it.x, it.y, w, hIt);
            if (z > 0.35) {
                const texto = it.tipo === TIPOS_ITEM.VIDA
                    ? "VIDA ♥"
                    : it.tipo === TIPOS_ITEM.DOBLE_SALTO
                        ? "2X SALTO ▲"
                        : it.tipo === TIPOS_ITEM.CAFE
                            ? "CAFÉ"
                            : "TARJETA";
                etiqueta(texto, it.x + w / 2, it.y - 11 / z, color);
            }
        });

        // Botones / Interruptores de canal
        (piso.interruptores || []).forEach((sw) => {
            const w = sw.ancho || 56;
            const hSw = sw.alto || 20;
            if (sw.x + w < desde || sw.x > hasta) return;
            const imgSw = sw.imagen ? activo(sw.imagen) : null;
            if (imgSw?.estado === "ok") {
                ctx.drawImage(imgSw.img, sw.x, sw.y, w, hSw);
            } else {
                ctx.fillStyle = "rgba(245, 158, 11, 0.35)";
                ctx.fillRect(sw.x, sw.y, w, hSw);
            }
            ctx.strokeStyle = "#f59e0b";
            ctx.lineWidth = 2 / z;
            ctx.strokeRect(sw.x, sw.y, w, hSw);
            if (z > 0.35) {
                etiqueta(`BTN [${sw.canal || "canal"}]`, sw.x + w / 2, sw.y - 11 / z, "#f59e0b");
            }
        });

        // Ascensor Meta
        if (piso.meta) {
            const m = piso.meta;
            const w = m.ancho || 96;
            const hM = m.alto || 152;
            if (m.x + w >= desde && m.x <= hasta) {
                const imgMeta = m.imagen ? activo(m.imagen) : null;
                if (imgMeta?.estado === "ok") {
                    ctx.drawImage(imgMeta.img, m.x, m.y, w, hM);
                } else {
                    ctx.fillStyle = "rgba(56, 189, 248, 0.22)";
                    ctx.fillRect(m.x, m.y, w, hM);
                }
                ctx.strokeStyle = "#38bdf8";
                ctx.lineWidth = 2.5 / z;
                ctx.strokeRect(m.x, m.y, w, hM);
                etiqueta(m.requiereLlave ? "META 🔒" : "META", m.x + w / 2, m.y - 14 / z, "#38bdf8");
            }
        }
    }

    function dibujarObjeto(piso, indice) {
        const o = piso.objetos[indice];
        const z = vista.zoom;
        const modo = MODOS.find((m) => m.id === o.modo) || MODOS[0];
        const ruta = obtenerRutaObjeto(o.tipo, o.imagen);
        const imagen = ruta ? activo(ruta) : null;

        if (imagen?.estado === "ok") {
            ctx.drawImage(imagen.img, o.x, o.y, o.ancho, o.alto);
        } else {
            ctx.fillStyle = modo.color;
            ctx.globalAlpha = 0.28;
            ctx.fillRect(o.x, o.y, o.ancho, o.alto);
            ctx.globalAlpha = 1;
            if (o.ancho * z > 50) etiqueta(o.tipo || "sin imagen", o.x + o.ancho / 2, o.y + o.alto / 2, modo.color);
        }

        const caja = o.modo === MODOS_OBJETO.FONDO ? o : cajaObjeto(o);
        const recortada = caja.x !== o.x || caja.y !== o.y || caja.ancho !== o.ancho || caja.alto !== o.alto;
        ctx.strokeStyle = modo.color;
        ctx.lineWidth = 1.5 / z;
        // Con margenes, la imagen va en punteado y la caja de colision en trazo lleno
        if (recortada) {
            ctx.globalAlpha = 0.45;
            ctx.setLineDash([3 / z, 3 / z]);
            ctx.strokeRect(o.x, o.y, o.ancho, o.alto);
            ctx.globalAlpha = 1;
        }
        ctx.setLineDash(o.modo === MODOS_OBJETO.FONDO ? [4 / z, 4 / z] : []);
        ctx.strokeRect(caja.x, caja.y, caja.ancho, caja.alto);
        ctx.setLineDash([]);
        // La franja de arriba marca donde pisa el jugador
        if (o.modo !== MODOS_OBJETO.FONDO) {
            ctx.fillStyle = modo.color;
            ctx.fillRect(caja.x, caja.y, caja.ancho, 4 / z);
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
            const altoP = p.alto || (esPlataformaFlotante(p) ? 28 : ALTO_TILE);
            ctx.strokeStyle = "#4f9cf9";
            ctx.lineWidth = 2 / z;
            ctx.strokeRect(p.x - 1 / z, p.y - 1 / z, p.ancho + 2 / z, altoP + 2 / z);
            const lado = 10 / z;
            [p.x, p.x + p.ancho].forEach((x) => {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(x - lado / 2, p.y + altoP / 2 - lado, lado, lado * 2);
                ctx.strokeRect(x - lado / 2, p.y + altoP / 2 - lado, lado, lado * 2);
            });
            etiqueta(`x ${p.x} · y ${p.y} · ${p.ancho}px`, p.x + p.ancho / 2, p.y - 16 / z, "#cfe3fd");
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

        const t = trampaSeleccionada();
        if (t) {
            const lado = 10 / z;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2.5 / z;
            ctx.strokeRect(t.x - 2 / z, t.y - 2 / z, t.ancho + 4 / z, t.alto + 4 / z);
            ctx.fillStyle = "#f0616d";
            ctx.fillRect(t.x + t.ancho - lado / 2, t.y - lado / 2, lado, lado);
            etiqueta(`${t.tipo} · x ${t.x} · y ${t.y} · ${t.ancho}×${t.alto}`, t.x + t.ancho / 2, t.y + t.alto + 16 / z, "#ffd1d6");
        }

        const el = elementoSeleccionado();
        if (el) {
            const d = el.datos;
            const w = d.ancho || (el.categoria === "checkpoint" ? 44 : el.categoria === "meta" ? 96 : el.categoria === "interruptor" ? 56 : 36);
            const hEl = d.alto || (el.categoria === "checkpoint" ? 96 : el.categoria === "meta" ? 152 : el.categoria === "interruptor" ? 20 : 36);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2.5 / z;
            ctx.strokeRect(d.x - 2 / z, d.y - 2 / z, w + 4 / z, hEl + 4 / z);
            etiqueta(`${el.categoria} · x ${d.x} · y ${d.y}`, d.x + w / 2, d.y + hEl + 16 / z, "#cfe3fd");
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
        ctxMini.fillRect(0, 0, ancho, (ALTURA_PLATAFORMA_DEFAULT / ALTO_MUNDO) * alto);
        ctxMini.globalAlpha = 1;
        ctxMini.fillStyle = "#000000";
        ctxMini.fillRect(0, (ALTURA_PLATAFORMA_DEFAULT / ALTO_MUNDO) * alto, ancho, alto);

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
            ctxMini.fillRect(p.x * escala, y, Math.max(1, p.ancho * escala), Math.max(4, ((p.alto || ALTO_TILE) / ALTO_MUNDO) * alto));
        });

        piso.objetos.forEach((o, i) => {
            ctxMini.fillStyle = i === estado.seleccionObjeto ? "#ffffff" : MODOS.find((m) => m.id === o.modo)?.color || MODOS[0].color;
            ctxMini.fillRect(o.x * escala, (o.y / ALTO_MUNDO) * alto, Math.max(2, o.ancho * escala), Math.max(2, (o.alto / ALTO_MUNDO) * alto));
        });

        (piso.trampas || []).forEach((t, i) => {
            ctxMini.fillStyle = i === estado.seleccionTrampa ? "#ffffff" : "#f0616d";
            ctxMini.fillRect(t.x * escala, (t.y / ALTO_MUNDO) * alto, Math.max(2, t.ancho * escala), Math.max(2, (t.alto / ALTO_MUNDO) * alto));
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
            if (p.x + p.ancho >= desde - 200 && p.x <= hasta + 200) dibujarPlataforma(piso, i);
        });
        dibujarObjetos(piso, false, desde, hasta);
        dibujarTrampasYElementos(piso, desde, hasta);
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
            const altoP = p.alto || (esPlataformaFlotante(p) ? 28 : ALTO_TILE);
            if (punto.x >= p.x && punto.x <= p.x + p.ancho && punto.y >= p.y && punto.y <= p.y + altoP) return i;
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

    function trampaEn(punto) {
        const trampas = pisoActivo()?.trampas || [];
        for (let i = trampas.length - 1; i >= 0; i--) {
            const t = trampas[i];
            if (punto.x >= t.x && punto.x <= t.x + t.ancho && punto.y >= t.y && punto.y <= t.y + t.alto) return i;
        }
        return -1;
    }

    function elementoNivelEn(punto) {
        const piso = pisoActivo();
        if (!piso) return null;
        if (piso.meta) {
            const m = piso.meta;
            const w = m.ancho || 96;
            const hM = m.alto || 152;
            if (punto.x >= m.x && punto.x <= m.x + w && punto.y >= m.y && punto.y <= m.y + hM) {
                return { categoria: "meta", indice: 0 };
            }
        }
        const interruptores = piso.interruptores || [];
        for (let i = interruptores.length - 1; i >= 0; i--) {
            const sw = interruptores[i];
            const w = sw.ancho || 56;
            const hSw = sw.alto || 20;
            if (punto.x >= sw.x && punto.x <= sw.x + w && punto.y >= sw.y && punto.y <= sw.y + hSw) {
                return { categoria: "interruptor", indice: i };
            }
        }
        const items = piso.items || [];
        for (let i = items.length - 1; i >= 0; i--) {
            const it = items[i];
            const w = it.ancho || 36;
            const hIt = it.alto || 36;
            if (punto.x >= it.x && punto.x <= it.x + w && punto.y >= it.y && punto.y <= it.y + hIt) {
                return { categoria: "item", indice: i };
            }
        }
        const cps = piso.checkpoints || [];
        for (let i = cps.length - 1; i >= 0; i--) {
            const cp = cps[i];
            const w = cp.ancho || 44;
            const hCp = cp.alto || 96;
            if (punto.x >= cp.x && punto.x <= cp.x + w && punto.y >= cp.y && punto.y <= cp.y + hCp) {
                return { categoria: "checkpoint", indice: i };
            }
        }
        return null;
    }

    // Mismo orden que el dibujo: elementos, trampas, objetos con colision, plataformas y, al fondo, objetos de fondo
    function elementoEn(punto) {
        const elemNivel = elementoNivelEn(punto);
        if (elemNivel) return { elementoNivel: elemNivel };
        const trampa = trampaEn(punto);
        if (trampa !== -1) return { trampa };
        const delante = objetoEn(punto, false);
        if (delante !== -1) return { objeto: delante };
        const plataforma = plataformaEn(punto);
        if (plataforma !== -1) return { plataforma };
        const detras = objetoEn(punto, true);
        return detras !== -1 ? { objeto: detras } : null;
    }

    function asaObjetoEn(punto) {
        const o = objetoSeleccionado() || trampaSeleccionada();
        if (!o) return false;
        const tolerancia = 8 / vista.zoom;
        return Math.abs(punto.x - (o.x + o.ancho)) <= tolerancia && Math.abs(punto.y - o.y) <= tolerancia;
    }

    function asaEn(punto) {
        const p = plataformaSeleccionada();
        if (!p) return null;
        const altoP = p.alto || (esPlataformaFlotante(p) ? 28 : ALTO_TILE);
        const tolerancia = 8 / vista.zoom;
        if (punto.y < p.y - tolerancia || punto.y > p.y + altoP + tolerancia) return null;
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

    // Mover lleva el objeto/trampa/elemento a cualquier parte. El asa cambia el tamano dejando fija la esquina inferior izquierda.
    function aplicarArrastreObjeto(punto, evento) {
        const o = arrastre.objeto;
        const original = arrastre.original;
        const libre = evento.altKey;
        const dx = punto.x - arrastre.inicio.x;
        const dy = punto.y - arrastre.inicio.y;
        const altoActual = o.alto || 36;
        const base = original.y + (original.alto || altoActual);
        const nuevo = { x: o.x, y: o.y };
        if (o.ancho !== undefined) nuevo.ancho = o.ancho;
        if (o.alto !== undefined) nuevo.alto = o.alto;

        if (arrastre.tipo === "moverObjeto") {
            nuevo.x = Math.max(0, ajustarGrilla(original.x + dx, libre));
            nuevo.y = arrastre.libreY
                ? ajustarGrilla(original.y + dy, libre)
                : ajustarBase({ ...o, x: nuevo.x, ancho: o.ancho || 36, alto: altoActual }, base + dy, libre) - altoActual;
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
        const antes = `${p.x}:${p.y}:${p.ancho}`;
        const delta = punto.x - arrastre.inicio;
        const deltaY = punto.y - (arrastre.inicioY ?? punto.y);
        const original = arrastre.original;
        let x = p.x;
        let y = p.y;
        let ancho = p.ancho;

        if (arrastre.tipo === "mover") {
            x = ajustarMovimiento(original.x + delta, p, evento.altKey);
            if (esPlataformaFlotante(p)) {
                y = Math.max(80, Math.min(ALTURA_PLATAFORMA_DEFAULT - 32, ajustarGrilla(original.y + deltaY, evento.altKey)));
            }
        } else if (arrastre.tipo === "izq") {
            const fin = original.x + original.ancho;
            x = Math.min(ajustarBorde(original.x + delta, p, evento.altKey), fin - ANCHO_MINIMO);
            ancho = fin - x;
        } else {
            ancho = Math.max(ANCHO_MINIMO, ajustarBorde(original.x + original.ancho + delta, p, evento.altKey) - original.x);
        }

        if (`${x}:${y}:${ancho}` === antes) return;
        if (!arrastre.registrado) {
            registrar();
            arrastre.registrado = true;
        }
        p.x = x;
        p.y = y;
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
        if (estado.herramienta === HERRAMIENTA_FLOTANTE) {
            crearPlataformaFlotante(punto, evento.altKey);
            return;
        }
        if (estado.herramienta === HERRAMIENTA_TRAMPA) {
            crearTrampa(punto, evento.altKey);
            return;
        }
        if (estado.herramienta === HERRAMIENTA_ELEMENTO) {
            crearElemento(punto, evento.altKey);
            return;
        }

        if (estado.herramienta !== "seleccionar") {
            const x = ajustarBorde(punto.x, null, evento.altKey);
            seleccionar(null);
            arrastre = { tipo: "crear", x0: x, x1: x, y: alturaEn(punto) };
            return;
        }

        if (asaObjetoEn(punto)) {
            const o = objetoSeleccionado() || trampaSeleccionada();
            arrastre = { tipo: "tamObjeto", objeto: o, original: { ...o }, inicio: punto, registrado: false };
            return;
        }

        const asa = asaEn(punto);
        if (asa) {
            const p = plataformaSeleccionada();
            arrastre = { tipo: asa, plataforma: p, original: { x: p.x, y: p.y, ancho: p.ancho }, inicio: punto.x, inicioY: punto.y, registrado: false };
            return;
        }

        const elemento = elementoEn(punto);
        if (elemento?.elementoNivel) {
            seleccionarElemento(elemento.elementoNivel);
            const d = elementoSeleccionado().datos;
            arrastre = { tipo: "moverObjeto", objeto: d, original: { ...d }, inicio: punto, libreY: true, registrado: false };
            return;
        }
        if (elemento?.trampa !== undefined) {
            const t = piso.trampas[elemento.trampa];
            seleccionarTrampa(elemento.trampa);
            arrastre = { tipo: "moverObjeto", objeto: t, original: { ...t }, inicio: punto, libreY: true, registrado: false };
            return;
        }
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
            arrastre = { tipo: "mover", plataforma: p, original: { x: p.x, y: p.y, ancho: p.ancho }, inicio: punto.x, inicioY: punto.y, registrado: false };
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
            else if (trampaSeleccionada()) duplicarTrampa();
            else if (elementoSeleccionado()) duplicarElemento();
            else duplicarPlataforma();
        } else if (comando) {
            return;
        } else if (evento.code === "Space") {
            evento.preventDefault();
            espacioPulsado = true;
        } else if (tecla === "delete" || tecla === "backspace") {
            evento.preventDefault();
            if (objetoSeleccionado()) eliminarObjeto();
            else if (trampaSeleccionada()) eliminarTrampa();
            else if (elementoSeleccionado()) eliminarElemento();
            else eliminarPlataforma();
        } else if (tecla === "escape") {
            seleccionar(null);
        } else if (tecla === "v") {
            fijarHerramienta("seleccionar");
        } else if (["1", "2", "3", "4"].includes(tecla)) {
            fijarHerramienta(TIPOS[Number(tecla) - 1].id);
        } else if (tecla === "5" || tecla === "h") {
            fijarHerramienta(HERRAMIENTA_HUECO);
        } else if (tecla === "6") {
            fijarHerramienta(HERRAMIENTA_FLOTANTE);
        } else if (tecla === "7" || tecla === "t") {
            fijarHerramienta(HERRAMIENTA_TRAMPA);
        } else if (tecla === "8" || tecla === "e") {
            fijarHerramienta(HERRAMIENTA_ELEMENTO);
        } else if (tecla === "9" || tecla === "o") {
            fijarHerramienta(HERRAMIENTA_OBJETO);
        } else if (tecla === "f") {
            encajar();
        } else if (tecla === "a") {
            verTodo();
        } else if (tecla.startsWith("arrow") && (plataformaSeleccionada() || objetoSeleccionado() || trampaSeleccionada() || elementoSeleccionado())) {
            evento.preventDefault();
            const paso = evento.shiftKey ? estado.snap * 4 : estado.snap;
            editar(() => {
                const p = plataformaSeleccionada() || objetoSeleccionado() || trampaSeleccionada() || elementoSeleccionado()?.datos;
                if (!p) return;
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
            catalogo: JSON.parse(JSON.stringify(estado.catalogo)),
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
        const nodo = $(id);
        if (!nodo) return;
        nodo.addEventListener("change", (evento) => {
            if (!pisoActivo()) return;
            editar((piso) => aplicar(piso, evento.target.value, plataformaSeleccionada()));
            sincronizarInspector();
        });
    }

    function enlazarCampoObjeto(id, aplicar) {
        const nodo = $(id);
        if (!nodo) return;
        nodo.addEventListener("change", (evento) => {
            if (!objetoSeleccionado()) return;
            editar(() => aplicar(objetoSeleccionado(), evento.target.value));
            sincronizarInspector();
        });
    }

    function enlazarCampoTrampa(id, aplicar) {
        const nodo = $(id);
        if (!nodo) return;
        nodo.addEventListener("change", (evento) => {
            if (!trampaSeleccionada()) return;
            editar(() => aplicar(trampaSeleccionada(), evento.target.value));
            sincronizarInspector();
        });
    }

    function enlazarCampoElemento(id, aplicar) {
        const nodo = $(id);
        if (!nodo) return;
        nodo.addEventListener("change", (evento) => {
            if (!elementoSeleccionado()) return;
            editar(() => aplicar(elementoSeleccionado().datos, evento.target.value));
            sincronizarInspector();
        });
    }

    function entero(valor, respaldo, minimo = -Infinity) {
        const numero = Math.round(Number(valor));
        return Number.isFinite(numero) && valor !== "" ? Math.max(minimo, numero) : respaldo;
    }

    function decimal(valor, respaldo) {
        const numero = Number(valor);
        return Number.isFinite(numero) && valor !== "" ? numero : respaldo;
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

    function pedirArchivoImagen(carpetaSugerida, alElegir) {
        const selector = $("selectorImagenArchivo");
        if (!selector) return;
        callbackSelectorImagen = (archivo) => {
            if (!archivo) return;
            const rutaRelativa = archivo.webkitRelativePath
                ? archivo.webkitRelativePath
                : `${carpetaSugerida}/${archivo.name}`;
            alElegir(rutaRelativa);
        };
        selector.value = "";
        selector.click();
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
                onclick: () => editar((piso) => {
                    const p = plataformaSeleccionada();
                    p.tipo = tipo.id;
                    if ([TIPOS_PLATAFORMA.MOVIL, TIPOS_PLATAFORMA.CINTA, TIPOS_PLATAFORMA.REBOTE].includes(tipo.id) && p.y === ALTURA_PLATAFORMA_DEFAULT) {
                        p.flotante = true;
                        p.alto = 28;
                    }
                    if (tipo.trampa && !piso.trampasHabilitadas.includes(tipo.trampa)) {
                        piso.trampasHabilitadas.push(tipo.trampa);
                    }
                })
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

        // Selector de archivo de imagen para Objetos, Trampas y Elementos
        $("selectorImagenArchivo")?.addEventListener("change", (evento) => {
            const archivo = evento.target.files?.[0];
            if (archivo && callbackSelectorImagen) {
                callbackSelectorImagen(archivo);
                callbackSelectorImagen = null;
            }
        });

        // Acepta el nombre solo, con .png o con la ruta completa
        // Si es un tipo del catalogo, toma su tamano y su modo
        enlazarCampoObjeto("objTipo", (o, valor) => {
            o.tipo = valor.trim().replace(/^.*[\\/]/, "").replace(/\.png$/i, "");
            if (!o.tipo) return;
            estado.ultimoObjeto = o.tipo;
            const tipo = buscarTipoObjeto(o.tipo, estado.catalogo);
            if (tipo) {
                ajustarAlTipo(o, tipo);
                estado.tipoCatalogo = tipo.id;
            }
        });
        enlazarCampoObjeto("objImagen", (o, valor) => { o.imagen = valor.trim(); });
        enlazarCampoObjeto("objX", (o, valor) => { o.x = entero(valor, o.x, 0); });
        enlazarCampoObjeto("objY", (o, valor) => { o.y = entero(valor, o.y); });
        enlazarCampoObjeto("objAncho", (o, valor) => { o.ancho = entero(valor, o.ancho, LADO_MINIMO_OBJETO); });
        enlazarCampoObjeto("objAlto", (o, valor) => { o.alto = entero(valor, o.alto, LADO_MINIMO_OBJETO); });
        $("btnElegirImgObj")?.addEventListener("click", () => {
            if (!objetoSeleccionado()) return;
            pedirArchivoImagen("assets/objetos", (ruta) => {
                editar(() => { objetoSeleccionado().imagen = ruta; });
                sincronizarInspector();
            });
        });

        // Campos de Trampa Activa
        enlazarCampoTrampa("trampaTipo", (t, valor) => {
            const def = TIPOS_TRAMPAS_UI.find((item) => item.id === valor) || TIPOS_TRAMPAS_UI[0];
            t.tipo = def.id;
            t.ancho = def.ancho;
            t.alto = def.alto;
            estado.ultimaTrampa = def.id;
        });
        enlazarCampoTrampa("trampaImagen", (t, valor) => { t.imagen = valor.trim(); });
        enlazarCampoTrampa("trampaX", (t, valor) => { t.x = entero(valor, t.x, 0); });
        enlazarCampoTrampa("trampaY", (t, valor) => { t.y = entero(valor, t.y, 0); });
        enlazarCampoTrampa("trampaAncho", (t, valor) => { t.ancho = entero(valor, t.ancho, 16); });
        enlazarCampoTrampa("trampaAlto", (t, valor) => { t.alto = entero(valor, t.alto, 16); });
        enlazarCampoTrampa("trampaOrientacion", (t, valor) => { t.orientacion = valor || "arriba"; });
        enlazarCampoTrampa("trampaIntervalo", (t, valor) => { t.intervaloMs = entero(valor, t.intervaloMs, 100); });
        enlazarCampoTrampa("trampaDuracion", (t, valor) => { t.duracionMs = entero(valor, t.duracionMs, 100); });
        enlazarCampoTrampa("trampaAviso", (t, valor) => { t.avisoMs = entero(valor, t.avisoMs, 0); });
        enlazarCampoTrampa("trampaEje", (t, valor) => { t.eje = valor === "y" ? "y" : "x"; });
        enlazarCampoTrampa("trampaRango", (t, valor) => { t.rango = entero(valor, t.rango, 16); });
        enlazarCampoTrampa("trampaVelocidad", (t, valor) => { t.velocidad = decimal(valor, t.velocidad); });
        enlazarCampoTrampa("trampaCanal", (t, valor) => { t.canal = valor.trim(); });
        $("btnElegirImgTrampa")?.addEventListener("click", () => {
            if (!trampaSeleccionada()) return;
            pedirArchivoImagen("assets/trampas", (ruta) => {
                editar(() => { trampaSeleccionada().imagen = ruta; });
                sincronizarInspector();
            });
        });

        // Campos de Elemento de Nivel (Checkpoint, Item/Poder, Interruptor, Ascensor Meta)
        $("elemCategoria")?.addEventListener("change", (evento) => {
            cambiarCategoriaElemento(evento.target.value);
        });
        enlazarCampoElemento("elemSubtipo", (d, valor) => {
            const elem = elementoSeleccionado();
            if (elem?.categoria === "interruptor") {
                d.estilo = valor;
                d.tipo = valor;
                const esBoton = valor === TIPOS_INTERRUPTOR.BOTON_PISO;
                if ((d.ancho === 52 || d.ancho === 44 || d.ancho === 56) && (d.alto === 22 || d.alto === 56 || d.alto === 20)) {
                    const baseY = d.y + d.alto;
                    d.ancho = esBoton ? 52 : 44;
                    d.alto = esBoton ? 22 : 56;
                    d.y = baseY - d.alto;
                }
            } else {
                d.tipo = valor;
                estado.ultimoSubtipoItem = valor;
            }
        });
        enlazarCampoElemento("elemImagen", (d, valor) => { d.imagen = valor.trim(); });
        enlazarCampoElemento("elemX", (d, valor) => { d.x = entero(valor, d.x, 0); });
        enlazarCampoElemento("elemY", (d, valor) => { d.y = entero(valor, d.y, 0); });
        enlazarCampoElemento("elemAncho", (d, valor) => { d.ancho = entero(valor, d.ancho || 36, 16); });
        enlazarCampoElemento("elemAlto", (d, valor) => { d.alto = entero(valor, d.alto || 36, 16); });
        enlazarCampoElemento("elemEtiqueta", (d, valor) => { d.etiqueta = valor.trim(); });
        enlazarCampoElemento("elemCanal", (d, valor) => { d.canal = valor.trim() || "A"; });
        enlazarCampoElemento("elemModoInterruptor", (d, valor) => {
            d.modo = ["activar", "alternar", "tiempo"].includes(valor) ? valor : "activar";
        });
        enlazarCampoElemento("elemDuracionInterruptor", (d, valor) => { d.duracionMs = entero(valor, d.duracionMs || 5000, 500); });
        $("elemRequiereLlave")?.addEventListener("change", (evento) => {
            const elem = elementoSeleccionado();
            if (elem?.categoria !== "meta") return;
            editar(() => { elem.datos.requiereLlave = evento.target.checked; });
            sincronizarInspector();
        });
        $("btnElegirImgElem")?.addEventListener("click", () => {
            const elem = elementoSeleccionado();
            if (!elem) return;
            pedirArchivoImagen("assets/items", (ruta) => {
                editar(() => { elem.datos.imagen = ruta; });
                sincronizarInspector();
            });
        });

        $("segModoTipo").replaceChildren(...MODOS.map((modo) =>
            h("button", {
                "data-modo": modo.id,
                title: modo.ayuda,
                onclick: () => editarTipo((t) => { t.modo = modo.id; })
            }, h("i", { class: `punto modo-${modo.id}` }), modo.nombre)
        ));
        const enlazarCampoTipo = (id, aplicar) => {
            $(id).addEventListener("change", (evento) => {
                if (!tipoSeleccionado()) return;
                aplicar(evento.target.value);
                sincronizarInspector();
            });
        };
        enlazarCampoTipo("tipoId", renombrarTipo);
        enlazarCampoTipo("tipoNombre", (valor) => editarCatalogo((t) => { t.nombre = valor.trim() || t.id; }));
        enlazarCampoTipo("tipoAncho", (valor) => editarTipo((t) => { t.ancho = entero(valor, t.ancho, LADO_MINIMO_OBJETO); }));
        enlazarCampoTipo("tipoAlto", (valor) => editarTipo((t) => { t.alto = entero(valor, t.alto, LADO_MINIMO_OBJETO); }));
        [["tipoMargenIzq", "izquierda"], ["tipoMargenDer", "derecha"], ["tipoMargenArriba", "arriba"]].forEach(([id, lado]) => {
            enlazarCampoTipo(id, (valor) => editarCatalogo((t) => { t.margenes[lado] = entero(valor, t.margenes[lado], 0); }));
        });
        $("btnNuevoTipo").addEventListener("click", () => nuevoTipo());
        $("btnTamanoTipo").addEventListener("click", tamanoImagenTipo);
        $("btnAplicarTipo").addEventListener("click", aplicarTipoAColocados);
        $("btnDuplicarTipo").addEventListener("click", varianteTipo);
        $("btnEliminarTipo").addEventListener("click", eliminarTipo);

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
        enlazarCampo("platMovilEje", (piso, valor, p) => {
            p.movil = p.movil || { eje: "x", rango: 140, velocidad: 2.2 };
            p.movil.eje = valor === "y" ? "y" : "x";
        });
        enlazarCampo("platMovilRango", (piso, valor, p) => {
            p.movil = p.movil || { eje: "x", rango: 140, velocidad: 2.2 };
            p.movil.rango = entero(valor, p.movil.rango ?? 140, 16);
        });
        enlazarCampo("platMovilVel", (piso, valor, p) => {
            p.movil = p.movil || { eje: "x", rango: 140, velocidad: 2.2 };
            p.movil.velocidad = decimal(valor, p.movil.velocidad ?? 2.2);
        });
        enlazarCampo("platVelocidadCinta", (piso, valor, p) => { p.velocidadCinta = decimal(valor, p.velocidadCinta ?? 3.4); });
        enlazarCampo("platFuerzaRebote", (piso, valor, p) => { p.fuerzaRebote = decimal(valor, p.fuerzaRebote ?? 20); });
        enlazarCampo("platCanal", (piso, valor, p) => { p.canal = valor.trim(); });
        $("platOcultaInicial")?.addEventListener("change", (evento) => {
            if (!plataformaSeleccionada()) return;
            editar(() => {
                plataformaSeleccionada().ocultaInicial = evento.target.checked;
            });
            sincronizarInspector();
        });
        $("platFlotante").addEventListener("change", (evento) => {
            if (!plataformaSeleccionada()) return;
            editar(() => {
                const p = plataformaSeleccionada();
                p.flotante = evento.target.checked;
                if (p.flotante && p.y === ALTURA_PLATAFORMA_DEFAULT) {
                    p.y = ALTURA_PLATAFORMA_DEFAULT - 160;
                    p.alto = 28;
                } else if (!p.flotante) {
                    p.y = ALTURA_PLATAFORMA_DEFAULT;
                    p.alto = ALTO_TILE;
                }
            });
            sincronizarInspector();
        });
        enlazarCampo("platHueco", (piso, valor) => {
            const actual = huecoDespues(piso.plataformas, estado.seleccion);
            const sigIdx = siguienteIndiceSuelo(piso.plataformas, estado.seleccion);
            if (sigIdx !== -1) desplazarDesde(piso, sigIdx, entero(valor, actual, 0) - actual);
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
        $("btnGenerarFase2").addEventListener("click", generarCircuitoFase2EnPiso);
        $("btnDuplicarPlat").addEventListener("click", duplicarPlataforma);
        $("btnEliminarPlat").addEventListener("click", eliminarPlataforma);
        $("btnTamanoOriginal").addEventListener("click", usarTamanoOriginal);
        $("btnApoyarObjeto").addEventListener("click", apoyarObjeto);
        $("btnDuplicarObjeto").addEventListener("click", duplicarObjeto);
        $("btnEliminarObjeto").addEventListener("click", eliminarObjeto);
        $("btnApoyarTrampa").addEventListener("click", apoyarTrampa);
        $("btnDuplicarTrampa").addEventListener("click", duplicarTrampa);
        $("btnEliminarTrampa").addEventListener("click", eliminarTrampa);
        $("btnApoyarElemento").addEventListener("click", apoyarElemento);
        $("btnDuplicarElemento").addEventListener("click", duplicarElemento);
        $("btnEliminarElemento").addEventListener("click", eliminarElemento);
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
        estado.catalogo = obtenerCatalogoObjetos().map(importarTipo);
        fijarLineaBase();
        construirInterfaz();
        ajustarLienzo();
        alCambiar();
        revisarBorrador();
    }

    iniciar();
})();

