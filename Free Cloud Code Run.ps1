
try {
    $env:ANTHROPIC_AUTH_TOKEN = "freecc"
$env:ANTHROPIC_BASE_URL = "http://0.0.0.0:8082"

if (Get-Command claude -ErrorAction SilentlyContinue) {
    & claude
} else {
    Write-Host "claude command not found in PATH"
}
}
catch {
    Write-Host $_
    Read-Host "Error occurred. Press Enter to exit"
}