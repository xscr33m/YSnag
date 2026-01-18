# YSnag Dependency Installer
# Installs yt-dlp and ffmpeg for Windows users
# This script is called by the NSIS installer as a post-install step

param(
    [switch]$Silent,
    [switch]$SkipPolicyReset
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warn { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Err { param($Message) Write-Host $Message -ForegroundColor Red }

# Check if running as admin
function Test-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Get current execution policy
function Get-CurrentPolicy {
    return Get-ExecutionPolicy -Scope CurrentUser
}

# Check if a command exists
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Install Node.js (required for yt-dlp JavaScript runtime)
function Install-NodeJS {
    Write-Info "`n[1/3] Installing Node.js (required for YouTube extraction)..."
    
    # Check if already installed
    if (Test-Command "node") {
        $version = & node --version 2>$null
        Write-Success "  Node.js is already installed ($version)"
        return $true
    }
    
    # Try winget first (preferred method)
    if (Test-Command "winget") {
        Write-Info "  Using winget to install Node.js LTS..."
        try {
            $result = & winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent 2>&1
            if ($LASTEXITCODE -eq 0 -or $result -match "already installed") {
                Write-Success "  Node.js installed successfully!"
                # Refresh PATH for current session
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                return $true
            }
        } catch {
            Write-Warn "  winget installation failed, trying alternative method..."
        }
    }
    
    # Fallback: Direct download
    Write-Info "  Downloading Node.js..."
    try {
        $nodeDir = "$env:LOCALAPPDATA\ysnag\bin"
        $tempZip = "$env:TEMP\nodejs.zip"
        $tempExtract = "$env:TEMP\nodejs-extract"
        
        if (-not (Test-Path $nodeDir)) {
            New-Item -ItemType Directory -Path $nodeDir -Force | Out-Null
        }
        
        # Download Node.js portable (win-x64)
        $nodeVersion = "v20.18.0"
        $nodeUrl = "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-win-x64.zip"
        Invoke-WebRequest -Uri $nodeUrl -OutFile $tempZip -UseBasicParsing
        
        # Extract
        if (Test-Path $tempExtract) {
            Remove-Item $tempExtract -Recurse -Force
        }
        Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force
        
        # Copy node.exe
        $nodeExe = Get-ChildItem -Path $tempExtract -Recurse -Filter "node.exe" | Select-Object -First 1
        if ($nodeExe) {
            Copy-Item $nodeExe.FullName -Destination "$nodeDir\node.exe" -Force
        }
        
        # Cleanup
        Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
        Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
        
        # Add to user PATH if not already there
        $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($userPath -notlike "*$nodeDir*") {
            [Environment]::SetEnvironmentVariable("Path", "$userPath;$nodeDir", "User")
            Write-Info "  Added Node.js to user PATH"
        }
        
        Write-Success "  Node.js downloaded to $nodeDir"
        return $true
    } catch {
        Write-Err "  Failed to download Node.js: $_"
        return $false
    }
}

# Install yt-dlp
function Install-YtDlp {
    Write-Info "`n[2/3] Installing yt-dlp..."
    
    # Check if already installed
    if (Test-Command "yt-dlp") {
        $version = & yt-dlp --version 2>$null
        Write-Success "  yt-dlp is already installed (version $version)"
        return $true
    }
    
    # Try winget first (preferred method)
    if (Test-Command "winget") {
        Write-Info "  Using winget to install yt-dlp..."
        try {
            $result = & winget install yt-dlp.yt-dlp --accept-source-agreements --accept-package-agreements --silent 2>&1
            if ($LASTEXITCODE -eq 0 -or $result -match "already installed") {
                Write-Success "  yt-dlp installed successfully!"
                return $true
            }
        } catch {
            Write-Warn "  winget installation failed, trying alternative method..."
        }
    }
    
    # Fallback: Direct download to AppData
    Write-Info "  Downloading yt-dlp directly..."
    try {
        $ytdlpDir = "$env:LOCALAPPDATA\ysnag\bin"
        $ytdlpPath = "$ytdlpDir\yt-dlp.exe"
        
        if (-not (Test-Path $ytdlpDir)) {
            New-Item -ItemType Directory -Path $ytdlpDir -Force | Out-Null
        }
        
        $downloadUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
        Invoke-WebRequest -Uri $downloadUrl -OutFile $ytdlpPath -UseBasicParsing
        
        # Add to user PATH if not already there
        $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($userPath -notlike "*$ytdlpDir*") {
            [Environment]::SetEnvironmentVariable("Path", "$userPath;$ytdlpDir", "User")
            Write-Info "  Added yt-dlp to user PATH"
        }
        
        Write-Success "  yt-dlp downloaded to $ytdlpPath"
        return $true
    } catch {
        Write-Err "  Failed to download yt-dlp: $_"
        return $false
    }
}

# Install ffmpeg
function Install-Ffmpeg {
    Write-Info "`n[3/3] Installing ffmpeg..."
    
    # Check if already installed
    if (Test-Command "ffmpeg") {
        $version = & ffmpeg -version 2>&1 | Select-Object -First 1
        Write-Success "  ffmpeg is already installed"
        return $true
    }
    
    # Try winget first (preferred method)
    if (Test-Command "winget") {
        Write-Info "  Using winget to install ffmpeg..."
        try {
            $result = & winget install Gyan.FFmpeg --accept-source-agreements --accept-package-agreements --silent 2>&1
            if ($LASTEXITCODE -eq 0 -or $result -match "already installed") {
                Write-Success "  ffmpeg installed successfully!"
                return $true
            }
        } catch {
            Write-Warn "  winget installation failed, trying alternative method..."
        }
    }
    
    # Fallback: Download ffmpeg essentials build
    Write-Info "  Downloading ffmpeg (this may take a moment)..."
    try {
        $ffmpegDir = "$env:LOCALAPPDATA\ysnag\bin"
        $tempZip = "$env:TEMP\ffmpeg.zip"
        $tempExtract = "$env:TEMP\ffmpeg-extract"
        
        if (-not (Test-Path $ffmpegDir)) {
            New-Item -ItemType Directory -Path $ffmpegDir -Force | Out-Null
        }
        
        # Download ffmpeg essentials build from gyan.dev
        $ffmpegUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
        Invoke-WebRequest -Uri $ffmpegUrl -OutFile $tempZip -UseBasicParsing
        
        # Extract
        if (Test-Path $tempExtract) {
            Remove-Item $tempExtract -Recurse -Force
        }
        Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force
        
        # Find and copy ffmpeg.exe and ffprobe.exe
        $ffmpegExe = Get-ChildItem -Path $tempExtract -Recurse -Filter "ffmpeg.exe" | Select-Object -First 1
        $ffprobeExe = Get-ChildItem -Path $tempExtract -Recurse -Filter "ffprobe.exe" | Select-Object -First 1
        
        if ($ffmpegExe) {
            Copy-Item $ffmpegExe.FullName -Destination "$ffmpegDir\ffmpeg.exe" -Force
        }
        if ($ffprobeExe) {
            Copy-Item $ffprobeExe.FullName -Destination "$ffmpegDir\ffprobe.exe" -Force
        }
        
        # Cleanup
        Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
        Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
        
        # Add to user PATH if not already there
        $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($userPath -notlike "*$ffmpegDir*") {
            [Environment]::SetEnvironmentVariable("Path", "$userPath;$ffmpegDir", "User")
            Write-Info "  Added ffmpeg to user PATH"
        }
        
        Write-Success "  ffmpeg downloaded to $ffmpegDir"
        return $true
    } catch {
        Write-Err "  Failed to download ffmpeg: $_"
        return $false
    }
}

# Main installation routine
function Start-Installation {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  YSnag Dependency Installer" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    $nodeSuccess = Install-NodeJS
    $ytdlpSuccess = Install-YtDlp
    $ffmpegSuccess = Install-Ffmpeg
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Installation Summary" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    if ($nodeSuccess) {
        Write-Success "  [OK] Node.js"
    } else {
        Write-Err "  [FAILED] Node.js - Please install manually: winget install OpenJS.NodeJS.LTS"
    }
    
    if ($ytdlpSuccess) {
        Write-Success "  [OK] yt-dlp"
    } else {
        Write-Err "  [FAILED] yt-dlp - Please install manually: winget install yt-dlp.yt-dlp"
    }
    
    if ($ffmpegSuccess) {
        Write-Success "  [OK] ffmpeg"
    } else {
        Write-Err "  [FAILED] ffmpeg - Please install manually: winget install Gyan.FFmpeg"
    }
    
    Write-Host ""
    
    if ($nodeSuccess -and $ytdlpSuccess -and $ffmpegSuccess) {
        Write-Success "All dependencies installed successfully!"
        Write-Info "Note: You may need to restart YSnag for changes to take effect."
        return $true
    } else {
        Write-Warn "Some dependencies could not be installed automatically."
        Write-Info "Please install missing dependencies manually before using YSnag."
        return $false
    }
}

# Entry point with ExecutionPolicy handling
function Main {
    try {
        $result = Start-Installation
        
        if (-not $Silent) {
            Write-Host "Press any key to close..." -ForegroundColor Gray
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        
        if ($result) { exit 0 } else { exit 1 }
    } catch {
        Write-Err "An error occurred: $_"
        
        if (-not $Silent) {
            Write-Host "Press any key to close..." -ForegroundColor Gray
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        
        exit 1
    }
}

Main
