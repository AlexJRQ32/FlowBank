using System.Text;
using FlowBank.Core.Services;
using FlowBank.Data;
using FlowBank.WebAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Carga de variables de entorno desde backend/.env (no se commitea)
var envPath = Path.Combine(builder.Environment.ContentRootPath, "..", ".env");
if (File.Exists(envPath))
{
    DotNetEnv.Env.Load(envPath);
}

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendLocal", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
            ?? new[] { "http://localhost:5173" };
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddDataLayer(builder.Configuration);
builder.Services.AddSingleton<OcrService>();

// Configuracion JWT
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? "FlowBank_Secret_Key_Dev_2026_CambiarEnProduccion_1234567890";

builder.Services.AddSingleton(new TokenService(
    jwtSecret,
    builder.Configuration["Jwt:Issuer"] ?? "FlowBank",
    builder.Configuration["Jwt:Audience"] ?? "FlowBankApp"));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "FlowBank",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "FlowBankApp",
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
        };
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseHttpsRedirection();
}

// En produccion (detras de proxy Alwaysdata) no hay puerto HTTPS local,
// el TLS lo termina el proxy: no usar redirect para evitar rutas rotas.
app.UseCors("FrontendLocal");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
