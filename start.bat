@echo off
REM Start lrc-player development server

echo ========================================
echo   Starting lrc-player Development Server
echo ========================================
echo.

REM Add Node.js to PATH
set "NODE_PATH=C:\Program Files\nodejs"
set "PATH=%NODE_PATH%;%PATH%"

cd /d c:\guests\lrc-player

echo Node.js version:
node --version
echo.

echo Starting Vite dev server...
echo.
echo Open your browser to http://localhost:5173
echo.
echo Press Ctrl+C to stop the server.
echo.

REM Use node directly to avoid PowerShell execution policy issues
node node_modules/vite/bin/vite.js --host
