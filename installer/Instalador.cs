// Instalador de Captionation. El .zip con el panel y las fuentes va como recurso interno del .exe
// (antes iba pegado al final del archivo, y eso hacia que algunos antivirus lo marcaran por error).
using System;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: AssemblyTitle("Instalador de Captionation")]
[assembly: AssemblyDescription("Instala el panel gratuito Captionation para Premiere Pro y After Effects")]
[assembly: AssemblyCompany("Manuel Aldana")]
[assembly: AssemblyProduct("Captionation")]
[assembly: AssemblyCopyright("(c) 2026 Manuel Aldana - MIT - manuelcasten.github.io")]
[assembly: AssemblyVersion("4.3.0.0")]
[assembly: AssemblyFileVersion("4.3.0.0")]
[assembly: AssemblyInformationalVersion("4.3.0")]

static class Instalador
{
    [DllImport("gdi32.dll", CharSet = CharSet.Unicode)]
    static extern int AddFontResource(string lpFileName);

    const string Titulo = "Captionation";

    [STAThread]
    static void Main()
    {
        if (MessageBox.Show(
                "Se va a instalar el panel Captionation para Premiere Pro y After Effects.\n\nCierra Premiere Pro y After Effects antes de continuar.",
                Titulo, MessageBoxButtons.OKCancel, MessageBoxIcon.Information) != DialogResult.OK) return;

        string tmp = Path.Combine(Path.GetTempPath(), "captionation_" + Guid.NewGuid().ToString("N"));
        try
        {
            // 1) descomprimir los archivos que van dentro del instalador
            string data = Path.Combine(tmp, "data");
            Directory.CreateDirectory(data);
            using (Stream s = Assembly.GetExecutingAssembly().GetManifestResourceStream("data.zip"))
            {
                if (s == null) throw new Exception("El instalador esta danado (no encuentro los archivos).");
                using (var z = new ZipArchive(s, ZipArchiveMode.Read)) z.ExtractToDirectory(data);
            }

            // 2) permitir paneles CEP propios (por usuario)
            for (int v = 9; v <= 14; v++)
                using (var k = Registry.CurrentUser.CreateSubKey(@"Software\Adobe\CSXS." + v))
                    k.SetValue("PlayerDebugMode", "1", RegistryValueKind.String);

            // 3) copiar el panel
            string dest = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"Adobe\CEP\extensions\SubtitulosBold");
            if (Directory.Exists(dest)) Directory.Delete(dest, true);
            CopyDir(Path.Combine(data, "panel"), dest);

            // 4) fuentes Montserrat (por usuario, si faltan)
            string fontsSrc = Path.Combine(data, "fonts");
            int nf = 0;
            if (Directory.Exists(fontsSrc))
            {
                string winFonts = Environment.GetFolderPath(Environment.SpecialFolder.Fonts);
                string userFonts = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Windows\Fonts");
                Directory.CreateDirectory(userFonts);
                foreach (string f in Directory.GetFiles(fontsSrc, "*.ttf"))
                {
                    string name = Path.GetFileName(f);
                    if (File.Exists(Path.Combine(winFonts, name)) || File.Exists(Path.Combine(userFonts, name))) continue;
                    string target = Path.Combine(userFonts, name);
                    File.Copy(f, target, true);
                    using (var k = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows NT\CurrentVersion\Fonts"))
                        k.SetValue(Path.GetFileNameWithoutExtension(f) + " (TrueType)", target, RegistryValueKind.String);
                    AddFontResource(target);
                    nf++;
                }
            }

            MessageBox.Show(
                "Listo, Captionation quedo instalado." + (nf > 0 ? "\n(Se instalaron " + nf + " fuentes Montserrat.)" : "") +
                "\n\nAbre Premiere Pro o After Effects y ve a:\nVentana > Extensiones > Captionation",
                Titulo, MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
        catch (Exception ex)
        {
            MessageBox.Show("No se pudo instalar:\n\n" + ex.Message + "\n\nSi Premiere esta abierto, cierralo e intenta de nuevo.",
                Titulo, MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            try { if (Directory.Exists(tmp)) Directory.Delete(tmp, true); } catch { }
        }
    }

    static void CopyDir(string src, string dst)
    {
        Directory.CreateDirectory(dst);
        foreach (string f in Directory.GetFiles(src)) File.Copy(f, Path.Combine(dst, Path.GetFileName(f)), true);
        foreach (string d in Directory.GetDirectories(src)) CopyDir(d, Path.Combine(dst, Path.GetFileName(d)));
    }
}
