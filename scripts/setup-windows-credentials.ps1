# Windows Credential Manager Setup for n8n-dev-bridge MCPB
# Stores Bearer token securely per Anthropic MCPB standards
# Usage: .\setup-windows-credentials.ps1 [-AuthToken "Bearer zxT94kE8pLr62UNqV1dCB"]

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$AuthToken = "Bearer zxT94kE8pLr62UNqV1dCB"
)

$ErrorActionPreference = "Stop"

# Anthropic MCPB credential naming convention
$targetName = "claude-desktop/n8n-dev-bridge/AUTH_HEADER_DEV"
$userName = "n8n-dev-bridge-user"
$serverName = "n8n-dev-bridge"

Write-Host "n8n-dev-bridge MCPB Credential Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

try {
    # Check if running as Administrator
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    $isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if (-not $isAdmin) {
        Write-Warning "For best results, run as Administrator"
        Write-Host "Continuing with current permissions..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }

    # Validate token format
    if (-not $AuthToken.StartsWith("Bearer ")) {
        Write-Host "Token does not start with 'Bearer ', adding prefix..." -ForegroundColor Yellow
        $AuthToken = "Bearer $AuthToken"
    }

    # Remove existing credential if it exists
    Write-Host "Checking for existing credentials..." -ForegroundColor Yellow
    try {
        $existingCreds = cmdkey /list 2>$null | Select-String $targetName
        if ($existingCreds) {
            Write-Host "Found existing credential, removing..." -ForegroundColor Yellow
            cmdkey /delete:$targetName 2>$null | Out-Null
        }
    } catch {
        # Ignore errors if credential doesn't exist
        Write-Verbose "No existing credential found"
    }

    # Store new credential using cmdkey
    Write-Host "Storing Bearer token in Windows Credential Manager..." -ForegroundColor Green
    
    $cmdArgs = @(
        "/generic:$targetName"
        "/user:$userName" 
        "/pass:$AuthToken"
    )
    
    $cmdResult = & cmdkey $cmdArgs 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS: Credential stored securely!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Details:" -ForegroundColor Cyan
        Write-Host "  Target: $targetName" -ForegroundColor Gray
        Write-Host "  User: $userName" -ForegroundColor Gray
        Write-Host "  Token: $($AuthToken.Substring(0,10))...[hidden]" -ForegroundColor Gray
        Write-Host ""
        
        # Verify storage by listing credentials
        $verification = cmdkey /list 2>$null | Select-String $targetName
        if ($verification) {
            Write-Host "Verification: Credential confirmed in Windows Credential Manager" -ForegroundColor Green
            Write-Host "Location: Control Panel → Credential Manager → Generic Credentials" -ForegroundColor Gray
        } else {
            Write-Warning "Verification: Could not confirm credential storage (may still be successful)"
        }
        
    } else {
        Write-Error "Failed to store credential (Exit code: $LASTEXITCODE)"
        Write-Host "Command output: $cmdResult" -ForegroundColor Red
        Write-Host ""
        Write-Host "Manual Setup Alternative:" -ForegroundColor Yellow
        Write-Host "1. Open Control Panel → Credential Manager" -ForegroundColor White
        Write-Host "2. Click 'Add a generic credential'" -ForegroundColor White
        Write-Host "3. Internet address: $targetName" -ForegroundColor White
        Write-Host "4. User name: $userName" -ForegroundColor White
        Write-Host "5. Password: $AuthToken" -ForegroundColor White
        exit 1
    }

    # Test credential retrieval (optional)
    Write-Host "Testing credential retrieval..." -ForegroundColor Yellow
    try {
        $testResult = cmdkey /list:$targetName 2>$null
        if ($testResult -match $targetName) {
            Write-Host "✓ Credential retrieval test passed" -ForegroundColor Green
        }
    } catch {
        Write-Warning "Could not test credential retrieval"
    }

} catch {
    Write-Error "Setup failed: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Run PowerShell as Administrator" -ForegroundColor White
    Write-Host "2. Check Windows Credential Manager manually" -ForegroundColor White
    Write-Host "3. Verify token format: 'Bearer <your-token>'" -ForegroundColor White
    Write-Host "4. Report issues at: https://github.com/mapachekurt/n8n-dev-bridge-mcpb/issues" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Install n8n-dev-bridge.mcpb in Claude Desktop" -ForegroundColor White
Write-Host "   • Settings → Extensions → drag .mcpb file" -ForegroundColor Gray
Write-Host "2. Remove old JSON config from claude_desktop_config.json" -ForegroundColor White
Write-Host "   • Delete the 'n8n-dev-bridge' section" -ForegroundColor Gray
Write-Host "3. Test in Claude Desktop:" -ForegroundColor White
Write-Host "   • 'Check n8n health status'" -ForegroundColor Gray
Write-Host "   • 'List my n8n workflows'" -ForegroundColor Gray
Write-Host "   • 'Show available n8n nodes'" -ForegroundColor Gray

Write-Host ""
Write-Host "Configuration Details:" -ForegroundColor Cyan
Write-Host "• Endpoint: https://czlonkowskin8n-mcp-railwaylatest-dev.up.railway.app/mcp" -ForegroundColor Gray
Write-Host "• Transport: HTTP-only via mcp-remote" -ForegroundColor Gray
Write-Host "• Authentication: Bearer token (Windows Credential Manager)" -ForegroundColor Gray

if ($isAdmin) {
    Read-Host "`nPress Enter to continue"
} else {
    Start-Sleep -Seconds 3
    Write-Host "`nSetup completed. Close this window." -ForegroundColor Green
}
