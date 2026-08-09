namespace FlowBank.Core.Entities;

public class Factura
{
    public int Id { get; set; }
    public int? TarjetaId { get; set; }
    public int? UsuarioId { get; set; }
    public decimal MontoTotal { get; set; }
    public string Moneda { get; set; } = "CRC";
    public DateTime FechaCompra { get; set; }
    public string Comercio { get; set; } = string.Empty;
    public string? ImagenUrl { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public Tarjeta? Tarjeta { get; set; }
}
