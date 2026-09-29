# Script para crear la base de datos aura_studio
# Ejecutar DESPUES de iniciar MySQL desde el panel XAMPP
$mysql = "C:\xampp\mysql\bin\mysql.exe"
$schema = "abm\database\schema.sql"
$args = @("-u", "root", "-h", "127.0.0.1", "--default-character-set=utf8mb4")
Write-Host "Verificando conexion a MySQL..."
$status = & "C:\xampp\mysql\bin\mysqladmin.exe" -u root -h 127.0.0.1 status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: MySQL no esta corriendo. Abri el panel XAMPP y hace clic en Start de MySQL."
    exit 1
}
Write-Host "MySQL esta corriendo. Importando schema..."
Get-Content $schema -Raw | & $mysql @args
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "BASE DE DATOS CREADA EXITOSAMENTE."
    Write-Host ""
    & "C:\xampp\mysql\bin\mysql.exe" -u root -h 127.0.0.1 -e "USE aura_studio; SHOW TABLES; SELECT COUNT(*) as profesionales FROM profesionales; SELECT COUNT(*) as servicios FROM servicios;"
} else {
    Write-Host "Error al importar el schema. Revisa el output de arriba."
}
