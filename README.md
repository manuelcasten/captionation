# Captionation

**Free animated captions for Premiere Pro and After Effects — with the key word big and centered.**
Made by [Manuel Aldana](https://manuelcasten.github.io) · Download: https://manuelcasten.github.io/captionation.html

- Offline AI transcription with [whisper.cpp](https://github.com/ggml-org/whisper.cpp) — footage never leaves your computer.
- Styles: Classic, Center highlight and Karaoke. 7 entrance animations, glow, shadow, stroke and background.
- Live preview inside the panel, TikTok/Reels safe zone, brand presets you can export to your team.
- Works in **Premiere Pro** (captions as `.mogrt` clips) and **After Effects** (captions as precomps driven by one style comp).
- Interface in English and Spanish.

## Repository layout

| Path | What it is |
|---|---|
| `panel/` | The CEP extension (HTML/JS panel). `index.html` is the whole UI; `i18n.js` translates it to English. |
| `panel/jsx/host.jsx` | Premiere Pro side (ExtendScript): read sequence, export audio, insert and restyle `.mogrt` clips. |
| `panel/jsx/host_ae.jsx` | After Effects side: same functions, builds precomps inside the project. |
| `after-effects/Crear plantilla Subtitulos Bold.jsx` | Generates the caption templates (expressions) and exports the `.mogrt` files. Also used as a library by `host_ae.jsx`. |
| `panel/templates/` | The generated `.mogrt` templates (vertical and horizontal). |
| `installer/` | `construir-instalador.ps1` builds the single-file Windows installer from `Instalador.cs`. |

## Build the installer (Windows)

1. Only when the template changes: run `installer\construir-instalador.ps1 -ForzarPlantillas` with After Effects closed (it opens AE, generates and exports the templates, then closes it).
2. Otherwise double-click `CONSTRUIR INSTALADOR.cmd`. The installer (`Instalador Captionation.exe`) lands in your Downloads folder.

The installer copies the panel to `%APPDATA%\Adobe\CEP\extensions`, enables unsigned CEP panels for the current user and installs Montserrat if missing. No admin rights needed.

## Releasing an update

Bump `SB_VERSION` in `panel/index.html` and the version in `panel/CSXS/manifest.xml`, build, upload the new installer to the website and bump `version.json` there. Panels from 4.2.0 on check that file at startup and show an update banner.

---

## En español

**Subtítulos animados gratis para Premiere Pro y After Effects, con la palabra clave grande al centro.**
Transcripción con IA en tu PC (sin internet), estilos Clásico, Resalte al centro y Karaoke, vista previa en el panel, zona segura de TikTok/Reels y presets de marca. Interfaz en español e inglés.

Para generar el instalador: doble clic en `CONSTRUIR INSTALADOR.cmd` (o `installer\construir-instalador.ps1 -ForzarPlantillas` si cambió la plantilla, con After Effects cerrado).

## License

[MIT](LICENSE) © 2026 Manuel Aldana. Free to use, modify and share — just keep the credit.
