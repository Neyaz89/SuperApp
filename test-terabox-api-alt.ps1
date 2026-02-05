# Test alternative Terabox API
$shareId = "1qp35pIpbJKDRroew5fELNQ"
$apiUrl = "https://terabox-dl.qtcloud.workers.dev/api/get-info?shorturl=$shareId&pwd="

Write-Host "Testing Alternative Terabox API..."
Write-Host "URL: $apiUrl"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get -Headers @{
        "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        "Accept" = "application/json"
    }
    
    Write-Host "SUCCESS! Response:"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
}
