#!/usr/bin/env pwsh
# Simple HTTP server for serving files over HTTP (avoids CORS file:// issues)

param(
  [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'

# Create HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Server started at http://localhost:$Port/" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

try {
  while ($true) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $path = $request.Url.LocalPath
    if ($path -eq '/') { $path = '/index.html' }
    
    $localPath = Join-Path $PSScriptRoot $path.TrimStart('/')
    $localPath = [System.IO.Path]::GetFullPath($localPath)
    
    # Security: prevent path traversal
    $rootPath = [System.IO.Path]::GetFullPath($PSScriptRoot)
    if (-not $localPath.StartsWith($rootPath)) {
      $response.StatusCode = 403
      $response.Close()
      continue
    }
    
    if (Test-Path $localPath -PathType Leaf) {
      $content = Get-Content $localPath -Raw -ErrorAction SilentlyContinue
      if ($null -ne $content) {
        $response.StatusCode = 200
        # Set content type
        $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
        $contentType = @{
          '.html' = 'text/html'
          '.css' = 'text/css'
          '.js' = 'application/javascript'
          '.json' = 'application/json'
          '.png' = 'image/png'
          '.jpg' = 'image/jpeg'
          '.svg' = 'image/svg+xml'
        }[$ext]
        if (-not $contentType) { $contentType = 'text/plain' }
        $response.ContentType = $contentType
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
      } else {
        $response.StatusCode = 500
      }
    } else {
      $response.StatusCode = 404
    }
    
    $response.Close()
  }
} finally {
  $listener.Close()
}
