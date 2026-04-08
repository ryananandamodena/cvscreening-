$ErrorActionPreference = "Stop"

try {
    Write-Host "1. Logging in..."
    $response = Invoke-RestMethod -Uri 'http://localhost:8080/api/login' -Method Post -Body (Get-Content login_payload.json -Raw) -ContentType 'application/json'
    $token = $response.token
    Write-Host "   Token received: $token"

    if (-not $token) {
        Write-Error "No token received!"
        exit 1
    }

    Write-Host "2. Accessing Protected Route (Jobs)..."
    $jobs = Invoke-RestMethod -Uri 'http://localhost:8080/api/jobs' -Headers @{Authorization="Bearer $token"}
    Write-Host "   Jobs retrieved: $($jobs.Count)"
    $jobs | ForEach-Object { Write-Host "   - $($_.title)" }

    Write-Host "✅ Integration Test SUCCESS!"
} catch {
    Write-Error "❌ Test Failed: $_"
    exit 1
}
