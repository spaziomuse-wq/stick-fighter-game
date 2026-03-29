@echo off
echo ============================================
echo  ComfyUI Missing Nodes Installer
echo ============================================
echo.

:: Set ComfyUI path
set COMFYUI_PATH=E:\ComfyUI
set NODES_PATH=%COMFYUI_PATH%\custom_nodes

:: Check if path exists
if not exist "%NODES_PATH%" (
    echo ERROR: Folder not found: %NODES_PATH%
    echo Please check your ComfyUI installation path.
    pause
    exit /b 1
)

echo [1/3] Installing VHS_VideoCombine (ComfyUI-VideoHelperSuite)...
echo.
cd /d "%NODES_PATH%"

if exist "ComfyUI-VideoHelperSuite" (
    echo Already exists. Pulling latest updates...
    cd ComfyUI-VideoHelperSuite
    git pull
) else (
    git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git
    cd ComfyUI-VideoHelperSuite
)

echo.
echo [2/3] Installing Python requirements for VideoHelperSuite...
"%COMFYUI_PATH%\python_embeded\python.exe" -m pip install -r requirements.txt

echo.
echo [3/3] FastUnsharpSharpen - Please install via ComfyUI Manager:
echo   1. Start ComfyUI
echo   2. Click Manager (top right)
echo   3. Click "Install Missing Custom Nodes"
echo   4. Find FastUnsharpSharpen and click Install
echo   5. Restart ComfyUI
echo.
echo ============================================
echo  VHS_VideoCombine install complete!
echo  Please restart ComfyUI now.
echo ============================================
echo.
pause
