// Instalador de Subtitulos Bold. El .zip con el panel y las fuentes va pegado al final del .exe.
using System;
using System.IO;
using System.IO.Compression;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using Microsoft.Win32;

static class Instalador
{
    [DllImport("gdi32.dll", CharSet = CharSet.Unicode)]
    static extern int AddFontResource(string lpFileName);

    const string Titulo = "Captionation";

    [STAThread]
    static void Main()
    {
        if (MessageBox.Show(
                "Se va a instalar el panel Captionation para Premiere Pro.\n\nCierra Premiere Pro antes de continuar.",
                Titulo, MessageBoxButtons.OKCancel, MessageBoxIcon.Information) != DialogResult.OK) return;

        string tmp = Path.Combine(Path.GetTempPath(), "sb_install_" + Guid.NewGuid().ToString("N"));
        try
        {
            // 1) sacar el zip pegado al final del exe
            string self = Application.ExecutablePath;
            byte[] all = File.ReadAllBytes(self);
            long zipLen = BitConverter.ToInt64(all, all.Length - 8);
            if (zipLen <= 0 || zipLen > all.Length - 8) throw new Exception("El instalador esta danado (no encuentro los archivos).");
            Directory.CreateDirectory(tmp);
            string zipPath = Path.Combine(tmp, "data.zip");
            using (var fs = File.Create(zipPath)) fs.Write(all, (int)(all.Length - 8 - zipLen), (int)zipLen);
            string data = Path.Combine(tmp, "data");
            ZipFile.ExtractToDirectory(zipPath, data);

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
                "\n\nAbre Premiere Pro y ve a:\nVentana > Extensiones > Captionation",
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
