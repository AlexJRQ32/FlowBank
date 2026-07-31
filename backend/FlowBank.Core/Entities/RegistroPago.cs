namespace FlowBank.Core.Entities;

public class RegistroPago
{
    public int Id { get; set; }
    public int TarjetaId { get; set; }
    public DateTime FechaPago { get; set; }
    public DateTime? FechaRealizada { get; set; }
    public decimal Monto { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Nota { get; set; }

    public Tarjeta? Tarjeta { get; set; }
}
