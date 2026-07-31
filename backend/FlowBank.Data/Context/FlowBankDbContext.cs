using FlowBank.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlowBank.Data.Context;

public class FlowBankDbContext : DbContext
{
    public FlowBankDbContext(DbContextOptions<FlowBankDbContext> options)
        : base(options)
    {
    }

    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Banco> Bancos { get; set; }
    public DbSet<Tarjeta> Tarjetas { get; set; }
    public DbSet<RegistroPago> RegistrosPago { get; set; }
    public DbSet<Factura> Facturas { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Nombre).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Apellido).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(500);
        });

        modelBuilder.Entity<Banco>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nombre).IsRequired().HasMaxLength(150);
            entity.HasIndex(e => e.Nombre).IsUnique();
        });

        modelBuilder.Entity<Tarjeta>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nombre).IsRequired().HasMaxLength(100);
            entity.Property(e => e.UltimosCuatroDigitos).IsRequired().HasMaxLength(4);
            entity.Property(e => e.Tipo).IsRequired().HasMaxLength(50);
            entity.Property(e => e.LimiteCredito).HasPrecision(18, 2);
            entity.Property(e => e.SaldoActual).HasPrecision(18, 2);

            entity.HasOne(e => e.Usuario)
                .WithMany(u => u.Tarjetas)
                .HasForeignKey(e => e.UsuarioId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Banco)
                .WithMany(b => b.Tarjetas)
                .HasForeignKey(e => e.BancoId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RegistroPago>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Estado).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Monto).HasPrecision(18, 2);

            entity.HasOne(e => e.Tarjeta)
                .WithMany(t => t.RegistrosPago)
                .HasForeignKey(e => e.TarjetaId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Factura>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MontoTotal).HasPrecision(18, 2);
            entity.Property(e => e.Comercio).HasMaxLength(200);
            entity.Property(e => e.ImagenUrl).HasMaxLength(500);

            entity.HasOne(e => e.Tarjeta)
                .WithMany()
                .HasForeignKey(e => e.TarjetaId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
