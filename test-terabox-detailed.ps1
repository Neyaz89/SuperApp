# Test with detailed error output
$body = @{
    url = "https://teraboxapp.com/s/1qp35pIpbJKDRroew5fELNQ"
} | ConvertTo-Json

Write-Host "Testing Terabox extraction..."
Write-Host "Waiting for response (this may take 30 seconds)..."
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://superapp-api-d3y5.onrender.com/api/extract" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 60
    
    Write-Host "Response received:"
    $response | ConvertTo-Json -Depth 10
    
    if ($response.extractionFailed) {
        Write-Host ""
        Write-Host "EXTRACTION FAILED!" -ForegroundColor Red
        Write-Host "Message: $($response.message)" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "SUCCESS!" -ForegroundColor Green
        Write-Host "Title: $($response.title)"
        Write-Host "Qualities: $($response.qualities.Count)"
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
