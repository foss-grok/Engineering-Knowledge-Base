# Regenerate assets/search-index.json and assets/search-index.js from all HTML pages.
# The canonical builder is now scripts/build-search-index.py (works on Windows, macOS, Linux).
# This wrapper is kept so existing instructions keep working:
#   powershell -File scripts/build-search-index.ps1

$root = Split-Path -Parent $PSScriptRoot
$script = Join-Path $root 'scripts/build-search-index.py'
$python = (Get-Command python3 -ErrorAction SilentlyContinue)
if (-not $python) { $python = (Get-Command python -ErrorAction SilentlyContinue) }
if (-not $python) { Write-Error 'Python 3 is required: https://www.python.org/downloads/'; exit 1 }
& $python.Source $script
exit $LASTEXITCODE
