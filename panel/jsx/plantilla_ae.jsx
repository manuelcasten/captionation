// =====================================================================
//  Subtitulos Bold v3 - Generador de plantillas (.mogrt) para After Effects
//  Archivo > Scripts > Ejecutar archivo de script...  (AE 2025 / 2026)
//
//  Crea "Subtitulos Bold Vertical" (1080x1920) y "Subtitulos Bold Horizontal"
//  (1920x1080). Lo que va entre *asteriscos* sale con la fuente BOLD.
//   - Diseno 1 Clasico / 2 Tipografico (bold en su propia linea y mas grande)
//   - Alineacion izquierda / centro / derecha
//   - Resaltar la palabra que se dice (caja de color o solo color)
//   - Glow, sombra, borde, fondo, 7 animaciones de entrada
//  Si las composiciones ya existen, el script solo las exporta al plugin.
// =====================================================================
(function () {

    // Modo automatico (lo activa CONSTRUIR INSTALADOR): sin dialogos, exporta y cierra.
    var AUTO = !!$.global.SB_AUTO;
    function log(msg) {
        if (!AUTO) return;
        try { var lf = new File($.global.SB_OUTDIR + "/sb_resultado.txt"); lf.encoding = "UTF-8"; lf.open("w"); lf.write(msg); lf.close(); } catch (e) {}
    }
    function finish() {
        if (!AUTO) return;
        try { app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES); } catch (e) {}
        if ($.global.SB_QUIT) { try { app.quit(); } catch (e2) {} }
    }

    // Nombres expuestos (deben coincidir con el panel). Maximo 39 bytes.
    var N = {
        texto:   "Texto",
        tiempos: "Tiempos (no tocar)",
        fReg:    "Fuente regular",
        fBold:   "Fuente bold",
        estilo:  "Estilo entrada (1-7)",
        dis:     "Diseño (1 Clásico 2 Tipográfico)",
        esc:     "Escala bold (%)",
        align:   "Alineación (1 Izq 2 Centro 3 Der)",
        retraso: "Retraso entre palabras (frames)",
        vel:     "Velocidad entrada (frames)",
        tam:     "Tamaño de letra",
        posX:    "Posición horizontal (%)",
        posY:    "Posición vertical (%)",
        cpl:     "Caracteres por linea",
        track:   "Interletrado",
        colReg:  "Color regular",
        colBold: "Color bold",
        bordeW:  "Borde grosor (px)",
        colBorde:"Color borde",
        kar:     "Resaltar palabra (0 No 1 Caja 2 Color)",
        colAct:  "Color palabra activa",
        colCaja: "Color caja resalte",
        cajaM:   "Caja margen (px)",
        cajaR:   "Caja redondeo (px)",
        glowI:   "Brillo intensidad",
        glowR:   "Brillo radio",
        sombra:  "Sombra (%)",
        fOp:     "Fondo opacidad (%)",
        fColor:  "Color fondo",
        fMargen: "Fondo margen (px)",
        fRed:    "Fondo redondeo (px)"
    };
    var COMPS = [[1080, 1920, "Subtitulos Bold Vertical"], [1920, 1080, "Subtitulos Bold Horizontal"]];
    var TEXTS = [["TEXTO_IZQ", 1], ["TEXTO_CEN", 2], ["TEXTO_DER", 3]];

    if (parseFloat(app.version) < 25) {
        if (AUTO) { log("ERROR: se necesita After Effects 2025 o mas reciente"); finish(); }
        else alert("Este script necesita After Effects 2025 (v25) o mas reciente.");
        return;
    }

    // marcador ARROBA clave ARROBA -> "nombre del control" (sin arroba literal: ExtendScript no la acepta aqui)
    var MARK = new RegExp("\\u0040(\\w+)\\u0040", "g");
    function X(lines) { return lines.join("\n").replace(MARK, function (m, k) { return '"' + N[k] + '"'; }); }

    // ---------- codigo comun de las expresiones ----------
    var CORE = X([
        'var c = function (n) { return thisComp.layer("CONTROLES").effect(n); };',
        'var cv = function (n) { return c(n)(1); };',
        'var col = function (n) { var q = cv(n); return [q[0], q[1], q[2]]; };',
        'var raw = String(thisComp.layer("ENTRADA").text.sourceText.value);',
        'var clean = "", ranges = [], open = -1, i, j, k;',
        'for (i = 0; i < raw.length; i++) {',
        '  var ch = raw.charAt(i);',
        '  if (ch == "*") { if (open < 0) { open = clean.length; } else { ranges.push([open, clean.length - open]); open = -1; } }',
        '  else { clean += (ch == "\\n" || ch == "\\r") ? "\\r" : ch; }',
        '}',
        'if (open >= 0) ranges.push([open, clean.length - open]);',
        'var lay = Math.round(cv(@dis@));',
        'var esc = Math.max(10, cv(@esc@)) / 100;',
        'var isB = [];',
        'for (i = 0; i < clean.length; i++) isB.push(false);',
        'for (k = 0; k < ranges.length; k++) for (i = ranges[k][0]; i < ranges[k][0] + ranges[k][1]; i++) isB[i] = true;',
        // Tipografico: el texto se reparte en 3 capas (antes = derecha, bold = centro y grande, despues = izquierda)
        'var nm = thisLayer.name;',
        'var role = nm == "TEXTO_DER" ? 1 : ((nm == "TEXTO_CEN" || nm == "MEDIR_BOLD") ? 2 : (nm == "TEXTO_IZQ" ? 3 : 0));',
        'var split = lay == 2 && ranges.length > 0;',
        'var woff = 0, maxC = Math.max(5, cv(@cpl@));',
        'if (split && role > 0) {',
        '  var bS = ranges[0][0], bE = ranges[ranges.length - 1][0] + ranges[ranges.length - 1][1];',
        '  var g0 = role == 1 ? 0 : (role == 2 ? bS : bE), g1 = role == 1 ? bS : (role == 2 ? bE : clean.length);',
        '  var pre = clean.substring(0, g0).replace(/\\s+/g, " ").replace(/^ +| +$/g, "");',
        '  woff = pre ? pre.split(" ").length : 0;',
        '  clean = clean.substring(g0, g1).replace(/\\s+/g, " ").replace(/^ +| +$/g, "");',
        '  if (!clean.length) clean = " ";',
        '  isB = []; for (i = 0; i < clean.length; i++) isB.push(role == 2);',
        '  if (role == 2) {',
        '    if (nm == "MEDIR_BOLD") { esc = 1; maxC = 9999; }',
        '    else {',
        '      var bw = thisComp.layer("MEDIR_BOLD").sourceRectAtTime(time, false).width;',
        '      var mw = thisComp.width * (thisComp.height > thisComp.width ? 0.8 : 0.6);',
        '      maxC = 9999;',
        // tamano fijo (Escala bold) igual en todos los subtitulos; solo se achica si una sola palabra no cabe
        '      if (bw > 1) {',
        '        var cpx = bw / clean.length, lw = 0, wl = clean.split(" ");',
        '        for (i = 0; i < wl.length; i++) lw = Math.max(lw, wl[i].length);',
        '        if (lw * cpx * esc > mw) esc = Math.max(0.5, mw / (lw * cpx));',
        '        if (bw * esc > mw) maxC = (clean.length * esc) / Math.ceil(bw * esc / mw) / 1.05;',
        '      }',
        '    }',
        '  } else {',
        // antes / despues: nunca mas anchos que la palabra grande (asi el bloque queda centrado)
        '    var cw = thisComp.layer("TEXTO_CEN").sourceRectAtTime(25, false).width;',
        '    if (cw > 1) maxC = Math.max(12, Math.min(maxC, Math.floor(cw / (cv(@tam@) * 0.5))));',
        '  }',
        '}',
        // Captionation (diseno 3): antes / palabra resaltada sola / despues -> maximo 3 renglones
        'if (lay == 3 && ranges.length > 0) {',
        '  var c0 = ranges[0][0], c1 = ranges[ranges.length - 1][0] + ranges[ranges.length - 1][1];',
        '  var aa = clean.split("");',
        '  for (j = 0; j < aa.length; j++) if (aa[j] == "\\r") aa[j] = " ";',
        '  if (c0 > 0 && aa[c0 - 1] == " ") aa[c0 - 1] = "\\r";',
        '  if (c1 < aa.length && aa[c1] == " ") aa[c1] = "\\r";',
        '  clean = aa.join(""); maxC = 9999;',
        // que la palabra grande nunca se salga del cuadro
        '  var lim = thisComp.width * 0.86 / (Math.max(1, c1 - c0) * cv(@tam@) * 0.62);',
        '  if (esc > lim) esc = Math.max(1, lim);',
        '}',
        'var a = clean.split("");',
        'var wt = []; for (j = 0; j < a.length; j++) wt.push(isB[j] ? esc : 1);',
        // cortes equilibrados: lineas de largo parecido, sin palabras cortas (se, le, da, al) colgando al final
        'function balPara(s, e) {',
        '  var tot = 0, q, cum = [];',
        '  for (q = s; q < e; q++) { cum.push(tot); tot += wt[q]; }',
        '  if (tot <= maxC * 1.15) return;',
        '  var n = Math.min((role == 1 || role == 3) ? 2 : 3, Math.ceil(tot / (maxC * 1.1))), prev = s;',
        '  for (var r = 1; r < n; r++) {',
        '    var goal = tot * r / n, bj = -1, bd = 1e9;',
        '    for (q = prev + 1; q < e; q++) if (a[q] == " ") {',
        '      var d = Math.abs(cum[q - s] - goal), ws = q - 1;',
        '      while (ws >= s && a[ws] != " ") ws--;',
        '      if (q - ws - 1 <= 3) d += tot / n * 0.35;',
        '      if (r == n - 1) { var rest = a.slice(q + 1, e).join(""); if (rest.indexOf(" ") < 0 && rest.length <= 4) d += tot; }',
        '      if (d < bd) { bd = d; bj = q; }',
        '    }',
        '    if (bj < 0) break;',
        '    a[bj] = "\\r"; prev = bj;',
        '  }',
        '}',
        'var st = 0;',
        'for (j = 0; j <= a.length; j++) if (j == a.length || a[j] == "\\r") { balPara(st, j); st = j + 1; }',
        'clean = a.join("");',
        // Resalte al centro: interlineado fijo -> el hueco visible entre renglones siempre es el mismo
        'var leadOn = lay == 3 && ranges.length > 0, lineSt = [], lineLd = [];',
        'if (leadOn) {',
        '  var sz0 = cv(@tam@), szB = sz0 * esc, gp = sz0 * 0.22, lsArr = clean.split("\\r"), pos0 = 0, prevBig = false;',
        '  for (i = 0; i < lsArr.length; i++) {',
        '    var big = isB[pos0] === true;',
        '    lineSt.push(pos0);',
        '    lineLd.push(i == 0 ? sz0 * 1.2 : (big ? 0.24 * sz0 + gp + 0.74 * szB : (prevBig ? 0.24 * szB + gp + 0.74 * sz0 : 1.2 * sz0)));',
        '    prevBig = big; pos0 += lsArr[i].length + 1;',
        '  }',
        '}',
        'var size = cv(@tam@), trk = cv(@track@);',
        'var fr = thisComp.layer("FUENTE_REGULAR").text.sourceText.style.font;',
        'var fb = thisComp.layer("FUENTE_BOLD").text.sourceText.style.font;',
        'var cr = col(@colReg@), cb = col(@colBold@);',
        'var words = [], wsI = -1;',
        'for (i = 0; i <= clean.length; i++) {',
        '  var cc = i < clean.length ? clean.charAt(i) : " ";',
        '  if (cc == " " || cc == "\\r") { if (wsI >= 0) { words.push([wsI, i - wsI]); wsI = -1; } }',
        '  else if (wsI < 0) { wsI = i; }',
        '}',
        'var kmode = Math.round(cv(@kar@));',
        'var tms = String(thisComp.layer("TIEMPOS").text.sourceText.value).split(";");',
        'var cur = -1;',
        'if (kmode > 0) for (i = 0; i < words.length && i + woff < tms.length; i++) { var tv = parseFloat(tms[i + woff]); if (!isNaN(tv) && time >= tv) cur = i; }',
        'function styleRange(st, s0, n) {',
        '  var s = st.setText(clean.substr(s0, n)).setFont(fr).setFontSize(size).setTracking(trk).setFillColor(cr);',
        '  var p = 0;',
        '  while (p < n) {',
        '    if (isB[s0 + p]) { var q = p; while (q < n && isB[s0 + q]) q++; s = s.setFont(fb, p, q - p).setFontSize(size * esc, p, q - p).setFillColor(cb, p, q - p); p = q; }',
        '    else p++;',
        '  }',
        '  if (leadOn) {',
        '    try {',
        '      var t2 = s.setAutoLeading(false);',
        '      for (var li = 0; li < lineSt.length; li++) {',
        '        var a0 = Math.max(lineSt[li], s0), a1 = Math.min(li + 1 < lineSt.length ? lineSt[li + 1] : clean.length, s0 + n);',
        '        if (a1 > a0) t2 = t2.setLeading(lineLd[li], a0 - s0, a1 - a0);',
        '      }',
        '      s = t2;',
        '    } catch (eL) {}',
        '  }',
        '  return s;',
        '}'
    ]);
    var ACTIVE = X([
        'var al = Math.round(cv(@align@));',
        'var T = thisComp.layer(al == 1 ? "TEXTO_IZQ" : (al == 3 ? "TEXTO_DER" : "TEXTO_CEN"));'
    ]);
    var FALLBACK = 'String(thisComp.layer("ENTRADA").text.sourceText.value).split("*").join("")';

    function mainTextExpr() {
        return X([
            'try {',
            CORE,
            'var s = styleRange(text.sourceText.style, 0, clean.length);',
            'if (cur >= 0) s = s.setFillColor(col(@colAct@), words[cur][0], words[cur][1]);',
            'var bw = cv(@bordeW@);',
            'if (bw > 0) { try { s = s.setApplyStroke(true).setStrokeWidth(bw).setStrokeColor(col(@colBorde@)); } catch (e2) {} }',
            's;',
            '} catch (err) { ' + FALLBACK + '; }'
        ]);
    }
    function measureExpr(mode) {
        var pick = mode == 1 ? 'styleRange(text.sourceText.style, ls, le - ls)'
                 : mode == 2 ? 'styleRange(text.sourceText.style, ls, w1 - ls)'
                 :             'styleRange(text.sourceText.style, w0, w1 - w0)';
        return [
            'try {',
            CORE,
            'var out = " ";',
            'if (cur >= 0) {',
            '  var w0 = words[cur][0], w1 = w0 + words[cur][1];',
            '  var ls = w0 > 0 ? clean.lastIndexOf("\\r", w0 - 1) + 1 : 0;',
            '  var le = clean.indexOf("\\r", w0); if (le < 0) le = clean.length;',
            '  out = ' + pick + ';',
            '}',
            'out;',
            '} catch (err) { " "; }'
        ].join("\n");
    }
    // calcula p0 / p1 (esquinas de la caja de la palabra activa, en coordenadas de la comp)
    var BOXCALC = X([
        CORE,
        ACTIVE,
        'var p0 = [0, 0], p1 = [0, 0];',
        'if (cur >= 0 && kmode == 1 && !split) {',
        '  var rL = thisComp.layer("MEDIR_LINEA").sourceRectAtTime(time, false);',
        '  var rH = thisComp.layer("MEDIR_HASTA").sourceRectAtTime(time, false);',
        '  var rP = thisComp.layer("MEDIR_PALABRA").sourceRectAtTime(time, false);',
        '  var lineRight = rL.left + rL.width;',
        '  var x1 = rH.left + rH.width, x0 = x1 - rP.width;',
        '  var off = al == 1 ? 0 : (al == 3 ? -lineRight : -lineRight / 2);',
        '  var w0 = words[cur][0];',
        '  var lines = clean.split("\\r"), base = 0, pos = 0, li;',
        '  for (li = 0; li < lines.length; li++) {',
        '    var mx = size;',
        '    for (j = pos; j < pos + lines[li].length; j++) if (isB[j]) mx = Math.max(mx, size * esc);',
        '    if (li > 0) base += leadOn ? lineLd[li] : 1.2 * mx;',
        '    if (w0 < pos + lines[li].length) break;',
        '    pos += lines[li].length + 1;',
        '  }',
        '  var wsz = isB[w0] ? size * esc : size;',
        '  var m = cv(@cajaM@);',
        '  p0 = T.toComp([off + x0 - m, base - wsz * 0.75 - m]);',
        '  p1 = T.toComp([off + x1 + m, base + wsz * 0.22 + m]);',
        '}'
    ]);

    // ---------- construir una composicion ----------
    function build(W, H, compName) {
        var vertical = H > W;
        var comp = app.project.items.addComp(compName, W, H, 1, 30, 30);
        comp.bgColor = [0.25, 0.25, 0.25];

        var ctl = comp.layers.addNull();
        ctl.name = "CONTROLES";
        ctl.enabled = false;
        function fx() { return comp.layer("CONTROLES").property("ADBE Effect Parade"); }
        function slider(k, v) { var e = fx().addProperty("ADBE Slider Control"); e.name = N[k]; fx().property(N[k]).property(1).setValue(v); }
        function color(k, rgb) { var e = fx().addProperty("ADBE Color Control"); e.name = N[k]; fx().property(N[k]).property(1).setValue(rgb); }

        slider("estilo", 1); slider("dis", 1); slider("esc", 100); slider("align", 2);
        slider("retraso", 2); slider("vel", 6);
        slider("tam", vertical ? 85 : 70); slider("posX", 50); slider("posY", vertical ? 68 : 85);
        slider("cpl", vertical ? 18 : 32); slider("track", -40);
        color("colReg", [1, 1, 1]); color("colBold", [1, 1, 1]);
        slider("bordeW", 0); color("colBorde", [0, 0, 0]);
        slider("kar", 0); color("colAct", [1, 1, 1]); color("colCaja", [1, 0.83, 0]); slider("cajaM", 12); slider("cajaR", 14);
        slider("glowI", 0); slider("glowR", 30); slider("sombra", 100);
        slider("fOp", 0); color("fColor", [0, 0, 0]); slider("fMargen", 30); slider("fRed", 20);

        function guideText(name, txt, font, y) {
            var l = comp.layers.addText(txt);
            l.name = name;
            var p = l.property("ADBE Text Properties").property("ADBE Text Document");
            var d = p.value;
            if (font) { try { d.font = font; } catch (eF) {} }
            d.fontSize = 40; d.applyFill = true; d.fillColor = [1, 1, 1];
            d.justification = ParagraphJustification.LEFT_JUSTIFY;
            p.setValue(d);
            l.guideLayer = true;
            l.property("ADBE Transform Group").property("ADBE Opacity").setValue(0);
            l.property("ADBE Transform Group").property("ADBE Position").setValue([40, y]);
            return l;
        }
        guideText("ENTRADA", "viva *la vida loca*", "SegoeUI", 60);
        guideText("TIEMPOS", "0;0.25;0.5;0.75", "SegoeUI", 110);
        guideText("FUENTE_REGULAR", "Regular", "SegoeUI", 160);
        guideText("FUENTE_BOLD", "Bold", "SegoeUI-Bold", 210);
        var mNames = ["MEDIR_LINEA", "MEDIR_HASTA", "MEDIR_PALABRA"];
        for (var mi = 0; mi < 3; mi++) {
            var ml = guideText(mNames[mi], " ", "SegoeUI", 260 + mi * 50);
            ml.property("ADBE Text Properties").property("ADBE Text Document").expression = measureExpr(mi + 1);
        }
        // mide el bold a tamano normal para que en Tipografico crezca hasta llenar el ancho
        var mb = guideText("MEDIR_BOLD", " ", "SegoeUI", 410);
        mb.property("ADBE Text Properties").property("ADBE Text Document").expression =
            'try {\n' + CORE + '\nstyleRange(text.sourceText.style, 0, clean.length);\n} catch (err) { " "; }';

        // ---------- fondo y caja de resalte (debajo del texto) ----------
        function rectLayer(name, sizeExpr, posExpr, roundKey, colorKey, opacityExpr) {
            var sh = comp.layers.addShape();
            sh.name = name;
            sh.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").name = "Caja";
            var g = function () { return comp.layer(name).property("ADBE Root Vectors Group").property("Caja").property("ADBE Vectors Group"); };
            g().addProperty("ADBE Vector Shape - Rect");
            g().addProperty("ADBE Vector Graphic - Fill");
            var rect = g().property("ADBE Vector Shape - Rect");
            rect.property("ADBE Vector Rect Size").expression = sizeExpr;
            rect.property("ADBE Vector Rect Position").expression = posExpr;
            rect.property("ADBE Vector Rect Roundness").expression = X(['thisComp.layer("CONTROLES").effect(@' + roundKey + '@)(1);']);
            var fill = g().property("ADBE Vector Graphic - Fill");
            fill.property("ADBE Vector Fill Color").expression = X(['var q = thisComp.layer("CONTROLES").effect(@' + colorKey + '@)(1);', '[q[0], q[1], q[2], 1];']);
            var tr2 = comp.layer(name).property("ADBE Transform Group");
            tr2.property("ADBE Anchor Point").setValue([0, 0]);
            tr2.property("ADBE Position").setValue([0, 0]);
            tr2.property("ADBE Opacity").expression = opacityExpr;
            return comp.layer(name);
        }
        var fondo = rectLayer("FONDO",
            X(['var c = function (n) { return thisComp.layer("CONTROLES").effect(n); };', 'var cv = function (n) { return c(n)(1); };', ACTIVE,
               'var r = T.sourceRectAtTime(25, false), m = c(@fMargen@)(1);',
               'var p0 = T.toComp([r.left - m, r.top - m]), p1 = T.toComp([r.left + r.width + m, r.top + r.height + m]);',
               '[Math.abs(p1[0] - p0[0]), Math.abs(p1[1] - p0[1])];']),
            X(['var c = function (n) { return thisComp.layer("CONTROLES").effect(n); };', 'var cv = function (n) { return c(n)(1); };', ACTIVE,
               'var r = T.sourceRectAtTime(25, false);',
               'T.toComp([r.left + r.width / 2, r.top + r.height / 2]);']),
            "fRed", "fColor",
            X(['var c = function (n) { return thisComp.layer("CONTROLES").effect(n); };',
               'var d = Math.max(c(@vel@)(1), 1) * thisComp.frameDuration;',
               'c(@fOp@)(1) * ease(time, 0, d, 0, 1);']));
        var caja = rectLayer("RESALTE",
            'try {\n' + BOXCALC + '\n[Math.abs(p1[0] - p0[0]), Math.abs(p1[1] - p0[1])];\n} catch (err) { [0, 0]; }',
            'try {\n' + BOXCALC + '\n[(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];\n} catch (err) { [0, 0]; }',
            "cajaR", "colCaja", "100;");

        // ---------- textos (izquierda, centro, derecha) ----------
        var JUST = [null, ParagraphJustification.LEFT_JUSTIFY, ParagraphJustification.CENTER_JUSTIFY, ParagraphJustification.RIGHT_JUSTIFY];
        for (var t = 0; t < TEXTS.length; t++) {
            var tl = comp.layers.addText("viva la vida loca");
            var lname = TEXTS[t][0], aln = TEXTS[t][1];
            tl.name = lname;
            var src = tl.property("ADBE Text Properties").property("ADBE Text Document");
            var doc = src.value;
            try { doc.font = "SegoeUI"; } catch (eR) {}
            doc.fontSize = 80; doc.applyFill = true; doc.applyStroke = false; doc.fillColor = [1, 1, 1];
            doc.justification = JUST[aln];
            src.setValue(doc);
            src.expression = mainTextExpr();

            var tr = tl.property("ADBE Transform Group");
            var SP = 'var sp = Math.round(c(@dis@)(1)) == 2 && String(thisComp.layer("ENTRADA").text.sourceText.value).indexOf("*") >= 0;';
            tr.property("ADBE Position").expression = X(['var c = function (n) { return thisComp.layer("CONTROLES").effect(n); };', SP,
                'var base = [thisComp.width * c(@posX@)(1) / 100, thisComp.height * c(@posY@)(1) / 100];',
                'if (sp && thisLayer.name != "TEXTO_CEN") {',
                '  var C = thisComp.layer("TEXTO_CEN"), R = C.sourceRectAtTime(25, false), g = c(@tam@)(1) * 0.12;',
                '  base = thisLayer.name == "TEXTO_DER" ? C.toComp([R.left + R.width, R.top]) + [0, -g] : C.toComp([R.left, R.top + R.height]) + [0, g];',
                '}',
                'base;']);
            tr.property("ADBE Anchor Point").expression = X(['var c = function (n) { return thisComp.layer("CONTROLES").effect(n); };', SP,
                'var r = sourceRectAtTime(25, false);',
                '(!sp || thisLayer.name == "TEXTO_CEN") ? [r.left + r.width / 2, r.top + r.height / 2] : (thisLayer.name == "TEXTO_DER" ? [r.left + r.width, r.top + r.height] : [r.left, r.top]);']);
            tr.property("ADBE Opacity").expression = X(['var c = function (n) { return thisComp.layer("CONTROLES").effect(n); };', SP,
                '(sp || Math.round(c(@align@)(1)) == ' + aln + ') ? 100 : 0;']);

            // efectos: sombra + glow
            try {
                comp.layer(lname).property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
                var ds = comp.layer(lname).property("ADBE Effect Parade").property("ADBE Drop Shadow");
                ds.property("ADBE Drop Shadow-0004").setValue(5);
                ds.property("ADBE Drop Shadow-0005").setValue(18);
                ds.property("ADBE Drop Shadow-0002").expression = X(['value * thisComp.layer("CONTROLES").effect(@sombra@)(1) / 100;']);
            } catch (eDs) {}
            try {
                comp.layer(lname).property("ADBE Effect Parade").addProperty("ADBE Glo2");
                var gl = comp.layer(lname).property("ADBE Effect Parade").property("ADBE Glo2");
                gl.property("ADBE Glo2-0003").expression = X(['thisComp.layer("CONTROLES").effect(@glowR@)(1);']);
                gl.property("ADBE Glo2-0004").expression = X(['thisComp.layer("CONTROLES").effect(@glowI@)(1) / 100;']);
            } catch (eGl) {}

            addAnimators(comp, lname);
        }
        // orden: textos arriba, luego caja de resalte, luego fondo
        comp.layer("RESALTE").moveAfter(comp.layer("TEXTO_IZQ"));
        comp.layer("FONDO").moveAfter(comp.layer("RESALTE"));

        // ---------- Grafico esencial (no hace falta cuando el panel trabaja dentro de After Effects) ----------
        if (!$.global.SB_LIB) (function () {
        try { comp.openInEssentialGraphics(); } catch (eO) {}
        comp.motionGraphicsTemplateName = compName;
        function expose(prop, name) {
            try { prop.addToMotionGraphicsTemplateAs(comp, name); }
            catch (e) { try { prop.addToMotionGraphicsTemplate(comp); } catch (e2) {} }
        }
        function txtProp(l) { return comp.layer(l).property("ADBE Text Properties").property("ADBE Text Document"); }
        expose(txtProp("ENTRADA"), N.texto);
        expose(txtProp("FUENTE_REGULAR"), N.fReg);
        expose(txtProp("FUENTE_BOLD"), N.fBold);
        var order = ["estilo", "dis", "esc", "align", "retraso", "vel", "tam", "posX", "posY", "cpl", "track",
                     "colReg", "colBold", "bordeW", "colBorde", "kar", "colAct", "colCaja", "cajaM", "cajaR",
                     "glowI", "glowR", "sombra", "fOp", "fColor", "fMargen", "fRed"];
        for (var o = 0; o < order.length; o++) expose(fx().property(N[order[o]]).property(1), N[order[o]]);
        expose(txtProp("TIEMPOS"), N.tiempos);
        })();

        // reactivar expresiones que AE desactivo al crearlas antes que las capas a las que apuntan
        function enableAll(grp) {
            for (var i = 1; i <= grp.numProperties; i++) {
                var p = grp.property(i);
                if (p.propertyType === PropertyType.PROPERTY) {
                    try {
                        if (p.canSetExpression && p.expression !== "") {
                            var ex = p.expression;
                            p.expression = "";
                            p.expression = ex;
                            p.expressionEnabled = true;
                        }
                    } catch (e) {}
                } else enableAll(p);
            }
        }
        for (var le = 1; le <= comp.numLayers; le++) enableAll(comp.layer(le));
        return comp;
    }

    function addAnimators(comp, lname) {
        function animators() { return comp.layer(lname).property("ADBE Text Properties").property("ADBE Text Animators"); }
        function makeAnimator(name, amountExpr, spec) {
            animators().addProperty("ADBE Text Animator").name = name;
            var i2;
            for (i2 = 0; i2 < spec.length; i2++) animators().property(name).property("ADBE Text Animator Properties").addProperty(spec[i2].m);
            for (i2 = 0; i2 < spec.length; i2++) {
                var p = animators().property(name).property("ADBE Text Animator Properties").property(spec[i2].m);
                if (spec[i2].v !== undefined) p.setValue(spec[i2].v);
                if (spec[i2].x) p.expression = spec[i2].x;
            }
            var sels = animators().property(name).property("ADBE Text Selectors");
            for (var k2 = sels.numProperties; k2 >= 1; k2--) sels.property(k2).remove();
            animators().property(name).property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
            var sel = animators().property(name).property("ADBE Text Selectors").property(1);
            sel.property("ADBE Text Range Type2").setValue(3);
            sel.property("ADBE Text Expressible Amount").expression = 'try {\n' + amountExpr + '\n} catch (err) { [0, 0, 0]; }';
        }
        // la animacion escala cada PALABRA como bloque (si no, el espacio entre letras parece cambiar mientras entra)
        try { comp.layer(lname).property("ADBE Text Properties").property("ADBE Text More Options").property("ADBE Text Anchor Point Option").setValue(2); } catch (eG) {}
        var CD = 'var c = function (n) { return thisComp.layer("CONTROLES").effect(n); };';
        var timing = X([CD,
            'var fd = thisComp.frameDuration;',
            'var stg = c(@retraso@)(1) * fd;',
            'var dur = Math.max(c(@vel@)(1), 1) * fd;',
            'var est = Math.round(c(@estilo@)(1));',
            'if (est == 5) dur = fd;',
            // Tipografico: cada capa sigue la cuenta de palabras donde la dejo la anterior
            'var woff = 0, rw = String(thisComp.layer("ENTRADA").text.sourceText.value);',
            'if (Math.round(c(@dis@)(1)) == 2 && rw.indexOf("*") >= 0 && thisLayer.name != "TEXTO_DER") {',
            '  var cut = thisLayer.name == "TEXTO_CEN" ? rw.indexOf("*") : rw.lastIndexOf("*");',
            '  var pw = rw.substring(0, cut).replace(/\\*/g, " ").replace(/\\s+/g, " ").replace(/^ +| +$/g, "");',
            '  woff = pw ? pw.split(" ").length : 0;',
            '}',
            'var t0 = (textIndex - 1 + woff) * stg;',
            'var x = clamp((time - t0) / dur, 0, 1);']);
        makeAnimator("Entrada Opacidad",
            timing + '\nvar p = 1 - Math.pow(1 - x, 3);\nvar v = 100 * (1 - p);\n[v, v, v];',
            [{ m: "ADBE Text Opacity", v: 0 },
             { m: "ADBE Text Blur", v: [0, 0], x: X([CD, 'Math.round(c(@estilo@)(1)) == 4 ? [30, 30] : [0, 0];']) }]);
        makeAnimator("Entrada Movimiento",
            timing + '\nvar k = 1.70158;\nvar p = 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2);\nvar v = 100 * (1 - p);\n[v, v, v];',
            [{ m: "ADBE Text Position 3D", v: [0, 0, 0],
               x: X([CD, 'var e = Math.round(c(@estilo@)(1)), s = c(@tam@)(1);', 'e == 2 ? [0, s * 0.7, 0] : (e == 6 ? [0, -s * 0.9, 0] : [0, 0, 0]);']) },
             { m: "ADBE Text Scale 3D", v: [100, 100, 100],
               x: X([CD, 'var e = Math.round(c(@estilo@)(1));', 'e == 1 ? [40, 40, 100] : (e == 7 ? [220, 220, 100] : [100, 100, 100]);']) }]);
    }

    function findComp(name) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var it = app.project.item(i);
            if (it instanceof CompItem && it.name == name) return it;
        }
        return null;
    }

    // revisa todas las expresiones (en t = 1 s) y devuelve las que tienen error
    function expressionErrors(comp) {
        var errs = [];
        comp.time = 1;
        function walk(layerName, grp) {
            for (var i = 1; i <= grp.numProperties; i++) {
                var p = grp.property(i);
                if (p.propertyType === PropertyType.PROPERTY) {
                    try { if (p.expressionEnabled && p.expressionError) errs.push(comp.name + " > " + layerName + " > " + p.name + ": " + p.expressionError); } catch (e) {}
                } else walk(layerName, p);
            }
        }
        for (var l = 1; l <= comp.numLayers; l++) walk(comp.layer(l).name, comp.layer(l));
        return errs;
    }

    function exportAll(comps) {
        var dir = new Folder(AUTO ? $.global.SB_OUTDIR : File($.fileName).parent.parent.fsName + "/panel/templates");
        if (!dir.exists) dir.create();
        if (!dir.exists) { var pick = Folder.selectDialog("Elige la carpeta donde guardar los .mogrt"); if (!pick) return; dir = pick; }
        var out = [], fails = [], exprErr = [];
        var names = [];
        for (var n0 = 0; n0 < comps.length; n0++) names.push(comps[n0].name);
        for (var i = 0; i < names.length; i++) {
            var nm = names[i];
            var path = dir.fsName + "\\" + nm + ".mogrt";
            try {
                var cp = findComp(nm);
                exprErr = exprErr.concat(expressionErrors(cp));
                cp.openInViewer();
                try { cp.openInEssentialGraphics(); } catch (eE) {}
                cp.motionGraphicsTemplateName = nm;
                // AE exige el proyecto guardado y sin cambios pendientes para exportar.
                // Guardar invalida las referencias: se vuelve a buscar la composicion.
                if (app.project.file) app.project.save();
                cp = findComp(nm);
                // el segundo argumento es la CARPETA; el archivo toma el nombre de la plantilla
                // se exporta a una carpeta nueva (AE la crea) y luego se copia al destino
                var tmpDir = new Folder(Folder.temp.fsName + "/sbx_" + new Date().getTime() + "_" + i);
                var okX = cp.exportAsMotionGraphicsTemplate(true, tmpDir.fsName);
                var made = null;
                for (var wt = 0; wt < 40 && !made; wt++) {
                    var fl = tmpDir.exists ? tmpDir.getFiles("*.mogrt") : [];
                    for (var q = 0; q < fl.length; q++) if (fl[q] instanceof File) made = fl[q];
                    if (!made) $.sleep(500);
                }
                if (made) {
                    var dest = new File(path);
                    if (dest.exists) dest.remove();
                    made.copy(path);
                }
                if (!new File(path).exists) fails.push(nm + ": no se genero el archivo (export devolvio " + okX + ")");
                else out.push(path);
            } catch (eX) { fails.push(nm + ": " + eX.toString() + " (linea " + eX.line + ")"); }
        }
        if (AUTO) {
            log((fails.length ? "ERROR: " + fails.join(" / ") : "OK " + out.join(" | ")) +
                (exprErr.length ? "\nEXPRESIONES CON ERROR:\n" + exprErr.join("\n") : ""));
            return;
        }
        if (out.length && !fails.length) {
            alert("Listo: plantillas exportadas al plugin.\n\nAhora haz doble clic en CONSTRUIR INSTALADOR.cmd para crear el .exe.");
            return;
        }
        alert((out.length ? "Exportado:\n" + out.join("\n") : "") +
              (fails.length ? "\n\nNo se pudo exportar:\n" + fails.join("\n") +
               "\n(Activa Preferencias > Scripts y expresiones > Permitir que los scripts escriban archivos)" : ""));
    }

    // ---------- modo libreria: el panel dentro de After Effects usa build() directamente ----------
    if ($.global.SB_LIB) { $.global.SB_build = build; $.global.SB_N = N; return; }

    // ---------- inicio ----------
    if (AUTO) {
        try {
            try { app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES); } catch (eC) {}
            app.newProject();
            var autoComps = [];
            for (var ai = 0; ai < COMPS.length; ai++) autoComps.push(build(COMPS[ai][0], COMPS[ai][1], COMPS[ai][2]));
            // AE solo exporta .mogrt de proyectos guardados
            app.project.save(new File(Folder.temp.fsName + "/sb_plantillas.aep"));
            exportAll(autoComps);
        } catch (eA) { log("ERROR: " + eA.toString() + " (linea " + eA.line + ")"); }
        finish();
        return;
    }
    // Modo normal (lo ejecutas tu en After Effects): todo automatico, un solo aviso al final.
    // Trabaja en un proyecto nuevo (AE te pregunta si quieres guardar el que tengas abierto).
    try { app.project.close(CloseOptions.PROMPT_TO_SAVE_CHANGES); } catch (eP) {}
    app.newProject();
    var made = [];
    for (var ci = 0; ci < COMPS.length; ci++) made.push(build(COMPS[ci][0], COMPS[ci][1], COMPS[ci][2]));
    app.project.save(new File(Folder.temp.fsName + "/sb_plantillas.aep"));
    exportAll(made);
})();
