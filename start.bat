@echo off
title Discord SaaS - System Start
echo ==========================================
echo    Uruchamianie Discord SaaS Platform
echo ==========================================
echo.
echo [1/3] Sprawdzanie polaczenia z baza danych...
call npx prisma generate
echo.
echo [2/3] Instalacja brakujacych zaleznosci...
call pnpm install
echo.
echo [3/3] Startowanie serwerow (API, Bot, Web)...
echo.
echo Platforma bedzie dostepna pod adresem:
echo Dashboard: http://localhost:3000
echo API:       http://localhost:3001
echo.
echo Nacisnij dowolny klawisz, aby przerwac...
echo.
pnpm run dev
pause
