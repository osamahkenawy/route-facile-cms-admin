# Script to kill process on a specific port
param(
    [int]$Port = 3000
)

Write-Host "Checking for processes on port $Port..." -ForegroundColor Yellow

# Find process using the port
$process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($process) {
    Write-Host "Found process(es) using port $Port. PID(s): $process" -ForegroundColor Red
    
    foreach ($pid in $process) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Killing process: $($proc.ProcessName) (PID: $pid)" -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    
    Write-Host "Port $Port is now free." -ForegroundColor Green
} else {
    Write-Host "No process found on port $Port. Port is free." -ForegroundColor Green
}




