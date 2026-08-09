using System.Security.Claims;
using FlowBank.WebAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlowBank.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TipoCambioController : ControllerBase
{
    private readonly TipoCambioService _tipoCambio;

    public TipoCambioController(TipoCambioService tipoCambio)
    {
        _tipoCambio = tipoCambio;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var resultado = await _tipoCambio.ObtenerAsync();
        if (resultado is null)
            return Ok(new { compra = (decimal?)null, venta = (decimal?)null, fecha = (DateTime?)null });

        return Ok(new
        {
            compra = resultado.Compra,
            venta = resultado.Venta,
            fecha = resultado.Fecha,
        });
    }
}
