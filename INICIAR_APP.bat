@echo off
echo ==========================================
echo   MARKETING ENGINE - Iniciando...
echo ==========================================
echo.

:: Iniciar Backend en nueva ventana
start "Backend - Puerto 8000" cmd /k "cd /d D:\Brisa Maya Capital\Marketing_Engine\backend && .venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: Esperar 3 segundos para que el backend inicie
timeout /t 3 /nobreak > nul

:: Iniciar Frontend en nueva ventana
start "Frontend - Puerto 5173" cmd /k "cd /d D:\Brisa Maya Capital\Marketing_Engine\frontend && npm run dev"

:: Esperar 5 segundos y abrir el navegador
timeout /t 5 /nobreak > nul
start http://localhost:5173

echo.
echo ==========================================
echo   Aplicacion iniciada!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo ==========================================
echo.
echo Puedes cerrar esta ventana.
pause
