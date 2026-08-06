$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    jd = "We are looking for a Senior Full-Stack Developer with expertise in React, TypeScript, Node.js, and Go. The ideal candidate should have experience building scalable microservices and working with cloud platforms like AWS or GCP."
    cv = "John Doe - Full-Stack Developer with 7 years of experience. Expert in React, TypeScript, and Node.js. Built multiple enterprise applications. Familiar with AWS services and Docker. Strong problem-solving skills and team collaboration experience."
} | ConvertTo-Json

Write-Host "Testing Gemini AI Screening API..." -ForegroundColor Cyan
Write-Host "Sending request to: http://localhost:8082/api/screening" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8082/api/screening" `
                                  -Method Post `
                                  -Headers $headers `
                                  -Body $body

    Write-Host "✅ SUCCESS! Real Gemini AI Response:" -ForegroundColor Green
    Write-Host ""
    Write-Host "Score: $($response.score)" -ForegroundColor Magenta
    Write-Host "Confidence: $($response.confidence)" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Matched Skills:" -ForegroundColor Green
    $response.matchedSkills | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
    Write-Host "Missing Skills:" -ForegroundColor Yellow
    $response.missingSkills | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
    Write-Host "Reasoning:" -ForegroundColor Cyan
    Write-Host $response.reasoning
    Write-Host ""
    Write-Host "Bias Correction:" -ForegroundColor Blue
    Write-Host $response.biasCorrection
    Write-Host ""
    
} catch {
    Write-Host "❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Full Error:" $_ -ForegroundColor Red
}
