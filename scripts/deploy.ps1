# =============================================================================
# Deployment Script for Dashboard Teknik TVRI (Windows + PM2)
# =============================================================================
param(
    [switch]$Install,
    [switch]$Build,
    [switch]$Start,
    [switch]$Restart,
    [switch]$Stop,
    [switch]$Logs,
    [switch]$Status,
    [switch]$All
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path -Path $ProjectRoot -ChildPath ".env"
$EnvExample = Join-Path -Path $ProjectRoot -ChildPath ".env.example"
$StandaloneDir = Join-Path -Path $ProjectRoot -ChildPath ".next\standalone"
$LogsDir = Join-Path -Path $ProjectRoot -ChildPath "logs"
$AppName = "dashboard-teknik-tvri"

function Show-Usage {
    Write-Output @"
Usage: .\scripts\deploy.ps1 [options]

Options:
  -Install     Install dependencies (npm install)
  -Build       Build the Next.js project for production
  -Start       Start the PM2 process
  -Restart     Restart the PM2 process
  -Stop        Stop the PM2 process
  -Logs        Show PM2 logs
  -Status      Show PM2 status
  -All         Run full deployment: Install -> Build -> Start

Examples:
  .\scripts\deploy.ps1 -All
  .\scripts\deploy.ps1 -Build
  .\scripts\deploy.ps1 -Start
  .\scripts\deploy.ps1 -Logs
"@
}

function Ensure-LogsDir {
    if (-not (Test-Path -LiteralPath $LogsDir)) {
        New-Item -ItemType Directory -Path $LogsDir | Out-Null
        Write-Output "Created logs directory: $LogsDir"
    }
}

function Ensure-EnvFile {
    if (-not (Test-Path -LiteralPath $EnvFile)) {
        if (Test-Path -LiteralPath $EnvExample) {
            Copy-Item -LiteralPath $EnvExample -Destination $EnvFile
            Write-Output "WARNING: Created .env from .env.example"
            Write-Output "Please edit $EnvFile with your actual configuration before starting."
            Write-Output "At minimum, change SESSION_PASSWORD to a secure random value."
            exit 1
        }
    }
}

function Install-Deps {
    Write-Output ">>> Installing dependencies..."
    Set-Location -LiteralPath $ProjectRoot
    npm install
    if ($?) {
        Write-Output "Dependencies installed successfully."
    } else {
        Write-Error "Failed to install dependencies."
        exit 1
    }
}

function Build-Project {
    Write-Output ">>> Building Next.js project for production..."
    Set-Location -LiteralPath $ProjectRoot

    # Ensure logs dir and .env exist
    Ensure-LogsDir
    Ensure-EnvFile

    # Stop PM2 first to release file locks
    $pm2Running = pm2 pid $AppName 2>$null
    if ($pm2Running) {
        Write-Output "Stopping PM2 process to release file locks..."
        pm2 stop $AppName
        Start-Sleep -Seconds 2
    }

    # Clean previous build
    if (Test-Path -LiteralPath $ProjectRoot\.next) {
        Remove-Item -LiteralPath $ProjectRoot\.next -Recurse -Force
        Write-Output "Cleaned previous build."
    }

    # Run build (Next.js standalone output)
    npm run build
    if ($?) {
        Write-Output "Build successful!"

        # Copy .next/static to standalone (Next.js bug: tidak otomatis tercopy)
        $StaticSource = Join-Path -Path $ProjectRoot -ChildPath ".next\static"
        $StaticDest = Join-Path -Path $StandaloneDir -ChildPath ".next\static"
        if (Test-Path -LiteralPath $StaticSource) {
            if (-not (Test-Path -LiteralPath $StaticDest)) {
                New-Item -ItemType Directory -Path $StaticDest | Out-Null
            }
            Copy-Item -Path "$StaticSource\*" -Destination $StaticDest -Recurse -Force
            Write-Output "Copied .next/static to standalone directory."
        } else {
            Write-Output "WARNING: $StaticSource not found!"
        }

        # Copy public folder contents (for file uploads & static assets)
        $PublicDest = Join-Path -Path $StandaloneDir -ChildPath "public"
        if (-not (Test-Path -LiteralPath $PublicDest)) {
            New-Item -ItemType Directory -Path $PublicDest | Out-Null
        }
        Copy-Item -Path "$ProjectRoot\public\*" -Destination $PublicDest -Recurse -Force
        Write-Output "Copied public assets to standalone directory."

        # Copy .env to standalone (for runtime)
        Copy-Item -LiteralPath $EnvFile -Destination $StandaloneDir -Force

        # Copy .gitignore to standalone
        $GitIgnoreSrc = Join-Path -Path $ProjectRoot -ChildPath ".gitignore"
        if (Test-Path -LiteralPath $GitIgnoreSrc) {
            Copy-Item -LiteralPath $GitIgnoreSrc -Destination $StandaloneDir -Force
        }

        Write-Output "Build artifacts ready at: $StandaloneDir"
        Write-Output "  - .next/standalone/.next/static  $(if (Test-Path $StaticDest) { '(OK)' } else { '(MISSING!)' })"
        Write-Output "  - .next/standalone/public        $(if (Test-Path $PublicDest) { '(OK)' } else { '(MISSING!)' })"

        # Warn about UPLOAD_DIR if not set
        $envContent = Get-Content -LiteralPath $EnvFile -ErrorAction SilentlyContinue
        $hasUploadDir = $envContent -match 'UPLOAD_DIR=.+'
        if (-not $hasUploadDir) {
            Write-Output ""
            Write-Output "WARNING: UPLOAD_DIR belum diatur di .env!"
            Write-Output "  File upload akan disimpan di: $StandaloneDir\public\uploads"
            Write-Output "  File tersebut akan HILANG saat rebuild berikutnya."
            Write-Output "  Set UPLOAD_DIR di .env ke folder permanen (contoh: D:\AplikasiTVRI\uploads)"
        }

        Write-Output "You can now run: .\scripts\deploy.ps1 -Start"
    } else {
        Write-Error "Build failed!"
        exit 1
    }
}

function Start-PM2 {
    Write-Output ">>> Starting PM2 process..."
    Set-Location -LiteralPath $ProjectRoot
    Ensure-EnvFile

    # Check if PM2 is installed
    $pm2Check = pm2 --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Output "PM2 not available. Installing..."
        npm install -g pm2
    }

    # Stop existing instance before starting (release file locks)
    $pm2Running = pm2 pid $AppName 2>$null
    if ($pm2Running) {
        Write-Output "Stopping existing PM2 instance..."
        pm2 delete $AppName
        Start-Sleep -Seconds 2
    }

    # Check if env file exists in standalone
    $StandaloneEnv = Join-Path -Path $StandaloneDir -ChildPath ".env"
    if (-not (Test-Path -LiteralPath $StandaloneEnv)) {
        Write-Output "WARNING: .env not found in standalone directory."
        Write-Output "Make sure to run -Build first or copy .env manually."
    }

    pm2 start ecosystem.config.js
    if ($?) {
        Write-Output "Application started with PM2."
        pm2 status
    } else {
        Write-Error "Failed to start application with PM2."
        exit 1
    }
}

function Restart-PM2 {
    Write-Output ">>> Restarting PM2 process..."
    Set-Location -LiteralPath $ProjectRoot
    pm2 restart $AppName
}

function Stop-PM2 {
    Write-Output ">>> Stopping PM2 process..."
    Set-Location -LiteralPath $ProjectRoot
    pm2 stop $AppName
}

function Show-Logs {
    Write-Output ">>> Showing PM2 logs (Ctrl+C to exit)..."
    Set-Location -LiteralPath $ProjectRoot
    pm2 logs $AppName
}

function Show-Status {
    Write-Output ">>> PM2 Status:"
    pm2 status
}

# --- Main ---

if ($All) {
    Install-Deps
    Build-Project
    Start-PM2
    Write-Output ""
    Write-Output "Deployment complete! Application is running."
    Write-Output "Open http://localhost:3000 in your browser."
    return
}

if ($Install) { Install-Deps }
if ($Build) { Build-Project }
if ($Start) { Start-PM2 }
if ($Restart) { Restart-PM2 }
if ($Stop) { Stop-PM2 }
if ($Logs) { Show-Logs }
if ($Status) { Show-Status }

if (-not ($Install -or $Build -or $Start -or $Restart -or $Stop -or $Logs -or $Status -or $All)) {
    Show-Usage
}
