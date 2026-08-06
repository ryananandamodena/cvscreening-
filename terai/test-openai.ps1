$body = '{"jd":"Senior Full-Stack Developer with React, TypeScript, Node.js, Go, Docker, Kubernetes, AWS experience required","cv":"John Doe - Senior Software Engineer with 7 years experience. Expert in React, TypeScript, Node.js, Go. Built microservices with Docker and Kubernetes on AWS. Led team of 5 developers."}'

Write-Host "`n🧪 Testing OpenAI CV Screening...`n" -ForegroundColor Cyan

$response = Invoke-RestMethod -Uri "http://localhost:8082/api/screening" -Method Post -Headers @{"Content-Type" = "application/json" } -Body $body

Write-Host "✅ SUCCESS! OpenAI Analysis:`n" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Score: $($response.score)/100" -ForegroundColor Magenta
Write-Host "Confidence: $($response.confidence)" -ForegroundColor Magenta
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Matched Skills:" -ForegroundColor Green
$response.matchedSkills | ForEach-Object { Write-Host "  ✓ $_" -ForegroundColor Green }

Write-Host "`nMissing Skills:" -ForegroundColor Yellow
if ($response.missingSkills.Count -eq 0) {
    Write-Host "  (None)" -ForegroundColor Green
}
else {
    $response.missingSkills | ForEach-Object { Write-Host "  ✗ $_" -ForegroundColor Yellow }
}

Write-Host "`nReasoning:" -ForegroundColor Cyan
Write-Host $response.reasoning

Write-Host "`nBias Check:" -ForegroundColor Blue
Write-Host $response.biasCorrection

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 Real OpenAI GPT-4o-mini Working!" -ForegroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan
