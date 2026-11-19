# Dia 5, paso 5: correr pruebas, provocar la falla, revertirla y volver a correr.
# Requiere el servidor encendido en otra ventana con: npm start
# Uso: .\entregas\dia-05\correr-paso5.ps1

Set-Location (Join-Path $PSScriptRoot '..\..')
[Console]::OutputEncoding = [Text.Encoding]::UTF8

try {
  Invoke-RestMethod http://localhost:3000/health | Out-Null
} catch {
  Write-Host 'El servidor no esta encendido. Abre otra ventana y ejecuta: npm start' -ForegroundColor Yellow
  exit 1
}

try {
  Write-Host '== 1/3: pruebas con la correccion' -ForegroundColor Cyan
  npx playwright test 2>&1 | Tee-Object entregas/dia-05/pruebas-2-con-correccion.txt

  Write-Host '== 2/3: falla provocada (<= cambia a <)' -ForegroundColor Cyan
  (Get-Content public/app.js -Raw).Replace('p.cantidad <= p.minimo', 'p.cantidad < p.minimo') | Set-Content public/app.js -NoNewline
  git diff public/app.js | Tee-Object entregas/dia-05/falla-provocada.diff
  npx playwright test 2>&1 | Tee-Object entregas/dia-05/pruebas-3-falla-provocada.txt
}
finally {
  # Pase lo que pase, app.js regresa a como estaba.
  git restore public/app.js
}

Write-Host '== 3/3: cambio revertido' -ForegroundColor Cyan
npx playwright test 2>&1 | Tee-Object entregas/dia-05/pruebas-4-revertido.txt
Write-Host '== Listo' -ForegroundColor Green
