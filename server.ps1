
$httpListener = New-Object System.Net.HttpListener
$httpListener.Prefixes.Add("http://localhost:8000/")
$httpListener.Start()
Write-Host "Listening on http://localhost:8000/"

while ($httpListener.IsListening) {
    $context = $httpListener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $filePath = "c:\Downloaded Web Sites\www.landstar.com" + $request.Url.LocalPath
    
    if ($request.Url.LocalPath -eq "/") {
        $filePath = "c:\Downloaded Web Sites\www.landstar.com\index.htm"
    }

    if (Test-Path $filePath -PathType Leaf) {
        $buffer = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $buffer.Length
        
        $extension = [System.IO.Path]::GetExtension($filePath)
        $mimeType = switch ($extension) {
            ".html" { "text/html" }
            ".htm" { "text/html" }
            ".css" { "text/css" }
            ".js" { "application/javascript" }
            ".png" { "image/png" }
            ".jpg" { "image/jpeg" }
            ".jpeg" { "image/jpeg" }
            ".gif" { "image/gif" }
            default { "application/octet-stream" }
        }
        $response.ContentType = $mimeType
        
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    } else {
        $response.StatusCode = 404
        $responseString = "<html><body><h1>404 Not Found</h1></body></html>"
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($responseString)
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    }
    
    $response.Close()
}

$httpListener.Stop()
$httpListener.Close()
