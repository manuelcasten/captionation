// Captionation - lado After Effects (ExtendScript). Se carga encima de host.jsx y reemplaza
// las funciones sb_* para que el mismo panel trabaje sobre la composicion activa.
// Cada subtitulo es una precomp "CAP ..." (copia de "Captionation Base") y TODAS leen el estilo
// de una sola composicion: "Captionation Estilo" (cambias ahi un control y cambian todos).
var SB_TPS = 254016000000;
var SB_STYLE = "Captionation Estilo";
var SB_STY_REF = 'comp("' + SB_STYLE + '")';
var SB_FOLDER = "Captionation";

function sb_aeComp() {
    var c = app.project.activeItem;
    if (!(c && c instanceof CompItem)) return null;
    if (c.name == SB_STYLE || /^Captionation Base/.test(c.name) || /^CAP \d+/.test(c.name)) return null;
    return c;
}
function sb_findItem(name, type) {
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it.name == name && (!type || it instanceof type)) return it;
    }
    return null;
}
function sb_folder(name, parent) {
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof FolderItem && it.name == name && (!parent || it.parentFolder == parent)) return it;
    }
    var f = app.project.items.addFolder(name);
    if (parent) f.parentFolder = parent;
    return f;
}
function sb_isCap(layer) {
    try { return layer.source && layer.source instanceof CompItem && /^CAP \d+/.test(layer.source.name); } catch (e) { return false; }
}
function sb_countCaps(c) {
    var n = 0;
    for (var i = 1; i <= c.numLayers; i++) if (sb_isCap(c.layer(i))) n++;
    return n;
}

function sb_info() {
    try {
        var c = sb_aeComp();
        if (!c) return sb_toJSON({ ok: false, err: "Abre (haz clic en la linea de tiempo de) la composicion que quieres subtitular." });
        return sb_toJSON({
            ok: true, host: "AE", name: c.name,
            timebase: String(SB_TPS * c.frameDuration),
            w: c.width, h: c.height,
            playhead: String(Math.round(c.time * SB_TPS)),
            tracks: [{ i: 0, name: "Composicion", n: sb_countCaps(c) }]
        });
    } catch (e) { return sb_toJSON({ ok: false, err: e.toString() }); }
}
function sb_addTrack() { return "0"; }

// ---------- plantilla dentro del proyecto ----------
function sb_lib() {
    if ($.global.SB_build) return true;
    $.global.SB_LIB = true;
    $.evalFile(new File($.global.SB_DIR + "/plantilla_ae.jsx"));
    return !!$.global.SB_build;
}
// cambia en las expresiones "thisComp.layer(CONTROLES / FUENTE_*)" por la composicion de estilo
function sb_redirect(grp) {
    for (var i = 1; i <= grp.numProperties; i++) {
        var p = grp.property(i);
        if (p.propertyType === PropertyType.PROPERTY) {
            try {
                if (p.canSetExpression && p.expression !== "") {
                    var ex = p.expression;
                    var nx = ex.split('thisComp.layer("CONTROLES")').join(SB_STY_REF + '.layer("CONTROLES")')
                               .split('thisComp.layer("FUENTE_REGULAR")').join(SB_STY_REF + '.layer("FUENTE_REGULAR")')
                               .split('thisComp.layer("FUENTE_BOLD")').join(SB_STY_REF + '.layer("FUENTE_BOLD")');
                    if (nx !== ex) p.expression = nx;
                }
            } catch (e) {}
        } else sb_redirect(p);
    }
}
function sb_ensureTemplates(target) {
    var root = sb_folder(SB_FOLDER, null);
    var style = sb_findItem(SB_STYLE, CompItem);
    if (!style) {
        if (!sb_lib()) throw new Error("No pude cargar la plantilla de After Effects (plantilla_ae.jsx).");
        style = $.global.SB_build(target.width, target.height, SB_STYLE);
        style.parentFolder = root;
    }
    var baseName = "Captionation Base " + target.width + "x" + target.height;
    var base = sb_findItem(baseName, CompItem);
    if (!base) {
        if (!sb_lib()) throw new Error("No pude cargar la plantilla de After Effects (plantilla_ae.jsx).");
        base = $.global.SB_build(target.width, target.height, baseName);
        for (var l = 1; l <= base.numLayers; l++) sb_redirect(base.layer(l));
        base.parentFolder = root;
    }
    base.frameRate = target.frameRate;
    return { style: style, base: base, subs: sb_folder("Subtitulos", root) };
}
function sb_setDocText(layer, txt) {
    var p = layer.property("ADBE Text Properties").property("ADBE Text Document");
    var d = p.value; d.text = txt; p.setValue(d);
}

// p = { nums: [[nombre, valor]], colors: [[nombre, [r,g,b]]], fonts: [[nombre, postscript]] } -> composicion de estilo
function sb_applyStyle(style, p) {
    var fx = style.layer("CONTROLES").property("ADBE Effect Parade"), i, e, fail = 0;
    for (i = 0; i < p.nums.length; i++) { e = fx.property(p.nums[i][0]); if (e) { try { e.property(1).setValue(p.nums[i][1]); } catch (e1) {} } }
    for (i = 0; i < p.colors.length; i++) {
        e = fx.property(p.colors[i][0]); var c = p.colors[i][1];
        if (e) { try { e.property(1).setValue([c[0] / 255, c[1] / 255, c[2] / 255, 1]); } catch (e2) {} }
    }
    if (p.fonts) for (i = 0; i < p.fonts.length; i++) {
        var ln = /bold/i.test(p.fonts[i][0]) ? "FUENTE_BOLD" : "FUENTE_REGULAR";
        try {
            var tp = style.layer(ln).property("ADBE Text Properties").property("ADBE Text Document");
            var d = tp.value; d.font = p.fonts[i][1]; tp.setValue(d);
            if (tp.value.font != p.fonts[i][1]) fail++;
        } catch (e3) { fail++; }
    }
    return fail;
}

// a = { track, p, items: [{s: ticks, e: ticks, t: texto, tm: tiempos}] }
function sb_insert(a) {
    var c = sb_aeComp();
    if (!c) return "err:Abre (haz clic en la linea de tiempo de) la composicion que quieres subtitular.";
    app.beginUndoGroup("Captionation: insertar subtitulos");
    try {
        var T = sb_ensureTemplates(c);
        var ff = sb_applyStyle(T.style, a.p);
        var n = 0, errs = [];
        var startIdx = 0;
        for (var k = 1; k <= app.project.numItems; k++) { var it0 = app.project.item(k); if (it0 instanceof CompItem && /^CAP \d+/.test(it0.name)) startIdx++; }
        for (var i = 0; i < a.items.length; i++) {
            var it = a.items[i];
            try {
                var s = Number(it.s) / SB_TPS, e = Number(it.e) / SB_TPS;
                var dur = Math.max(e - s, c.frameDuration);
                var dup = T.base.duplicate();
                var label = String(it.t).replace(/\*/g, "").replace(/\s+/g, " ");
                dup.name = "CAP " + ("000" + (startIdx + i + 1)).slice(-4) + " " + label.substr(0, 24);
                dup.parentFolder = T.subs;
                dup.duration = dur;
                sb_setDocText(dup.layer("ENTRADA"), it.t);
                sb_setDocText(dup.layer("TIEMPOS"), it.tm || "0");
                var L = c.layers.add(dup);
                L.startTime = s; L.inPoint = s; L.outPoint = s + dur;
                n++;
            } catch (eI) { errs.push(String(it.t).substr(0, 30) + ": " + eI.toString()); }
        }
        app.endUndoGroup();
        return "ok:" + n + "|" + errs.join("; ") + "|" + ff;
    } catch (e) { app.endUndoGroup(); return "err:" + e.toString(); }
}

// ---------- corregir el texto de un subtitulo ya insertado (capa CAP seleccionada) ----------
function sb_selCap() {
    var c = app.project.activeItem;
    if (!(c && c instanceof CompItem)) return null;
    var s = c.selectedLayers;
    for (var i = 0; i < s.length; i++) if (sb_isCap(s[i])) return s[i];
    return null;
}
function sb_getSelText() {
    try {
        var L = sb_selCap();
        if (!L) return "err:Selecciona en la linea de tiempo la capa del subtitulo (CAP ...).";
        return "ok:" + String(L.source.layer("ENTRADA").property("ADBE Text Properties").property("ADBE Text Document").value.text);
    } catch (e) { return "err:" + e.toString(); }
}
function sb_setSelText(t) {
    var L = sb_selCap();
    if (!L) return "err:Selecciona en la linea de tiempo la capa del subtitulo (CAP ...).";
    app.beginUndoGroup("Captionation: corregir texto");
    try {
        var src = L.source;
        var ent = src.layer("ENTRADA");
        var old = String(ent.property("ADBE Text Properties").property("ADBE Text Document").value.text);
        var cnt = function (s) { s = s.replace(/\*/g, " ").replace(/^\s+|\s+$/g, ""); return s ? s.split(/\s+/).length : 0; };
        sb_setDocText(ent, t);
        // si cambio la cantidad de palabras, se reparten los tiempos de entrada
        var nNew = cnt(t);
        if (nNew != cnt(old) && nNew > 0) {
            var tm = [], d = src.duration * 0.85;
            for (var i = 0; i < nNew; i++) tm.push((i * d / nNew).toFixed(3));
            sb_setDocText(src.layer("TIEMPOS"), tm.join(";"));
        }
        var m = String(src.name).match(/^CAP \d+/);
        if (m) src.name = m[0] + " " + String(t).replace(/\*/g, "").replace(/\s+/g, " ").substr(0, 24);
        app.endUndoGroup();
        return "ok";
    } catch (e) { app.endUndoGroup(); return "err:" + e.toString(); }
}

// cambia el estilo de todos los subtitulos (viven en "Captionation Estilo")
function sb_restyle(a) {
    try {
        var style = sb_findItem(SB_STYLE, CompItem);
        if (!style) return "err:Todavia no hay subtitulos de Captionation en este proyecto.";
        app.beginUndoGroup("Captionation: estilo");
        var ff = sb_applyStyle(style, a.p);
        app.endUndoGroup();
        var c = sb_aeComp();
        return "ok:" + (c ? sb_countCaps(c) : 0) + "||" + ff;
    } catch (e) { return "err:" + e.toString(); }
}
function sb_restyleAt(a) { var r = sb_restyle(a); return r.indexOf("ok:") === 0 ? "ok" : r; }

// ---------- audio: area de trabajo (si la acortaste) o toda la composicion ----------
function sb_audioRange() {
    try {
        var c = sb_aeComp();
        if (!c) return "err:Abre (haz clic en la linea de tiempo de) la composicion que quieres transcribir.";
        var ws = c.workAreaStart, wd = c.workAreaDuration;
        var useWA = (ws > 0.05 || wd < c.duration - 0.05) && wd > 0.1;
        return "ok:" + (useWA ? ws : 0) + "|" + (useWA ? wd : c.duration) + "|" + (useWA ? 1 : 0);
    } catch (e) { return "err:" + e.toString(); }
}

// renderiza solo el audio a .wav con la cola de procesamiento (sin tocar lo que ya tengas en cola)
function sb_exportAudio(outPath, useWA) {
    var rq = app.project.renderQueue, item = null, paused = [];
    try {
        var c = sb_aeComp();
        if (!c) return "err:Abre la composicion que quieres transcribir.";
        var hasAudio = false;
        for (var l = 1; l <= c.numLayers; l++) { try { if (c.layer(l).hasAudio && c.layer(l).audioActive) hasAudio = true; } catch (eA) {} }
        if (!hasAudio) return "err:La composicion no tiene capas con audio activo.";
        for (var i = 1; i <= rq.numItems; i++) {
            try { if (rq.item(i).render) { paused.push(rq.item(i)); rq.item(i).render = false; } } catch (eP) {}
        }
        item = rq.items.add(c);
        if (useWA) { item.timeSpanStart = c.workAreaStart; item.timeSpanDuration = c.workAreaDuration; }
        else { item.timeSpanStart = 0; item.timeSpanDuration = c.duration; }
        var om = item.outputModule(1);
        var tpl = null;
        try { for (var t = 0; t < om.templates.length; t++) if (/^WAV/i.test(om.templates[t])) tpl = om.templates[t]; } catch (eT) {}
        if (tpl) om.applyTemplate(tpl);
        else {
            try { om.setSettings({ "Format": "WAV" }); } catch (e1) {}
            try { om.setSettings({ "Video Output": false }); } catch (e2) {}
            try { om.setSettings({ "Output Audio": "On" }); } catch (e3) {}
        }
        var path = outPath.replace(/\.(wav|mp3)$/i, "") + ".wav";
        var f = new File(path);
        if (f.exists) f.remove();
        om.file = f;
        rq.render();
        try { item.remove(); } catch (eR) {}
        item = null;
        for (var j = 0; j < paused.length; j++) { try { paused[j].render = true; } catch (eB) {} }
        if (f.exists) return "ok:" + f.fsName;
        var alt = new File(path.replace(/\.wav$/i, ".aif"));
        if (alt.exists) return "err:After Effects genero AIFF en vez de WAV; avisa al soporte.";
        return "err:After Effects no genero el audio.";
    } catch (e) {
        try { if (item) item.remove(); } catch (eR2) {}
        for (var k = 0; k < paused.length; k++) { try { paused[k].render = true; } catch (eB2) {} }
        return "err:" + e.toString();
    }
}
