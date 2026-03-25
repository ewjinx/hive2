@echo off
echo Building Hive Agent Desktop Executable...
echo.

:: Ensure dependencies are installed
pip install -r requirements.txt

:: Run PyInstaller
:: --noconsole prevents the command prompt window from showing
:: --onefile packages everything into a single .exe
:: --name sets the output executable name
pyinstaller --noconsole --onefile --name "HiveAgent" desktop_app.py

echo.
echo Build complete. The executable can be found in the "dist" folder.
pause
