$result = Invoke-RestMethod -Uri "http://localhost:8082/api/screening" `
    -Method Post `
    -Headers @{"Content-Type" = "application/json" } `
    -Body '{"jd":"React developer needed","cv":"I know React"}' `
    -ErrorAction Stop 2>&1

if ($result) {
    $result | ConvertTo-Json -Depth 10
}
else {
    Write-Host "Error occurred" -ForegroundColor Red
}
