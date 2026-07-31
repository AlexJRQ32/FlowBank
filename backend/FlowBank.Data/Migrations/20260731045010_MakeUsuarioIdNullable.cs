using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlowBank.Data.Migrations
{
    /// <inheritdoc />
    public partial class MakeUsuarioIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tarjetas_Usuarios_UsuarioId",
                table: "Tarjetas");

            migrationBuilder.AlterColumn<int>(
                name: "UsuarioId",
                table: "Tarjetas",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_Tarjetas_Usuarios_UsuarioId",
                table: "Tarjetas",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tarjetas_Usuarios_UsuarioId",
                table: "Tarjetas");

            migrationBuilder.AlterColumn<int>(
                name: "UsuarioId",
                table: "Tarjetas",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Tarjetas_Usuarios_UsuarioId",
                table: "Tarjetas",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
