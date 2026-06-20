@echo off
title Ofuscador - El legado del rey
echo =======================================================
echo   Ofuscando archivos de js_dev/ hacia js/ ...
echo =======================================================
call npx.cmd javascript-obfuscator ./js_dev --output ./js --compact true --self-defending false --string-array true --string-array-threshold 0.75
echo =======================================================
echo   Ofuscacion completada con exito!
echo   Tu codigo en js/ esta ahora cifrado y seguro.
echo =======================================================
pause
