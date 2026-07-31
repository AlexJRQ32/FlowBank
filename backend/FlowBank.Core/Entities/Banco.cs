namespace FlowBank.Core.Entities;

public class Banco
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public bool EsActivo { get; set; } = true;

    public ICollection<Tarjeta> Tarjetas { get; set; } = new List<Tarjeta>();
}
