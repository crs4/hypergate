@ECHO OFF
GOTO:%~1 2>NUL
IF ERRORLEVEL 1 (
	ECHO Invalid argument: %1
	ECHO.
	ECHO Usage:  %~n0  number
	ECHO.
	ECHO Where:  number may be 1, 2 or 3 only
	GOTO:EOF
)

:restart
Rem La applicazione ICARE Device Manager si sta riavviando - Non chiudere
timeout /t 3 
TASKKILL /f /im appliance-manager.exe
timeout /t 3 
start appliance-manager.exe
GOTO Common

:update
REM Preprocess value 2
timeout /t 10
TASKKILL /f /im device-manager.exe
del /s /q /f c:\device-manager\*.log
rsync  -avzh --password-file=pass.txt --exclude-from 'file.txt' --log-file 'c:/device-manager/rsync.log' rsync://rsyncdevelopment@46.141.15.10:80/DMJose /cygdrive/c/device-manager/
timeout /t 10 
start c:/device-manager/device-manager.exe
del c:\device-manager\plugin\skin\Cromatismo.jpg
set /a riga=2
call :conta
echo totale righe: %Ris%
IF %Ris% GTR %riga%  start c:/device-manager/rsync/script/script.bat
:conta
set /a Ris=0
for /f %%a in ('type "c:\device-manager\rsync.log"^|find "" /v /c') do set /a Ris=%%a
GOTO Common

:setAccessPoint
REM Starting Hotspot...
netsh wlan set hostednetwork mode=allow ssid="icare-appliance" key="password"
netsh wlan start hostednetwork
GOTO Common

:Common
REM Common processing of preprocessed values

REM End of batch file