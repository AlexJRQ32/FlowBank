namespace FlowBank.Core.Entities;

public class Tarjeta
{
    public int Id { get; set; }
    public int? UsuarioId { get; set; }
    public int BancoId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string UltimosCuatroDigitos { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public int DiaCorte { get; set; }
    public int DiaPago { get; set; }
    public decimal LimiteCredito { get; set; }
    public decimal SaldoActual { get; set; }
    public string? Nota { get; set; }
    public bool EsActiva { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public Usuario? Usuario { get; set; }
    public Banco? Banco { get; set; }
    public ICollection<RegistroPago> RegistrosPago { get; set; } = new List<RegistroPago>();
}
