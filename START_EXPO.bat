@echo off
title Karis Store - Expo Dev Server
cd /d D:\Karis_Store_NPM
echo ========================================
echo   KARIS STORE - NPM (React Native)
echo   Starting Expo Development Server...
echo ========================================
echo.
echo HP Anda harus terhubung ke WiFi yang SAMA
echo dengan komputer ini (192.168.1.12)
echo.
set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.12
npx expo start
pause
