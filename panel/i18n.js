// =====================================================================
//  Captionation - idioma de la interfaz (ES / EN)
//  El panel está escrito en español; en inglés se traduce el texto visible
//  (también lo que aparece después, como mensajes de estado).
//  Nunca toca los subtítulos del usuario, nombres de fuentes ni presets.
// =====================================================================
(function () {
  var KEY = 'sb_lang';
  var lang = 'es';
  try { lang = localStorage.getItem(KEY) || (/^es/i.test(navigator.language) ? 'es' : 'en'); } catch (e) {}

  // selector ES / EN
  var seg = document.getElementById('langSeg');
  if (seg) {
    seg.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-l') === lang);
      b.onclick = function () {
        try { localStorage.setItem(KEY, b.getAttribute('data-l')); } catch (e) {}
        location.reload();
      };
    });
  }
  document.documentElement.lang = lang;
  if (lang !== 'en') return;

  var EX = {
    'Vista previa · clic en un subtítulo de la lista para verlo': 'Preview · click a caption in the list to see it',
    'Vista previa · texto de ejemplo': 'Preview · sample text',
    '0 · Transcribir con IA (Whisper)': '0 · AI transcription (Whisper)',
    'Modelo': 'Model', 'Small (264 MB) · rápido': 'Small (264 MB) · fast',
    'Medium (823 MB) · muy preciso': 'Medium (823 MB) · very accurate',
    'Large v3 Turbo (874 MB) · el más preciso': 'Large v3 Turbo (874 MB) · most accurate',
    'Idioma': 'Language', 'Español': 'Spanish', 'Inglés': 'English', 'Portugués': 'Portuguese', 'Detectar': 'Auto-detect',
    'Máx. caracteres por subtítulo': 'Max. characters per caption',
    'Palabras de marca (para que las escriba bien)': "Brand words (so they're spelled right)",
    'Transcribir secuencia': 'Transcribe sequence', 'Transcribir composición': 'Transcribe composition', 'Cancelar': 'Cancel',
    'Transcribe el audio de la secuencia activa en esta PC (sin internet). La primera vez descarga el motor y el modelo; después ya no.':
      "Transcribes the active sequence's audio on this computer (offline). The first time it downloads the engine and model; never again after that.",
    'Transcribe el audio de la composición activa (o solo el área de trabajo, si la acortaste) en esta PC, sin internet.':
      "Transcribes the active composition's audio (or just the work area, if you trimmed it) on this computer, offline.",
    '1 · Subtítulos': '1 · Captions', 'Cargar .txt / .srt': 'Load .txt / .srt', 'Negritas automáticas': 'Auto highlight',
    'Frase clave (automático)': 'Key phrase (auto)', 'Solo 1 palabra clave': 'Only 1 key word', 'Últimas N palabras': 'Last N words',
    'Todo menos la 1ª palabra': 'All but the 1st word', 'Palabras de mi lista': 'Words from my list', 'Ninguna': 'None',
    'Lista (separada por comas)': 'List (comma-separated)', 'Aplicar regla a todo': 'Apply rule to all', 'MAYÚSCULAS': 'UPPERCASE',
    'Clic en una palabra = bold / regular. Si el archivo trae *asteriscos*, se respetan.': 'Click a word = bold / regular. *Asterisks* in the file are kept.',
    'Corregir subtítulo seleccionado': 'Fix selected caption', 'Guardar': 'Save', '✓ Guardado': '✓ Saved',
    'Lo que va entre *asteriscos* sale resaltado. Enter = guardar. Ctrl+Z en After Effects lo deshace.':
      'Text between *asterisks* is highlighted. Enter = save. Ctrl+Z in After Effects undoes it.',
    '2 · Estilo de edición y marca': '2 · Style & brand', 'Clásico': 'Classic', 'Resalte al centro': 'Center highlight',
    'Fuente regular': 'Regular font', 'Fuente bold': 'Bold font', 'Actualizar lista de fuentes': 'Refresh font list',
    'Preset de marca': 'Brand preset', '— ninguno —': '— none —', 'Borrar': 'Delete',
    'Exportar marcas…': 'Export brands…', 'Importar marcas…': 'Import brands…',
    '3 · Texto y animación': '3 · Text & animation', 'Alineación': 'Alignment', 'Izquierda': 'Left', 'Centro': 'Center', 'Derecha': 'Right',
    'Animación de entrada': 'Entrance animation', 'Pop (escala)': 'Pop (scale)', 'Subir': 'Rise', 'Desenfoque': 'Blur',
    'Máquina de escribir': 'Typewriter', 'Caer desde arriba': 'Drop from above', 'Zoom (desde grande)': 'Zoom (from large)',
    'Retraso entre palabras (frames)': 'Delay between words (frames)', 'Duración de la entrada (frames)': 'Entrance duration (frames)',
    'Tamaño de letra': 'Font size', 'Escala del bold (%)': 'Bold scale (%)', 'Interletrado': 'Tracking',
    'Posición horizontal (%)': 'Horizontal position (%)', 'Posición vertical (%)': 'Vertical position (%)',
    'Respetar zona segura TikTok/Reels (vertical)': 'Keep the TikTok/Reels safe zone (vertical)', 'Caracteres por línea': 'Characters per line',
    '4 · Resaltar la palabra que se dice': '4 · Highlight the spoken word', 'Modo': 'Mode', 'No': 'Off',
    'Caja de color': 'Color box', 'Solo cambiar color': 'Color change only', 'Color de la palabra activa': 'Active word color',
    'Color de la caja': 'Box color', 'Margen de la caja (px)': 'Box padding (px)', 'Redondeo de la caja (px)': 'Box roundness (px)',
    'Por ahora el tiempo de cada palabra se reparte dentro de cada subtítulo. Con la transcripción integrada (próxima versión) será exacto.':
      "Each word's timing comes from the transcription; with a loaded .txt it is spread across the caption.",
    '5 · Colores de marca': '5 · Brand colors', 'Borde (grosor px)': 'Stroke (px)', '+ Muestra': '+ Swatch',
    'Elige un cuadro de color (queda marcado en azul) y haz clic en una muestra. Clic derecho en una muestra = borrarla.':
      'Pick a color box (outlined in blue), then click a swatch. Right-click a swatch to delete it.',
    '6 · Efectos y fondo': '6 · Effects & background', 'Brillo / glow (intensidad %)': 'Glow (intensity %)', 'Brillo / glow (radio)': 'Glow (radius)',
    'Sombra (%)': 'Shadow (%)', 'Opacidad del fondo (%)': 'Background opacity (%)', 'Color del fondo': 'Background color',
    'Margen del fondo (px)': 'Background padding (px)', 'Redondeo del fondo (px)': 'Background roundness (px)',
    'También puedes arrastrar cualquier efecto o preset de Premiere (desenfoque, glow, transiciones…) sobre los clips de subtítulos.':
      'You can also drag any Premiere effect or preset (blur, glow, transitions…) onto the caption clips.',
    '7 · Secuencia': '7 · Sequence', '7 · Composición': '7 · Composition',
    'Leer secuencia activa': 'Read active sequence', 'Leer composición activa': 'Read active composition',
    'Plantilla': 'Template', 'Incluida (automática)': 'Built-in (automatic)', 'Usar otra .mogrt…': 'Use another .mogrt…', 'Usar la incluida': 'Use built-in',
    'Pista de video': 'Video track', 'Los tiempos empiezan en': 'Timing starts at',
    'El inicio de la secuencia': 'Sequence start', 'El cabezal de reproducción': 'Playhead',
    'Insertar subtítulos': 'Insert captions', 'Re-aplicar estilo a la pista': 'Re-apply style to track', 'Aplicar estilo a todos': 'Apply style to all',
    'Descargar': 'Download', '+ Nueva pista arriba': '+ New track on top', 'Incluida (según la secuencia)': 'Built-in (matches the sequence)',
    'Texto corregido.': 'Text fixed.', 'Corrige el texto y pulsa Guardar.': 'Fix the text and press Save.',
    'Primero carga el .txt con los subtítulos.': 'Load the captions .txt first.', 'Aplicando estilo…': 'Applying style…',
    'Buscando fuentes…': 'Looking for fonts…', 'Cancelado': 'Canceled',
    'Nombre (ej. MiMarca)': 'Name (e.g. MyBrand)', 'mimarca, producto, Ana': 'mybrand, product, Ana', 'agua, filtro, mimarca': 'water, filter, mybrand',
    'Selecciona una capa CAP y pulsa el botón de arriba': 'Select a CAP layer and press the button above',
    'Selecciona en la línea de tiempo la capa CAP del subtítulo': "Select the caption's CAP layer in the timeline",
    'Borrar el preset elegido': 'Delete the selected preset',
    'Pega un código: #0A5CFF, 0a5cff, #FFF o rgb(10, 92, 255)': 'Paste a code: #0A5CFF, 0a5cff, #FFF or rgb(10, 92, 255)', 'Guarda el color marcado como muestra': 'Save the selected color as a swatch',
    'Cambia el estilo de todos los subtítulos de la pista elegida, sin tocar el texto': 'Changes the style of every caption on the chosen track, without touching the text',
    'Cambia "Captionation Estilo": todos los subtítulos del proyecto se actualizan': 'Changes "Captionation Estilo": every caption in the project updates'
  };
  // frases dentro de mensajes que cambian (números, nombres…)
  var RX = [
    [/^Vista previa · subtítulo (\d+) de (\d+) \(clic en la lista para cambiar\)$/, 'Preview · caption $1 of $2 (click the list to change)'],
    [/— elegir de la lista/, '— pick from the list'], [/\(no instalada en este PC\)/, '(not installed on this PC)'],
    [/^(\d+) fuentes$/, '$1 fonts'], [/\(vacía\)/, '(empty)'], [/^Incluida \((vertical|horizontal)\)$/, 'Built-in ($1)'],
    [/^Nueva versión (\S+) disponible/, 'New version $1 available'],
    [/^Insertando (\d+) \/ (\d+)…$/, 'Inserting $1 / $2…'],
    [/^Listo: (\d+) subtítulos insertados en (\S+)\./, 'Done: $1 captions inserted on $2.'],
    [/^Estilo aplicado a (\d+) subtítulos de (\S+)\./, 'Style applied to $1 captions on $2.'],
    [/^(\d+) fuentes encontradas\..*$/, '$1 fonts found. Pick them in "Regular font" / "Bold font".'],
    [/^Preset "(.+)" guardado\.$/, 'Preset "$1" saved.'], [/^Preset "(.+)" borrado\.$/, 'Preset "$1" deleted.'],
    [/^Preset "(.+)" cargado\..*$/, 'Preset "$1" loaded. Press "Re-apply style" to update captions already inserted.'],
    [/^Paso 1 de 2 · (Premiere exporta|After Effects renderiza) el audio/, 'Step 1 of 2 · $1 the audio'],
    [/Premiere exporta/, 'Premiere exports'], [/After Effects renderiza/, 'After Effects renders'],
    [/^Paso 2 de 2 · Transcribiendo (.+?) de audio… (\d+)%/, 'Step 2 of 2 · Transcribing $1 of audio… $2%'],
    [/entre entrada y salida/, 'between In and Out'], [/área de trabajo/, 'work area'],
    [/\(archivo temporal, se borra al terminar\)/, '(temporary file, deleted when done)'], [/ faltan ~/, ' ~'], [/ de ~/, ' of ~']
  ];
  // zonas que NO se traducen (texto del usuario)
  var SKIP = '#list, #wLive, #pvStage, #seqName, #txtInfo, #langSeg, #verTxt, .path:not(#mogrtInfo):not(#pvInfo):not(#fontInfo)';

  function trText(s) {
    var t = s.trim(); if (!t) return s;
    if (EX[t] !== undefined) return s.replace(t, EX[t]);
    var out = t;
    for (var i = 0; i < RX.length; i++) out = out.replace(RX[i][0], RX[i][1]);
    return out === t ? s : s.replace(t, out);
  }
  function skip(node) { var el = node.nodeType === 1 ? node : node.parentElement; return !el || !!el.closest(SKIP); }
  function walk(root) {
    if (skip(root)) return;
    if (root.nodeType === 3) { var n = trText(root.nodeValue); if (n !== root.nodeValue) root.nodeValue = n; return; }
    if (root.nodeType !== 1 || root.tagName === 'SCRIPT' || root.tagName === 'STYLE') return;
    ['placeholder', 'title'].forEach(function (a) { var v = root.getAttribute(a); if (v) { var n2 = trText(v); if (n2 !== v) root.setAttribute(a, n2); } });
    for (var c = root.firstChild; c; c = c.nextSibling) walk(c);
  }
  walk(document.body);
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.type === 'characterData') walk(m.target);
      else m.addedNodes.forEach(walk);
    });
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
})();
