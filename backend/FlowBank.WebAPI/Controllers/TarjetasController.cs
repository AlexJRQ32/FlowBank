using System.Security.Claims;
using FlowBank.Core.Entities;
using FlowBank.Data.Repositories;
using FlowBank.WebAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlowBank.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TarjetasController : ControllerBase
{
    private readonly IRepository<Tarjeta> _repository;
    private readonly IRepository<Factura> _facturas;
    private readonly TipoCambioService _tipoCambio;

    public TarjetasController(
        IRepository<Tarjeta> repository,
        IRepository<Factura> facturas,
        TipoCambioService tipoCambio)
    {
        _repository = repository;
        _facturas = facturas;
        _tipoCambio = tipoCambio;
    }

    private int GetUsuarioId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUsuarioId();
        var tarjetas = (await _repository.GetAllAsync())
            .Where(t => t.UsuarioId == userId)
            .OrderByDescending(t => t.FechaCreacion)
            .ToList();

        var facturas = await _facturas.GetAllAsync();
        var facturasDelUsuario = facturas
            .Where(f => f.TarjetaId.HasValue && f.UsuarioId == userId)
            .ToList();

        var tipoCambio = await _tipoCambio.ObtenerAsync();

        var resultado = tarjetas.Select(t =>
        {
            var facturasDeTarjeta = facturasDelUsuario.Where(f => f.TarjetaId == t.Id);
            var (deudaUsd, deudaCrc) = CalcularDeudaReal(facturasDeTarjeta);
            var deudaUsdCombinada = ConvertirColonesAUsd(deudaUsd, deudaCrc, tipoCambio);
            var (limiteUsd, limiteColones) = CalcularLimiteDisponible(t.LimiteCredito, deudaUsdCombinada, tipoCambio);
            return new
            {
                t.Id,
                t.UsuarioId,
                t.BancoId,
                t.Nombre,
                t.UltimosCuatroDigitos,
                t.Tipo,
                t.DiaCorte,
                t.DiaPago,
                t.LimiteCredito,
                LimiteCreditoColones = ConvertirUsdAColones(t.LimiteCredito, tipoCambio),
                LimiteDisponibleUsd = limiteUsd,
                LimiteDisponibleColones = limiteColones,
                t.SaldoActual,
                TotalAdeudado = deudaCrc,
                TotalAdeudadoUsd = deudaUsd,
                TotalAdeudadoColones = deudaCrc,
                t.Nota,
                t.EsActiva,
                t.FechaCreacion,
            };
        });

        return Ok(resultado);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = GetUsuarioId();
        var tarjeta = await _repository.GetByIdAsync(id);
        if (tarjeta is null || tarjeta.UsuarioId != userId) return NotFound();

        var facturas = await _facturas.GetAllAsync();
        var facturasDeTarjeta = facturas
            .Where(f => f.TarjetaId == id && f.UsuarioId == userId)
            .ToList();

        var tipoCambio = await _tipoCambio.ObtenerAsync();
        var (deudaUsd, deudaCrc) = CalcularDeudaReal(facturasDeTarjeta);
        var deudaUsdCombinada = ConvertirColonesAUsd(deudaUsd, deudaCrc, tipoCambio);
        var (limiteUsd, limiteColones) = CalcularLimiteDisponible(tarjeta.LimiteCredito, deudaUsdCombinada, tipoCambio);

        return Ok(new
        {
            tarjeta.Id,
            tarjeta.UsuarioId,
            tarjeta.BancoId,
            tarjeta.Nombre,
            tarjeta.UltimosCuatroDigitos,
            tarjeta.Tipo,
            tarjeta.DiaCorte,
            tarjeta.DiaPago,
            tarjeta.LimiteCredito,
            LimiteCreditoColones = ConvertirUsdAColones(tarjeta.LimiteCredito, tipoCambio),
            LimiteDisponibleUsd = limiteUsd,
            LimiteDisponibleColones = limiteColones,
            tarjeta.SaldoActual,
            TotalAdeudado = deudaCrc,
            TotalAdeudadoUsd = deudaUsd,
            TotalAdeudadoColones = deudaCrc,
            tarjeta.Nota,
            tarjeta.EsActiva,
            tarjeta.FechaCreacion,
        });
    }

    /// <summary>
    /// Suma real de facturas en su moneda original (sin conversión):
    /// deuda en dólares = suma de facturas USD; deuda en colones = suma de facturas CRC.
    /// </summary>
    private static (decimal Usd, decimal Colones) CalcularDeudaReal(
        IEnumerable<Factura> facturas)
    {
        var facturasList = facturas.ToList();

        var deudaUsd = facturasList
            .Where(f => f.Moneda == "USD")
            .Sum(f => f.MontoTotal);

        var deudaColones = facturasList
            .Where(f => f.Moneda != "USD")
            .Sum(f => f.MontoTotal);

        return (Math.Round(deudaUsd, 2), Math.Round(deudaColones, 2));
    }

    /// <summary>
    /// Convierte la deuda en colones a su equivalente en dólares (tasa de compra)
    /// y la suma a la deuda en dólares. Se usa para restar del límite en dólares.
    /// </summary>
    private static decimal ConvertirColonesAUsd(
        decimal deudaUsd,
        decimal deudaColones,
        TipoCambioResult? tipoCambio)
    {
        if (tipoCambio?.Compra is decimal compra && compra > 0)
            return Math.Round(deudaUsd + (deudaColones / compra), 2);
        return deudaUsd;
    }

    private static decimal? ConvertirUsdAColones(decimal usd, TipoCambioResult? tipoCambio)
    {
        if (tipoCambio?.Venta is decimal venta && venta > 0)
            return Math.Round(usd * venta, 2);
        return null;
    }

    /// <summary>
    /// Límite restante en dólares (límite - deuda total en USD, nunca negativo)
    /// y su equivalente en colones. La deuda en colones se convierte a USD con la
    /// tasa de compra para restarse del límite en dólares.
    /// </summary>
    private static (decimal? Usd, decimal? Colones) CalcularLimiteDisponible(
        decimal limiteCredito,
        decimal totalAdeudadoUsd,
        TipoCambioResult? tipoCambio)
    {
        var disponibleUsd = Math.Max(0, limiteCredito - totalAdeudadoUsd);
        var disponibleUsdRedondeado = Math.Round(disponibleUsd, 2);

        if (tipoCambio?.Venta is decimal venta && venta > 0)
            return (disponibleUsdRedondeado, Math.Round(disponibleUsdRedondeado * venta, 2));

        return (disponibleUsdRedondeado, null);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Tarjeta tarjeta)
    {
        tarjeta.UsuarioId = GetUsuarioId();
        tarjeta.FechaCreacion = DateTime.UtcNow;
        tarjeta.SaldoActual = 0;
        var nueva = await _repository.AddAsync(tarjeta);
        await _repository.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = nueva.Id }, nueva);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Tarjeta tarjeta)
    {
        if (id != tarjeta.Id) return BadRequest();

        var userId = GetUsuarioId();
        var existente = await _repository.GetByIdAsync(id);
        if (existente is null || existente.UsuarioId != userId) return NotFound();

        tarjeta.UsuarioId = userId;
        await _repository.UpdateAsync(tarjeta);
        await _repository.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUsuarioId();
        var tarjeta = await _repository.GetByIdAsync(id);
        if (tarjeta is null || tarjeta.UsuarioId != userId) return NotFound();
        await _repository.DeleteAsync(tarjeta);
        await _repository.SaveChangesAsync();
        return NoContent();
    }
}
