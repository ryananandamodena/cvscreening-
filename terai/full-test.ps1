$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    jd = "We are looking for a Senior Full-Stack Developer with 5+ years of experience in React, TypeScript, Node.js, and Go. Must have experience with microservices architecture, Docker, Kubernetes, and cloud platforms (AWS/GCP). Strong communication skills and ability to work in agile teams required."
    cv = "John Doe - Senior Software Engineer
    
Education: B.S. Computer Science, MIT (2015)
    
Experience:
- Senior Full-Stack Developer at TechCorp (2020-Present)
  * Led development of microservices using Node.js and Go
  * Built frontend applications with React and TypeScript
  * Deployed services on AWS using Docker and Kubernetes
  * Mentored junior developers and conducted code reviews
  
- Full-Stack Developer at StartupXYZ (2017-2020)
  * Developed REST APIs with Node.js and Express
  * Created responsive UIs using React and Redux
  * Collaborated with cross-functional teams in agile environment
  
Skills: React, TypeScript, Node.js, Go, Docker, Kubernetes, AWS, MongoDB, PostgreSQL, Git, Agile/Scrum
    
Achievements: Led migration of monolithic app to microservices, reducing deployment time by 60%"
} | ConvertTo-Json

Write-Host "Testing OpenAI CV Screening API..." -ForegroundColor Cyan
Write-Host "Sending detailed CV for analysis..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8082/api/screening" `
        -Method Post `
        -Headers $headers `
        -Body $body

    Write-Host "✅ SUCCESS! OpenAI Analysis Complete:" -ForegroundColor Green
    Write-Host ""
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "Score: $($response.score)/100" -ForegroundColor Magenta
    Write-Host "Confidence: $($response.confidence)" -ForegroundColor Magenta
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Matched Skills:" -ForegroundColor Green
    $response.matchedSkills | ForEach-Object { Write-Host "  ✓ $_" -ForegroundColor Green }
    Write-Host ""
    Write-Host "Missing Skills:" -ForegroundColor Yellow
    if ($response.missingSkills.Count -eq 0) {
        Write-Host "  (None - Perfect match!)" -ForegroundColor Green
    }
    else {
        $response.missingSkills | ForEach-Object { Write-Host "  ✗ $_" -ForegroundColor Yellow }
    }
    Write-Host ""
    Write-Host "AI Reasoning:" -ForegroundColor Cyan
    Write-Host $response.reasoning -ForegroundColor White
    Write-Host ""
    Write-Host "Bias Correction:" -ForegroundColor Blue
    Write-Host $response.biasCorrection -ForegroundColor White
    Write-Host ""
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🎉 Real OpenAI Analysis Working!" -ForegroundColor Green
    
}
catch {
    Write-Host "❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
