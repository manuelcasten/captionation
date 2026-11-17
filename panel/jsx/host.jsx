// Subtitulos Bold - lado Premiere (ExtendScript)
var SB_TPS = 254016000000;

function sb_q(s) {
    s = String(s);
    var out = '"';
    for (var i = 0; i < s.length; i++) {
        var c = s.charAt(i), code = s.charCodeAt(i);
        if (c === '"') out += '\\"';
        else if (c === '\\') out += '\\\\';
        else if (code < 32 || code > 126) out += '\\u' + ('0000' + code.toString(16)).slice(-4);
        else out += c;
    }
    return out + '"';
}

function sb_toJSON(v) {
    if (v === null || v === undefined) return 'null';
    var t = typeof v;
    if (t === 'string') return sb_q(v);
    if (t === 'number') return isFinite(v) ? String(v) : 'null';
    if (t === 'boolean') return v ? 'true' : 'false';
    if (v instanceof Array) {
        var a = [];
        for (var i = 0; i < v.length; i++) a.push(sb_toJSON(v[i]));
        return '[' + a.join(',') + ']';
    }
    var o = [];
    for (var k in v) { if (v.hasOwnProperty(k)) o.push(sb_q(k) + ':' + sb_toJSON(v[k])); }
    return '{' + o.join(',') + '}';
}

function sb_info() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return sb_toJSON({ ok: false, err: 'No hay una secuencia activa.' });
        var tracks = [];
        for (var i = 0; i < seq.videoTracks.numTracks; i++) {
            var t = seq.videoTracks[i];
            tracks.push({ i: i, name: t.name, n: t.clips.numItems });
        }
        return sb_toJSON({
            ok: true,
            name: seq.name,
            timebase: String(seq.timebase),
            w: Number(seq.frameSizeHorizontal),
            h: Number(seq.frameSizeVertical),
            playhead: String(seq.getPlayerPosition().ticks),
            tracks: tracks
        });
    } catch (e) { return sb_toJSON({ ok: false, err: e.toString() }); }
}

function sb_addTrack() {
    try {
        var seq = app.project.activeSequence;
        var before = seq.videoTracks.numTracks;
        app.enableQE();
        qe.project.getActiveSequence().addTracks(1, before, 0);
        var after = app.project.activeSequence.videoTracks.numTracks;
        if (after > before) return String(after - 1);
        return 'err:No se pudo crear la pista. Crea una pista de video vacia a mano y eligela.';
    } catch (e) { return 'err:' + e.toString(); }
}

function sb_setText(param, text) {
    var v = null;
    try { v = param.getValue(); } catch (e0) {}
    if (typeof v === 'string' && v.charAt(0) === '{') {
        try {
            var o = eval('(' + v + ')');
            if (o && o.textEditValue !== undefined) {
                o.textEditValue = text;
                param.setValue(sb_toJSON(o), true);
                return;
            }
        } catch (e1) {}
    }
    param.setValue(text, true);
}

var SB_FONTFAIL = 0;

function sb_setFont(param, ps) {
    var v = null;
    try { v = param.getValue(); } catch (e0) {}
    if (typeof v === "string" && v.charAt(0) === "{") {
        try {
            var o = eval("(" + v + ")");
            o.fontEditValue = [ps];
            o.capPropFontEdit = true;
            param.setValue(sb_toJSON(o), true);
            return true;
        } catch (e1) {}
    }
    return false;
}

// p = { textName, timesName, nums: [[nombre, valor]], colors: [[nombre, [r,g,b]]], fonts: [[nombre, postscript]] }
function sb_apply(clip, p, text, times) {
    var comp = clip.getMGTComponent();
    if (!comp) return false;
    var props = comp.properties;
    var i, prm;
    if (text !== null && text !== undefined) {
        prm = props.getParamForDisplayName(p.textName);
        if (prm) sb_setText(prm, text);
    }
    if (times !== null && times !== undefined && p.timesName) {
        prm = props.getParamForDisplayName(p.timesName);
        if (prm) sb_setText(prm, times);
    }
    for (i = 0; i < p.nums.length; i++) {
        prm = props.getParamForDisplayName(p.nums[i][0]);
        if (prm) { try { prm.setValue(p.nums[i][1], true); } catch (e1) {} }
    }
    for (i = 0; i < p.colors.length; i++) {
        prm = props.getParamForDisplayName(p.colors[i][0]);
        var c = p.colors[i][1];
        if (prm) { try { prm.setColorValue(255, c[0], c[1], c[2], true); } catch (e2) {} }
    }
    if (p.fonts) for (i = 0; i < p.fonts.length; i++) {
        prm = props.getParamForDisplayName(p.fonts[i][0]);
        if (prm && p.fonts[i][1] && !sb_setFont(prm, p.fonts[i][1])) SB_FONTFAIL++;
    }
    return true;
}

// a = { mogrt, track, p, items: [{s: ticks, e: ticks, t: texto, tm: tiempos}] }
// devuelve "ok:<n>|<errores>|<fallos de fuente>"
function sb_insert(a) {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return "err:No hay una secuencia activa.";
        var mf = new File(a.mogrt);
        if (!mf.exists) return "err:No encuentro la plantilla .mogrt:\n" + a.mogrt + "\n\nSi es la incluida, reinstala el plugin o ejecuta el script de After Effects para generarla.";
        var n = 0, errs = [];
        SB_FONTFAIL = 0;
        for (var i = 0; i < a.items.length; i++) {
            var it = a.items[i];
            var clip = seq.importMGT(mf.fsName, String(it.s), a.track, 0);
            if (!clip) { errs.push("no se inserto: " + it.t); continue; }
            try {
                var tEnd = new Time(); tEnd.ticks = String(it.e); clip.end = tEnd;
            } catch (eEnd) {
                try { clip.end = Number(it.e) / SB_TPS; } catch (eEnd2) {}
            }
            sb_apply(clip, a.p, it.t, it.tm);
            n++;
        }
        return "ok:" + n + "|" + errs.join("; ") + "|" + SB_FONTFAIL;
    } catch (e) { return "err:" + e.toString(); }
}

// a = { track, p }  -> cambia el estilo de todos los .mogrt de la pista (sin tocar texto ni tiempos)
function sb_restyle(a) {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return "err:No hay una secuencia activa.";
        var tr = seq.videoTracks[a.track];
        var n = 0;
        SB_FONTFAIL = 0;
        for (var i = 0; i < tr.clips.numItems; i++) {
            var c = tr.clips[i];
            var isM = false;
            try { isM = c.isMGT(); } catch (e0) { isM = !!c.getMGTComponent(); }
            if (isM && sb_apply(c, a.p, null, null)) n++;
        }
        return "ok:" + n + "||" + SB_FONTFAIL;
    } catch (e) { return "err:" + e.toString(); }
}

// a = { track, p } -> vista previa: aplica el estilo solo al subtitulo bajo el cursor
function sb_restyleAt(a) {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return "none";
        var ph = Number(seq.getPlayerPosition().ticks);
        var tr = seq.videoTracks[a.track];
        if (!tr) return "none";
        for (var i = 0; i < tr.clips.numItems; i++) {
            var c = tr.clips[i];
            if (Number(c.start.ticks) <= ph && ph < Number(c.end.ticks)) return sb_apply(c, a.p, null, null) ? "ok" : "none";
        }
        return "none";
    } catch (e) { return "err:" + e.toString(); }
}

// ---------- audio para transcribir ----------
function sb_findWavPreset() {
    var roots = [];
    try { roots.push(new Folder(app.path)); } catch (e0) {}
    try { roots.push(Folder.startup); } catch (e1) {}
    try { roots.push(Folder.startup.parent); } catch (e2) {}
    for (var r = 0; r < roots.length; r++) {
        if (!roots[r] || !roots[r].exists) continue;
        var sys = new Folder(roots[r].fsName + "/MediaIO/systempresets");
        if (!sys.exists) continue;
        var best = null, mp3 = null;
        var dirs = sys.getFiles();
        for (var i = 0; i < dirs.length; i++) {
            if (!(dirs[i] instanceof Folder)) continue;
            var eprs = dirs[i].getFiles("*.epr");
            for (var j = 0; j < eprs.length; j++) {
                var n = decodeURI(eprs[j].name);
                if (/^MP3 128kbps\.epr$/i.test(n)) mp3 = eprs[j].fsName; // ~0,9 MB por minuto
                if (/^Waveform Audio 48kHz 16-bit\.epr$/i.test(n)) best = eprs[j].fsName;
                if (!best && /Waveform/i.test(n)) best = eprs[j].fsName;
            }
        }
        if (mp3) return mp3;
        if (best) return best;
    }
    return "";
}

// rango a transcribir: entrada/salida marcadas (I/O) o toda la secuencia. Devuelve "ok:inSeg|durSeg|usaInOut"
function sb_audioRange() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return "err:No hay una secuencia activa.";
        var TPS = 254016000000;
        var endS = Number(seq.end) / TPS;
        var inS = 0, outS = endS;
        try { inS = seq.getInPointAsTime().seconds; outS = seq.getOutPointAsTime().seconds; } catch (e1) {}
        var useIO = (inS > 0.05 || (outS > 0 && outS < endS - 0.05)) && outS > inS;
        if (!useIO) { inS = 0; outS = endS; }
        return "ok:" + inS + "|" + (outS - inS) + "|" + (useIO ? 1 : 0);
    } catch (e) { return "err:" + e.toString(); }
}

// exporta el audio de la secuencia activa (o solo entrada/salida) a un .wav (sincronico)
function sb_exportAudio(outPath, useInOut) {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return "err:No hay una secuencia activa.";
        var preset = sb_findWavPreset();
        if (!preset) return "err:No encontre un preset de audio en Premiere.";
        var ext = /MP3/i.test(preset) ? ".mp3" : ".wav";
        outPath = outPath.replace(/\.(wav|mp3)$/i, "") + ext;
        var f = new File(outPath);
        if (f.exists) f.remove();
        var mode = useInOut ? app.encoder.ENCODE_IN_TO_OUT : app.encoder.ENCODE_ENTIRE;
        var r = seq.exportAsMediaDirect(f.fsName, preset, mode);
        if (f.exists) return "ok:" + f.fsName;
        var alt = new File(f.fsName.replace(/\.(wav|mp3)$/i, "") + ext);
        if (alt.exists) return "ok:" + alt.fsName;
        return "err:Premiere no genero el audio (" + r + ").";
    } catch (e) { return "err:" + e.toString(); }
}
