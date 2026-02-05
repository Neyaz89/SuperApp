$body = @{
    url = "https://teraboxapp.com/s/1qp35pIpbJKDRroew5fELNQ"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://superapp-api-d3y5.onrender.com/api/extract" -Method Post -ContentType "application/json" -Body $body

Write-Host "Response:"
$response | ConvertTo-Json -Depth 10
