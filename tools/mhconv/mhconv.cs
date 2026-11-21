// Marly Helper: тихий конвертер ресурсов GTA V <-> XML на базе CodeWalker.Core (без окон).
// export <in> <entryName> <out.xml>   : in = файл как сохраняет RPF Explorer (у ресурса впереди 16 байт RSC7)
// import <in.xml> <entryName> <out>    : entryName = имя итогового файла (например core.ypt); out = готовый файл (RSC7 + данные)
using System;
using System.IO;
using System.Xml;
using CodeWalker.GameFiles;

static class P
{
    static int Main(string[] a)
    {
        try
        {
            if (a.Length < 4) { Console.Error.WriteLine("usage"); return 2; }
            try
            {
                string sf = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "strings.txt");
                if (File.Exists(sf)) foreach (string ln in File.ReadAllLines(sf)) { string t = ln.Trim(); if (t.Length > 0) JenkIndex.Ensure(t); }
            }
            catch (Exception) { /* словарь имён не обязателен */ }
            string name = Path.GetFileName(a[2]);
            if (a[0] == "export")
            {
                byte[] raw = File.ReadAllBytes(a[1]), data = raw;
                RpfFileEntry e;
                if (raw.Length >= 16 && BitConverter.ToUInt32(raw, 0) == 0x37435352u)
                {
                    var re = new RpfResourceFileEntry();
                    re.SystemFlags = new RpfResourcePageFlags(BitConverter.ToUInt32(raw, 8));
                    re.GraphicsFlags = new RpfResourcePageFlags(BitConverter.ToUInt32(raw, 12));
                    data = new byte[raw.Length - 16]; Buffer.BlockCopy(raw, 16, data, 0, data.Length);
                    e = re;
                }
                else e = new RpfBinaryFileEntry();
                e.Name = name; e.NameLower = name.ToLowerInvariant();
                string newName;
                string xml = MetaXml.GetXml(e, data, out newName, Path.GetDirectoryName(Path.GetFullPath(a[3])));
                if (string.IsNullOrEmpty(xml)) { Console.Error.WriteLine("unsupported"); return 3; }
                File.WriteAllText(a[3], xml, new System.Text.UTF8Encoding(false));
                Console.WriteLine(newName ?? "");
                return 0;
            }
            if (a[0] == "import")
            {
                var doc = new XmlDocument();
                doc.Load(a[1]);
                int trim = 0;
                MetaFormat fmt = XmlMeta.GetXMLFormat(name + ".xml", out trim);
                if (fmt == MetaFormat.XML) { Console.Error.WriteLine("unsupported"); return 3; }
                byte[] bytes = XmlMeta.GetData(doc, fmt, name);
                if (bytes == null || bytes.Length == 0) { Console.Error.WriteLine("failed"); return 4; }
                // Выход в том же виде, что отдаёт RPF Explorer: 16 байт RSC7 + РАСПАКОВАННЫЕ данные (сжатие делает сам проводник).
                if (bytes.Length > 16 && BitConverter.ToUInt32(bytes, 0) == 0x37435352u)
                {
                    byte[] body = new byte[bytes.Length - 16]; Buffer.BlockCopy(bytes, 16, body, 0, body.Length);
                    byte[] dec = ResourceBuilder.Decompress(body);
                    byte[] res = new byte[16 + dec.Length]; Buffer.BlockCopy(bytes, 0, res, 0, 16); Buffer.BlockCopy(dec, 0, res, 16, dec.Length);
                    bytes = res;
                }
                File.WriteAllBytes(a[3], bytes);
                return 0;
            }
            Console.Error.WriteLine("usage"); return 2;
        }
        catch (Exception ex) { Console.Error.WriteLine("error: " + ex.GetType().Name + ": " + ex.Message); return 1; }
    }
}
