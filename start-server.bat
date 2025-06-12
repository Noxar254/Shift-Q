@echo off
echo ========================================
echo TimeTracker Pro - Local Development Server
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Starting Python HTTP Server on port 8000...
    echo Open your browser and go to: http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    python -m http.server 8000
    goto :end
)

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Starting Node.js HTTP Server on port 8080...
    echo Open your browser and go to: http://localhost:8080
    echo Press Ctrl+C to stop the server
    echo.
    npx http-server -p 8080
    goto :end
)

REM Check if PHP is available
php --version >nul 2>&1
if %errorlevel% == 0 (
    echo Starting PHP Development Server on port 8000...
    echo Open your browser and go to: http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    php -S localhost:8000
    goto :end
)

echo Error: No suitable server found!
echo Please install Python, Node.js, or PHP to run a local server.
echo.
echo Alternatively, you can:
echo - Open index.html directly in your browser (limited functionality)
echo - Use a different HTTP server
echo.
pause

:end
echo.
echo Server stopped. Press any key to exit...
pause >nul
