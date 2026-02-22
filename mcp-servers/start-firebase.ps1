# Start Firebase MCP Server (Windows)

Write-Host "Starting Firebase MCP Server..."
$scriptPath = Split-Path -Parent $PSCommandPath
Push-Location $scriptPath

npm run firebase

Pop-Location
