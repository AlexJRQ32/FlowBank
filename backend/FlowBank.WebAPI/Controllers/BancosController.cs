using FlowBank.Core.Entities;
using FlowBank.Data.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlowBank.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BancosController : ControllerBase
{
    private readonly IRepository<Banco> _repository;

    public BancosController(IRepository<Banco> repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _repository.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var banco = await _repository.GetByIdAsync(id);
        return banco is null ? NotFound() : Ok(banco);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Banco banco)
    {
        var nuevo = await _repository.AddAsync(banco);
        await _repository.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = nuevo.Id }, nuevo);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Banco banco)
    {
        if (id != banco.Id) return BadRequest();
        await _repository.UpdateAsync(banco);
        await _repository.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var banco = await _repository.GetByIdAsync(id);
        if (banco is null) return NotFound();
        await _repository.DeleteAsync(banco);
        await _repository.SaveChangesAsync();
        return NoContent();
    }
}

