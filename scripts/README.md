# Scripts

This folder contains automation and deployment scripts for the Geofranzy project.

## Available Scripts

### Deployment Scripts
- **deploy.ps1** - PowerShell deployment script for Windows
- **deploy.sh** - Bash deployment script for Linux/macOS

### Setup Scripts
- **setup-scheduler.ps1** - PowerShell script to setup background task scheduler (Windows)
- **setup-scheduler.sh** - Bash script to setup cron jobs (Linux/macOS)

## Usage

### Windows (PowerShell)
```powershell
# Deploy the app
.\scripts\deploy.ps1

# Setup scheduler
.\scripts\setup-scheduler.ps1
```

### Linux/macOS (Bash)
```bash
# Deploy the app
./scripts/deploy.sh

# Setup scheduler
./scripts/setup-scheduler.sh
```

## Permissions

Make sure scripts are executable on Linux/macOS:
```bash
chmod +x scripts/*.sh
```
