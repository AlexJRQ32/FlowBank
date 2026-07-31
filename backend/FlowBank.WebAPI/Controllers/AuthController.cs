using FlowBank.Core.Entities;
using FlowBank.Core.Services;
using FlowBank.Data.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace FlowBank.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IRepository<Usuario> _usuarios;
    private readonly TokenService _tokenService;

    public AuthController(
        IRepository<Usuario> usuarios,
        TokenService tokenService)
    {
        _usuarios = usuarios;
        _tokenService = tokenService;
    }

    public record GoogleLoginRequest(string AccessToken);
    public record EmailLoginRequest(string Email, string Password);
    public record EmailRegisterRequest(string Nombre, string Email, string Password);

    private object ToAuthResponse(Usuario usuario)
    {
        var token = _tokenService.GenerateToken(usuario);
        return new
        {
            token,
            usuario = new
            {
                usuario.Id,
                usuario.Nombre,
                usuario.Apellido,
                usuario.Email,
            },
        };
    }

    [HttpPost("login")]
    public async Task<IActionResult> EmailLogin([FromBody] EmailLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Correo y contraseña requeridos." });

        var usuario = (await _usuarios.FindAsync(u => u.Email == request.Email.Trim())).FirstOrDefault();

        if (usuario is null)
            return Unauthorized(new { message = "Correo o contraseña incorrectos." });

        // TODO: reemplazar por BCrypt cuando se migre la contrasena hasheada
        if (usuario.PasswordHash != request.Password)
            return Unauthorized(new { message = "Correo o contraseña incorrectos." });

        return Ok(ToAuthResponse(usuario));
    }

    [HttpPost("register")]
    public async Task<IActionResult> EmailRegister([FromBody] EmailRegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Todos los campos son requeridos." });

        var existe = (await _usuarios.FindAsync(u => u.Email == request.Email.Trim())).Any();
        if (existe)
            return Conflict(new { message = "Ya existe una cuenta con ese correo." });

        // TODO: hash de contrasena con BCrypt
        var usuario = new Usuario
        {
            Nombre = request.Nombre.Trim(),
            Apellido = string.Empty,
            Email = request.Email.Trim(),
            PasswordHash = request.Password,
        };

        await _usuarios.AddAsync(usuario);
        await _usuarios.SaveChangesAsync();

        return Ok(ToAuthResponse(usuario));
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.AccessToken))
            return BadRequest(new { message = "Token de Google requerido." });

        GoogleTokenInfo googleInfo;
        try
        {
            using var httpClient = new HttpClient();
            var req = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
            req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", request.AccessToken);
            var response = await httpClient.SendAsync(req);
            if (!response.IsSuccessStatusCode)
                return Unauthorized(new { message = "Token de Google invalido." });

            googleInfo = await response.Content.ReadFromJsonAsync<GoogleTokenInfo>()
                ?? throw new InvalidOperationException();
        }
        catch (Exception)
        {
            return Unauthorized(new { message = "Token de Google invalido." });
        }

        var email = googleInfo.Email;
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { message = "La cuenta de Google no tiene correo." });

        var usuario = (await _usuarios.FindAsync(u => u.Email == email)).FirstOrDefault();

        if (usuario is null)
        {
            var nombres = (googleInfo.Name ?? "Usuario").Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            usuario = new Usuario
            {
                Nombre = nombres.Length > 0 ? nombres[0] : "Usuario",
                Apellido = nombres.Length > 1 ? nombres[1] : string.Empty,
                Email = email,
                PasswordHash = string.Empty,
            };
            await _usuarios.AddAsync(usuario);
            await _usuarios.SaveChangesAsync();
        }

        return Ok(ToAuthResponse(usuario));
    }

    private sealed class GoogleTokenInfo
    {
        public string? Email { get; set; }
        public string? Name { get; set; }
        public string? Picture { get; set; }
    }
}
