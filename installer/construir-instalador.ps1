# Construye "Instalador Subtitulos Bold.exe" con UN clic (doble clic en "CONSTRUIR INSTALADOR.cmd").
#  1) Si hace falta, abre After Effects solo, genera las plantillas, las exporta y lo cierra.
#  2) Activa la edicion de fuentes dentro de los .mogrt (sin pasos manuales).
#  3) Compila el instalador (compilador C# que ya trae Windows) con panel + plantillas.
param(
    [string]$Out = (Join-Path $env:USERPROFILE 'Downloads\Instalador Captionation.exe'),
    [switch]$ForzarPlantillas
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$root  = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$panel = Join-Path $root 'panel'
$tpl   = Join-Path $panel 'templates'
$aeScript = Join-Path $root 'after-effects\Crear plantilla Subtitulos Bold.jsx'
$mogrts = @('Subtitulos Bold Vertical.mogrt', 'Subtitulos Bold Horizontal.mogrt') | ForEach-Object { Join-Path $tpl $_ }

# el panel dentro de After Effects usa el mismo generador de plantillas (modo libreria)
Copy-Item $aeScript (Join-Path $panel 'jsx\plantilla_ae.jsx') -Force

function Paso($t) { Write-Host ""; Write-Host "== $t" -ForegroundColor Cyan }

# ---------------------------------------------------------------- 1) plantillas
# Las plantillas se generan desde After Effects (Archivo > Scripts > Ejecutar archivo de script).
# -ForzarPlantillas intenta hacerlo solo, pero necesita tener la ventana de AE activa (no uses el PC mientras tanto).
$need = [bool]$ForzarPlantillas
if (-not $need -and ($mogrts | Where-Object { -not (Test-Path $_) })) {
    throw ("Faltan las plantillas.`n`nEn After Effects: Archivo > Scripts > Ejecutar archivo de script... y elige`n" +
           "  $aeScript`n`nCuando diga 'Listo', vuelve a ejecutar CONSTRUIR INSTALADOR.")
}
if ($need) {
    Paso "Generando plantillas en After Effects (se abre y se cierra solo, 1-3 minutos)"
    $ae = Get-ChildItem 'C:\Program Files\Adobe\Adobe After Effects *\Support Files\AfterFX.exe' -ErrorAction SilentlyContinue |
          Sort-Object { $_.Directory.Parent.Name } | Select-Object -Last 1
    if (-not $ae) { throw "No encontre After Effects instalado." }
    if (Get-Process AfterFX -ErrorAction SilentlyContinue) { throw "After Effects esta abierto. Cierralo y vuelve a ejecutar CONSTRUIR INSTALADOR." }

    # permitir que los scripts escriban archivos (necesario para exportar los .mogrt)
    $prefDir = Get-ChildItem (Join-Path $env:APPDATA 'Adobe\After Effects') -Directory -ErrorAction SilentlyContinue |
               Where-Object { $_.Name -match '^\d+\.\d+' } | Sort-Object { [version]$_.Name } | Select-Object -Last 1
    if ($prefDir) {
        $pf = Get-ChildItem $prefDir.FullName -File | Where-Object { $_.Name -match "After Effects $([regex]::Escape($prefDir.Name))( Prefs)?\.txt$" } | Select-Object -First 1
        if ($pf) {
            $txt = [IO.File]::ReadAllText($pf.FullName)
            if ($txt -match '"Pref_SCRIPTING_FILE_NETWORK_SECURITY" = "?0') {
                $txt = $txt -replace '"Pref_SCRIPTING_FILE_NETWORK_SECURITY" = [^\r\n]*', '"Pref_SCRIPTING_FILE_NETWORK_SECURITY" = "1"'
                [IO.File]::WriteAllText($pf.FullName, $txt)
            } elseif ($txt -notmatch 'Pref_SCRIPTING_FILE_NETWORK_SECURITY') {
                $txt = $txt -replace '(\["Main Pref Section v2"\]\r?\n)', "`$1`t`"Pref_SCRIPTING_FILE_NETWORK_SECURITY`" = `"1`"`r`n"
                [IO.File]::WriteAllText($pf.FullName, $txt)
            }
        }
    }

    New-Item -ItemType Directory -Force $tpl | Out-Null
    $mogrts | ForEach-Object { Remove-Item $_ -ErrorAction SilentlyContinue }
    $result = Join-Path $tpl 'sb_resultado.txt'
    Remove-Item $result -ErrorAction SilentlyContinue

    $fwd = { param($p) $p -replace '\\', '/' }
    $wrapper = Join-Path $env:TEMP 'sb_auto.jsx'
    $w = '$.global.SB_AUTO = true; $.global.SB_QUIT = true; $.global.SB_OUTDIR = "' + (& $fwd $tpl) + '";' + "`r`n" +
         '$.evalFile(new File("' + (& $fwd $aeScript) + '"));'
    [IO.File]::WriteAllText($wrapper, $w, [Text.Encoding]::ASCII)

    # 1) abrir After Effects normal y esperar a que cargue su ventana
    $aeDir = $ae.DirectoryName
    Start-Process -FilePath $ae.FullName -WorkingDirectory $aeDir | Out-Null
    $limit = (Get-Date).AddMinutes(4)
    do { Start-Sleep -Seconds 3; $p = Get-Process AfterFX -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle } | Select-Object -First 1 }
    while (-not $p -and (Get-Date) -lt $limit)
    if (-not $p) { throw "After Effects no termino de abrir." }
    Start-Sleep -Seconds 8
    Write-Host "After Effects abierto. Generando y exportando (no uses After Effects mientras tanto)..."

    # 2) enviarle el script y mantener su ventana activa (AE solo exporta con la ventana activa)
    $shell = New-Object -ComObject WScript.Shell
    $null = $shell.AppActivate($p.Id)
    & $ae.FullName -s ('$.evalFile(new File("' + (& $fwd $wrapper) + '"))')
    $limit = (Get-Date).AddMinutes(10)
    while (-not (Test-Path $result) -and (Get-Date) -lt $limit) {
        $null = $shell.AppActivate($p.Id)
        Start-Sleep -Seconds 3
    }
    if (-not (Test-Path $result)) { throw "After Effects no termino de generar las plantillas (revisa si mostro algun mensaje)." }
    Start-Sleep -Seconds 1
    $res = [IO.File]::ReadAllText($result)
    Remove-Item $result -ErrorAction SilentlyContinue
    # cerrar After Effects (el script ya cerro el proyecto sin guardar)
    $limit = (Get-Date).AddSeconds(15)
    while ((Get-Process AfterFX -ErrorAction SilentlyContinue) -and (Get-Date) -lt $limit) { $null = $shell.AppActivate($p.Id); Start-Sleep -Seconds 2 }
    Get-Process AfterFX -ErrorAction SilentlyContinue | ForEach-Object { $null = $_.CloseMainWindow() }
    Start-Sleep -Seconds 5
    Get-Process AfterFX -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host $res
    if ($res -notmatch '^OK') { throw "After Effects reporto un problema (ver arriba)." }
    if ($res -match 'EXPRESIONES CON ERROR') { Write-Warning "Hay expresiones con error (ver arriba)." }
    Write-Host "Plantillas exportadas."
} else {
    Paso "Plantillas al dia (no hace falta abrir After Effects)"
}

# ---------------------------------------------------------------- 2) permitir cambiar fuente (dentro del .mogrt)
# En definition.json cada control de texto trae "fonteditinfo":{"capPropFontEdit":false,...}.
# Se cambia a true SOLO en "Fuente regular" y "Fuente bold", editando el texto (no se reescribe el resto del JSON).
Paso "Activando cambio de fuente en las plantillas"
$rx = '"capPropFontEdit":false(?=[^{}]*\},"id":"[^"]+","type":6,"uiName":\{"strDB":\[\{"localeString":"[^"]+","str":"Fuente (regular|bold)")'
foreach ($m in $mogrts) {
    if (-not (Test-Path $m)) { Write-Warning "Falta $m"; continue }
    $zip = [IO.Compression.ZipFile]::Open($m, 'Update')
    try {
        $entry = $zip.Entries | Where-Object { $_.FullName -eq 'definition.json' } | Select-Object -First 1
        if (-not $entry) { Write-Warning "$([IO.Path]::GetFileName($m)): no tiene definition.json"; continue }
        $sr = New-Object IO.StreamReader($entry.Open()); $json = $sr.ReadToEnd(); $sr.Close()
        $n = ([regex]::Matches($json, $rx)).Count
        $new = [regex]::Replace($json, $rx, '"capPropFontEdit":true')
        # los sliders salen de AE con rango 0-100: Premiere recorta 170% de escala bold, interletrado negativo, etc.
        # se pone a cada uno un rango real (asi en Premiere siguen siendo deslizadores utiles)
        $rangos = @(('Escala bold',50,600),('Tama',10,300),('Interletrado',-200,400),('Posici',0,100),('Caracteres',5,60),
                    ('Retraso',0,30),('Velocidad',1,60),('Estilo',1,7),('Dise',1,3),('Alineaci',1,3),('Resaltar',0,2),
                    ('Borde',0,50),('Caja margen',0,100),('Caja redondeo',0,100),('Brillo intensidad',0,300),('Brillo radio',0,200),
                    ('Sombra',0,200),('Fondo opacidad',0,100),('Fondo margen',0,200),('Fondo redondeo',0,200))
        $new = [regex]::Replace($new, '"max":-?[\d.]+,"min":-?[\d.]+(,"type":2,"uiName":\{"strDB":\[\{"localeString":"[^"]+","str":")([^"]+)"', {
            param($m)
            $r = $rangos | Where-Object { $m.Groups[2].Value.StartsWith($_[0]) } | Select-Object -First 1
            if (-not $r) { $r = @('', 0, 1000) }
            '"max":' + $r[2] + ',"min":' + $r[1] + $m.Groups[1].Value + $m.Groups[2].Value + '"'
        })
        # el limite que de verdad usa el motor de render (capsule params) tambien sale 0-100
        $new = [regex]::Replace($new, '"capPropMax":-?[\d.]+,"capPropMin":-?[\d.]+(,"capPropType":1,"capPropUIName":")([^"]+)"', {
            param($m)
            $r = $rangos | Where-Object { $m.Groups[2].Value.StartsWith($_[0]) } | Select-Object -First 1
            if (-not $r) { $r = @('', 0, 1000) }
            '"capPropMax":' + $r[2] + ',"capPropMin":' + $r[1] + $m.Groups[1].Value + $m.Groups[2].Value + '"'
        })
        if ($new -ne $json) {
            $entry.Delete()
            $ne = $zip.CreateEntry('definition.json')
            $sw = New-Object IO.StreamWriter($ne.Open(), (New-Object Text.UTF8Encoding($false)))
            $sw.Write($new); $sw.Close()
        }
        $ok = ([regex]::Matches($new, '"capPropFontEdit":true')).Count
        Write-Host ("{0}: {1} controles de fuente activados ({2} en total)" -f [IO.Path]::GetFileName($m), $n, $ok)
    } finally { $zip.Dispose() }
}

# ---------------------------------------------------------------- 3) instalador
Paso "Compilando el instalador"
$stage = Join-Path $env:TEMP 'sb_build'
if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
New-Item -ItemType Directory -Path "$stage\data\fonts" | Out-Null
Copy-Item $panel "$stage\data\panel" -Recurse
Get-ChildItem "$stage\data\panel\templates" -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -ne '.mogrt' } | Remove-Item
$zipPath = Join-Path $stage 'data.zip'
[IO.Compression.ZipFile]::CreateFromDirectory("$stage\data", $zipPath)

$exe = Join-Path $stage 'setup.exe'
$cs = Get-Content (Join-Path $root 'installer\Instalador.cs') -Raw -Encoding UTF8
Add-Type -TypeDefinition $cs -OutputAssembly $exe -OutputType WindowsApplication `
    -ReferencedAssemblies 'System.Windows.Forms', 'System.IO.Compression', 'System.IO.Compression.FileSystem'

$zb = [IO.File]::ReadAllBytes($zipPath)
$fs = [IO.File]::Open($exe, 'Append')
$fs.Write($zb, 0, $zb.Length)
$fs.Write([BitConverter]::GetBytes([long]$zb.Length), 0, 8)
$fs.Close()

Copy-Item $exe $Out -Force
Write-Host ""
Write-Host ("LISTO: {0}  ({1:N1} MB)" -f $Out, ((Get-Item $Out).Length / 1MB)) -ForegroundColor Green
Write-Host "Ese .exe es lo unico que necesitan tus disenadores."
