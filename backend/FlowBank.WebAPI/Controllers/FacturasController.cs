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
public class FacturasController : ControllerBase
{
    private readonly IRepository<Factura> _facturas;
    private readonly IRepository<Tarjeta> _tarjetas;
    private readonly OcrService _ocr;
    private readonly IWebHostEnvironment _env;

    public FacturasController(
        IRepository<Factura> facturas,
        IRepository<Tarjeta> tarjetas,
        OcrService ocr,
        IWebHostEnvironment env)
    {
        _facturas = facturas;
        _tarjetas = tarjetas;
        _ocr = ocr;
        _env = env;
    }

    private int GetUsuarioId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUsuarioId();
        var facturas = (await _facturas.GetAllAsync())
            .Where(f => f.UsuarioId == userId)
            .OrderByDescending(f => f.FechaRegistro);
        return Ok(facturas);
    }

    public record ExtraccionResponse(
        decimal MontoTotal,
        DateTime? FechaCompra,
        string Comercio,
        string TextoCompleto);

    [HttpPost("extraer")]
    public async Task<IActionResult> Extraer(IFormFile imagen)
    {
        if (imagen is null || imagen.Length == 0)
            return BadRequest(new { message = "Selecciona una imagen de factura." });

        var extension = Path.GetExtension(imagen.FileName).ToLowerInvariant();
        var permitidas = new[] { ".jpg", ".jpeg", ".png", ".webp", ".bmp" };
        if (!permitidas.Contains(extension))
            return BadRequest(new { message = "Formato de imagen no permitido." });

        if (imagen.Length > 10 * 1024 * 1024)
            return BadRequest(new { message = "La imagen supera los 10 MB." });

        using var ms = new MemoryStream();
        await imagen.CopyToAsync(ms);

        OcrResult resultado;
        try
        {
            resultado = await _ocr.ExtractAsync(ms.ToArray());
        }
        catch (Exception)
        {
            return BadRequest(new { message = "No se pudo leer la imagen. Intenta con una foto mas clara." });
        }

        return Ok(new ExtraccionResponse(
            resultado.MontoTotal,
            resultado.FechaCompra,
            resultado.Comercio,
            resultado.TextoCompleto));
    }

    public record GuardarFacturaRequest(
        int? TarjetaId,
        decimal MontoTotal,
        DateTime? FechaCompra,
        string Comercio);

    [HttpPost]
    public async Task<IActionResult> Guardar([FromBody] GuardarFacturaRequest request)
    {
        var userId = GetUsuarioId();

        if (request.TarjetaId is int tarjetaId)
        {
            var tarjeta = await _tarjetas.GetByIdAsync(tarjetaId);
            if (tarjeta is null || tarjeta.UsuarioId != userId)
                return BadRequest(new { message = "La tarjeta seleccionada no existe." });
        }

        if (request.MontoTotal <= 0)
            return BadRequest(new { message = "El monto debe ser mayor a cero." });

        var factura = new Factura
        {
            TarjetaId = request.TarjetaId,
            UsuarioId = userId,
            MontoTotal = request.MontoTotal,
            FechaCompra = request.FechaCompra ?? DateTime.UtcNow,
            Comercio = request.Comercio ?? string.Empty,
            FechaRegistro = DateTime.UtcNow,
        };

        await _facturas.AddAsync(factura);
        await _facturas.SaveChangesAsync();

        return Ok(factura);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUsuarioId();
        var factura = await _facturas.GetByIdAsync(id);
        if (factura is null || factura.UsuarioId != userId)
            return NotFound();
        await _facturas.DeleteAsync(factura);
        await _facturas.SaveChangesAsync();
        return NoContent();
    }
}
