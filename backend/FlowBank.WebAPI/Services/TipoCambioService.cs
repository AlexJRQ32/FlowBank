using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace FlowBank.WebAPI.Services;

public class TipoCambioResult
{
    public decimal? Compra { get; set; }
    public decimal? Venta { get; set; }
    public DateTime? Fecha { get; set; }
}

public class TipoCambioService
{
    private const string CacheKey = "tipocambio_usd_crc";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;

    public TipoCambioService(HttpClient http, IMemoryCache cache)
    {
        _http = http;
        _http.Timeout = TimeSpan.FromSeconds(15);
        _cache = cache;
    }

    public async Task<TipoCambioResult?> ObtenerAsync(CancellationToken ct = default)
    {
        if (_cache.TryGetValue(CacheKey, out TipoCambioResult? cacheado) && cacheado is not null)
            return cacheado;

        var resultado = await ObtenerDeBccrAsync(ct) ?? await ObtenerDeFallbackAsync(ct);

        if (resultado is not null)
            _cache.Set(CacheKey, resultado, CacheDuration);

        return resultado;
    }

    /// <summary>
    /// API JSON oficial del BCCR (SDDE). Primero obtiene un token CSRF y luego
    /// consulta el cuadro de tipo de cambio. Indicador 317 = compra, 318 = venta.
    /// </summary>
    private async Task<TipoCambioResult?> ObtenerDeBccrAsync(CancellationToken ct)
    {
        try
        {
            var tokenResponse = await _http.GetAsync(
                "https://apim.bccr.fi.cr/SDDE/api/Bccr.GE.SDDE.IndicadoresSitioExterno.ServiciosUsuario.API/Token/GenereCSRF",
                ct);
            tokenResponse.EnsureSuccessStatusCode();
            var token = (await tokenResponse.Content.ReadAsStringAsync(ct)).Trim().Trim('"');

            var hoy = DateTime.Today;
            var url = "https://apim.bccr.fi.cr/SDDE/api/Bccr.GE.SDDE.IndicadoresSitioExterno.GrupoVariables.API/" +
                      "CuadroGrupoVariables/ObtenerDatosCuadro" +
                      $"?IdGrupoVariable=1&FechaInicio={hoy:yyyy-MM-dd}T00:00:00&FechaFin={hoy:yyyy-MM-dd}&CantidadSeriesAMostrar=3";

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.TryAddWithoutValidation("token_csrf", token);
            request.Headers.TryAddWithoutValidation("Referer",
                "https://sdd.bccr.fi.cr/es/IndicadoresEconomicos/Inicio/Contenedor/6?Cuadro=1");

            var response = await _http.SendAsync(request, ct);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);

            decimal? compra = null;
            decimal? venta = null;

            if (doc.RootElement.TryGetProperty("indicadoresRaiz", out var indicadores))
            {
                foreach (var indicador in indicadores.EnumerateArray())
                {
                    if (!indicador.TryGetProperty("idIndicador", out var idProp)) continue;
                    if (!indicador.TryGetProperty("series", out var series)) continue;
                    if (!series.TryGetProperty("serie3", out var valorProp)) continue;

                    var valor = ParseValorBccr(valorProp.GetString());
                    if (valor is null) continue;

                    if (idProp.GetInt32() == 317) compra = valor;
                    if (idProp.GetInt32() == 318) venta = valor;
                }
            }

            if (compra is null || venta is null) return null;

            return new TipoCambioResult
            {
                Compra = compra,
                Venta = venta,
                Fecha = hoy,
            };
        }
        catch
        {
            return null;
        }
    }

    private static decimal? ParseValorBccr(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var limpio = raw.Trim().Replace(" ", "").Replace("\u00A0", "");
        return decimal.TryParse(limpio, NumberStyles.Any, new CultureInfo("es-CR"), out var valor)
            ? valor
            : null;
    }

    /// <summary>
    /// Fallback gratuito sin llave cuando la API del BCCR no responde.
    /// </summary>
    private async Task<TipoCambioResult?> ObtenerDeFallbackAsync(CancellationToken ct)
    {
        try
        {
            var response = await _http.GetAsync("https://open.er-api.com/v6/latest/USD", ct);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync(ct);

            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("rates", out var rates)) return null;
            if (!rates.TryGetProperty("CRC", out var crcProp)) return null;

            var tasa = crcProp.GetDecimal();

            return new TipoCambioResult
            {
                Compra = tasa,
                Venta = tasa,
                Fecha = DateTime.Today,
            };
        }
        catch
        {
            return null;
        }
    }
}
