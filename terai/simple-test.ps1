$body = @{
    jd = "Looking for React developer"
    cv = "I am a React expert"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/screening" -Method Post -Headers @{"Content-Type" = "application/json" } -Body $body | ConvertTo-Json -Depth 10
