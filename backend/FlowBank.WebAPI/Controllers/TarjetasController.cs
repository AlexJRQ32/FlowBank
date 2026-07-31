using System.Security.Claims;
using FlowBank.Core.Entities;
using FlowBank.Data.Repositories;
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

    public TarjetasController(
        IRepository<Tarjeta> repository,
        IRepository<Factura> facturas)
    {
        _repository = repository;
        _facturas = facturas;
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
        var deudasPorTarjeta = facturas
            .Where(f => f.TarjetaId.HasValue && f.UsuarioId == userId)
            .GroupBy(f => f.TarjetaId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(f => f.MontoTotal));

        var resultado = tarjetas.Select(t => new
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
            t.SaldoActual,
            TotalAdeudado = deudasPorTarjeta.TryGetValue(t.Id, out var deuda) ? deuda : 0m,
            t.Nota,
            t.EsActiva,
            t.FechaCreacion,
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
        var totalAdeudado = facturas
            .Where(f => f.TarjetaId == id && f.UsuarioId == userId)
            .Sum(f => f.MontoTotal);

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
            tarjeta.SaldoActual,
            TotalAdeudado = totalAdeudado,
            tarjeta.Nota,
            tarjeta.EsActiva,
            tarjeta.FechaCreacion,
        });
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
