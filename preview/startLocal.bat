@echo off
chcp 65001 > nul
echo Проверка и запуск приложения...
where node >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Node.js не установлен. Пожалуйста, установите Node.js с сайта https://nodejs.org/
    echo Затем запустите этот файл снова.
    pause
    exit /b 1
)
REM Проверяем наличие локальной копии serve
IF NOT EXIST "utils\serve\build\main.js" (
    echo Локальная копия serve не найдена в ожидаемом месте.
    echo Проверьте наличие файла utils\serve\build\main.js
    pause
    exit /b 1
)
set PORT=5000
echo Запуск HTTP сервера с вашим приложением...
REM Запускаем serve из правильного местоположения без SSL параметров
start "" /B node utils\serve\build\main.js -s . --cors -c serve.json --listen %PORT%
timeout /T 3 /NOBREAK > nul
echo Открываю http://localhost:%PORT%
start "" "http://localhost:%PORT%"
echo.
echo Сервер запущен на http://localhost:%PORT%
echo Для завершения нажмите любую клавишу...
echo.
pause
taskkill /F /IM node.exe /T > nul 2>&1