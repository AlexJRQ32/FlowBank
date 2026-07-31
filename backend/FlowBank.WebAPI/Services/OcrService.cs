using System.Globalization;
using System.Text.RegularExpressions;
using Tesseract;

namespace FlowBank.WebAPI.Services;

public class OcrResult
{
    public decimal MontoTotal { get; set; }
    public DateTime? FechaCompra { get; set; }
    public string Comercio { get; set; } = string.Empty;
    public string TextoCompleto { get; set; } = string.Empty;
}

public class OcrService
{
    private readonly string _tessDataPath;
    private readonly IWebHostEnvironment _env;

    public OcrService(IWebHostEnvironment env)
    {
        _env = env;
        _tessDataPath = Path.Combine(AppContext.BaseDirectory, "tessdata");
    }

    public async Task<OcrResult> ExtractAsync(byte[] imagenBytes)
    {
        var texto = await Task.Run(() =>
        {
            using var engine = new TesseractEngine(_tessDataPath, "spa", EngineMode.Default);
            using var pix = Pix.LoadFromMemory(imagenBytes);
            using var page = engine.Process(pix);
            return page.GetText();
        });

        return new OcrResult
        {
            MontoTotal = ExtraerMonto(texto),
            FechaCompra = ExtraerFecha(texto),
            Comercio = ExtraerComercio(texto),
            TextoCompleto = texto,
        };
    }

    private static decimal ExtraerMonto(string texto)
    {
        // Patrones de factura ticos: "TOTAL: ₡ 12 345.67", "Total a pagar ₡12,345.67", "MONTO TOTAL"
        var patrones = new[]
        {
            @"(?:TOTAL|MONTO\s+TOTAL|TOTAL\s+A\s+PAGAR|TOTAL\s+PAGAR)[\s:]*₡?\s*([0-9][0-9\s.,]*)",
            @"([0-9][0-9\s.,]*)\s*(?:colones|CRC)",
        };

        foreach (var patron in patrones)
        {
            var match = Regex.Match(texto, patron, RegexOptions.IgnoreCase | RegexOptions.Multiline);
            if (match.Success && TryParseMonto(match.Groups[1].Value, out var monto))
                return monto;
        }

        // Fallback: ultimo numero con decimales (ej: 6550.00, 12.345,67)
        var todos = Regex.Matches(texto, @"\b[0-9]{1,3}(?:[.\s][0-9]{3})+(?:[.,][0-9]{2})\b");
        if (todos.Count > 0)
        {
            foreach (Match m in todos)
            {
                if (TryParseMonto(m.Value, out var monto))
                    return monto;
            }
        }

        // Fallback final: ultimo numero con 2 decimales y magnitud razonable
        var numeros = Regex.Matches(texto, @"\b[0-9][0-9.,\s]*[0-9](?:[.,][0-9]{2})\b");
        decimal ultimo = 0;
        foreach (Match m in numeros)
        {
            if (TryParseMonto(m.Value, out var monto) && monto > ultimo)
                ultimo = monto;
        }
        if (ultimo > 0)
            return ultimo;

        return 0;
    }

    private static bool TryParseMonto(string raw, out decimal monto)
    {
        monto = 0;
        var limpio = raw.Trim().Replace(" ", "");

        if (limpio.Contains('.') && limpio.Contains(','))
        {
            // 12,345.67 o 12.345,67
            if (limpio.IndexOf('.') > limpio.IndexOf(','))
            {
                limpio = limpio.Replace(",", ""); // 12.345,67 -> 12345,67
                limpio = limpio.Replace(".", ""); // quitar separador miles
            }
            else
            {
                limpio = limpio.Replace(".", "");
            }
        }

        var culture = CultureInfo.InvariantCulture;
        return decimal.TryParse(limpio, NumberStyles.Any, culture, out monto);
    }

    private static DateTime? ExtraerFecha(string texto)
    {
        // dd/mm/yyyy, dd-mm-yyyy, dd/mm/yy
        var patrones = new[]
        {
            @"\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b",
            @"\b(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})\b",
        };

        foreach (var patron in patrones)
        {
            var match = Regex.Match(texto, patron, RegexOptions.IgnoreCase);
            if (!match.Success) continue;

            if (match.Groups.Count >= 4 && int.TryParse(match.Groups[3].Value, out var anio))
            {
                var mes = 0;
                var dia = 0;

                if (int.TryParse(match.Groups[1].Value, out var d1) &&
                    int.TryParse(match.Groups[2].Value, out var d2))
                {
                    // Numerico: interpretar dd/mm/yyyy
                    dia = d1;
                    mes = d2;
                }

                if (dia > 0 && mes > 0 && mes <= 12 && dia <= 31 && anio > 1900)
                    return new DateTime(anio, mes, dia);
            }
        }

        return null;
    }

    private static string ExtraerComercio(string texto)
    {
        // Buscar nombres de comercio tipicos en encabezados de factura
        var lineas = texto.Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Select(l => l.Trim())
            .Where(l => l.Length > 2)
            .ToList();

        // La primera linea con letras suele ser el nombre del comercio
        var primera = lineas.FirstOrDefault(l => l.Any(char.IsLetter) && l.Length > 3);
        if (primera is not null)
        {
            // Limpiar numeros sueltos y simbolos raros
            var limpio = Regex.Replace(primera, @"[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9&\s'.-]", "");
            limpio = limpio.Trim(' ', '.', '-');
            if (limpio.Length > 1 && limpio.Length <= 60)
                return limpio;
        }

        return string.Empty;
    }
}
