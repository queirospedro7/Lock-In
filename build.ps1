$ErrorActionPreference = 'Stop'
$projectDir = $PSScriptRoot
$buildDir = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Temp\LockIn-build'

if ($projectDir -eq $buildDir) {
    Write-Host 'ERRO: Nao execute este script de dentro da pasta temp!' -ForegroundColor Red
    exit 1
}

Write-Host 'A limpar build anterior...' -ForegroundColor Yellow
Remove-Item -Recurse -Force $buildDir -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$projectDir\dist" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host 'A copiar projecto para pasta temporaria...' -ForegroundColor Yellow
New-Item -ItemType Directory -Path $buildDir -Force | Out-Null
robocopy $projectDir $buildDir /E /XD node_modules dist .git /NFL /NDL /NJH /NJS /NC /NS /NP

Write-Host 'A instalar dependencias na pasta temp...' -ForegroundColor Yellow
Push-Location $buildDir
npm install --production=false
Pop-Location

Write-Host 'A compilar...' -ForegroundColor Green
Set-Location -LiteralPath $buildDir
npx electron-builder --win nsis

if ($LASTEXITCODE -eq 0) {
    New-Item -ItemType Directory -Path "$projectDir\dist" -Force | Out-Null
    Copy-Item "$buildDir\dist\LockIn-*.exe" "$projectDir\dist\" -Force
    Copy-Item "$buildDir\dist\*.blockmap" "$projectDir\dist\" -Force -ErrorAction SilentlyContinue
    Write-Host "Build OK! Installer em: $projectDir\dist\" -ForegroundColor Green
} else {
    Write-Host 'Build falhou!' -ForegroundColor Red
    exit 1
}
