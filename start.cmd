@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

:: Default all variables
set "DATABASE_URI="
set "DATABASE_TYPE="
set "POSTGRES_USER="
set "POSTGRES_PASSWORD="
set "POSTGRES_DB="
set "PAYLOAD_SECRET="
set "NEXT_PUBLIC_SERVER_URL="
set "CRON_SECRET="
set "PREVIEW_SECRET="
set "SMTP_SERVER="
set "SMTP_USER="
set "SMTP_PASSWORD="
set "NG_ENV="

:: Parse command-line arguments
:parse_args
if "%~1"=="" goto after_args
if "%~1"=="--server-url" (
    set "NEXT_PUBLIC_SERVER_URL=%~2"
    shift
) else (
    echo Unknown argument: %~1
    exit /b 1
)
shift
goto parse_args

:after_args

:: Check if .env file exists
set "OVERWRITE_ENV=n"
if exist .env (
    echo A .env file already exists.
    set /p "OVERWRITE_ENV=Do you want to overwrite it? (y/n) [default: n]: "
    if "!OVERWRITE_ENV!"=="" set "OVERWRITE_ENV=n"
) else (
    set "OVERWRITE_ENV=y"
)

:: If not overwriting, load existing values
if /i "!OVERWRITE_ENV!"=="n" (
    echo Reusing values from existing .env file...
    for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
        set "key=%%A"
        set "value=%%B"
        if /i "!key!"=="DATABASE_URI"           set "DATABASE_URI=!value!"
        if /i "!key!"=="DATABASE_TYPE"          set "DATABASE_TYPE=!value!"
        if /i "!key!"=="POSTGRES_USER"          set "POSTGRES_USER=!value!"
        if /i "!key!"=="POSTGRES_PASSWORD"      set "POSTGRES_PASSWORD=!value!"
        if /i "!key!"=="POSTGRES_DB"            set "POSTGRES_DB=!value!"
        if /i "!key!"=="NEXT_PUBLIC_SERVER_URL" set "NEXT_PUBLIC_SERVER_URL=!value!"
        if /i "!key!"=="PAYLOAD_SECRET"         set "PAYLOAD_SECRET=!value!"
        if /i "!key!"=="CRON_SECRET"            set "CRON_SECRET=!value!"
        if /i "!key!"=="PREVIEW_SECRET"         set "PREVIEW_SECRET=!value!"
        if /i "!key!"=="SMTP_SERVER"            set "SMTP_SERVER=!value!"
        if /i "!key!"=="SMTP_USER"              set "SMTP_USER=!value!"
        if /i "!key!"=="SMTP_PASSWORD"          set "SMTP_PASSWORD=!value!"
        if /i "!key!"=="NG_ENV"                 set "NG_ENV=!value!"
    )
)

:: ------------------------------------------------------------------
:: Set simple defaults for non-secret values
:: ------------------------------------------------------------------
if "!DATABASE_TYPE!"=="" set "DATABASE_TYPE=postgres"
if "!POSTGRES_DB!"==""   set "POSTGRES_DB=neighbor-goods"
if "!SMTP_SERVER!"==""   set "SMTP_SERVER="
if "!SMTP_USER!"==""     set "SMTP_USER="
if "!SMTP_PASSWORD!"=="" set "SMTP_PASSWORD="

:: ------------------------------------------------------------------
:: Generate credentials / secrets if missing
:: (never default to a static value for these)
:: ------------------------------------------------------------------
set "charset=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
set "length=32"

if "!POSTGRES_USER!"=="" (
    echo Generating POSTGRES_USER...
    set "POSTGRES_USER=payload_"
    for /L %%i in (1,1,8) do (
        set /A "index=!random! %% 36"
        for %%j in (!index!) do set "POSTGRES_USER=!POSTGRES_USER!!charset:~%%j,1!"
    )
    echo Done!
)

if "!POSTGRES_PASSWORD!"=="" (
    echo Generating POSTGRES_PASSWORD...
    set "POSTGRES_PASSWORD="
    for /L %%i in (1,1,!length!) do (
        set /A "index=!random! %% 62"
        for %%j in (!index!) do set "POSTGRES_PASSWORD=!POSTGRES_PASSWORD!!charset:~%%j,1!"
    )
    echo Done!
)

if "!PAYLOAD_SECRET!"=="" (
    echo Generating PAYLOAD_SECRET...
    set "PAYLOAD_SECRET="
    for /L %%i in (1,1,!length!) do (
        set /A "index=!random! %% 62"
        for %%j in (!index!) do set "PAYLOAD_SECRET=!PAYLOAD_SECRET!!charset:~%%j,1!"
    )
    echo Done!
)

if "!CRON_SECRET!"=="" (
    echo Generating CRON_SECRET...
    set "CRON_SECRET="
    for /L %%i in (1,1,!length!) do (
        set /A "index=!random! %% 62"
        for %%j in (!index!) do set "CRON_SECRET=!CRON_SECRET!!charset:~%%j,1!"
    )
    echo Done!
)

if "!PREVIEW_SECRET!"=="" (
    echo Generating PREVIEW_SECRET...
    set "PREVIEW_SECRET="
    for /L %%i in (1,1,!length!) do (
        set /A "index=!random! %% 62"
        for %%j in (!index!) do set "PREVIEW_SECRET=!PREVIEW_SECRET!!charset:~%%j,1!"
    )
    echo Done!
)

:: Build DATABASE_URI from guaranteed credentials if not already set
if "!DATABASE_URI!"=="" (
    set "DATABASE_URI=postgres://!POSTGRES_USER!:!POSTGRES_PASSWORD!@postgres:5432/!POSTGRES_DB!"
)

:: ------------------------------------------------------------------
:: Prompt for user-supplied values if missing
:: ------------------------------------------------------------------
if "!NEXT_PUBLIC_SERVER_URL!"=="" (
    set /p "INPUT_URL=Enter NEXT_PUBLIC_SERVER_URL (without http:// nor https:// nor www.) [leave blank for localhost:3000]: "
    if "!INPUT_URL!"=="" (
        set "NEXT_PUBLIC_SERVER_URL=http://localhost:3000"
    ) else (
        set "NEXT_PUBLIC_SERVER_URL=http://!INPUT_URL!:3000"
    )
)

if "!SMTP_SERVER!"=="" (
    set /p "SMTP_SERVER=Enter SMTP_SERVER (e.g. smtp.gmail.com): "
)

if "!SMTP_USER!"=="" (
    set /p "SMTP_USER=Enter SMTP_USER (e.g. example@gmail.com): "
)

if "!SMTP_PASSWORD!"=="" (
    set /p "SMTP_PASSWORD=Enter SMTP_PASSWORD (this may be separate from your email login, depending on provider): "
)

:: Default to production, prompt if this is a development server
if "!NG_ENV!"=="" (
    set /p "IS_DEV=Is this a development server? (y/n) [default: n]: "
    if /i "!IS_DEV!"=="y" (
        set "NG_ENV=development"
    ) else (
        set "NG_ENV=production"
    )
)

:: ------------------------------------------------------------------
:: Write .env — full overwrite or backfill missing keys only
:: ------------------------------------------------------------------
if /i "!OVERWRITE_ENV!"=="y" (
    echo Writing new values to .env file...
    (
        echo DATABASE_URI=!DATABASE_URI!
        echo DATABASE_TYPE=!DATABASE_TYPE!
        echo POSTGRES_USER=!POSTGRES_USER!
        echo POSTGRES_PASSWORD=!POSTGRES_PASSWORD!
        echo POSTGRES_DB=!POSTGRES_DB!
        echo NEXT_PUBLIC_SERVER_URL=!NEXT_PUBLIC_SERVER_URL!
        echo PAYLOAD_SECRET=!PAYLOAD_SECRET!
        echo CRON_SECRET=!CRON_SECRET!
        echo PREVIEW_SECRET=!PREVIEW_SECRET!
        echo SMTP_SERVER=!SMTP_SERVER!
        echo SMTP_USER=!SMTP_USER!
        echo SMTP_PASSWORD=!SMTP_PASSWORD!
        echo NG_ENV=!NG_ENV!
    ) > .env
) else (
    echo Backfilling missing variables into existing .env...
    call :append_if_missing "DATABASE_URI"           "!DATABASE_URI!"
    call :append_if_missing "DATABASE_TYPE"          "!DATABASE_TYPE!"
    call :append_if_missing "POSTGRES_USER"          "!POSTGRES_USER!"
    call :append_if_missing "POSTGRES_PASSWORD"      "!POSTGRES_PASSWORD!"
    call :append_if_missing "POSTGRES_DB"            "!POSTGRES_DB!"
    call :append_if_missing "NEXT_PUBLIC_SERVER_URL" "!NEXT_PUBLIC_SERVER_URL!"
    call :append_if_missing "PAYLOAD_SECRET"         "!PAYLOAD_SECRET!"
    call :append_if_missing "CRON_SECRET"            "!CRON_SECRET!"
    call :append_if_missing "PREVIEW_SECRET"         "!PREVIEW_SECRET!"
    call :append_if_missing "SMTP_SERVER"            "!SMTP_SERVER!"
    call :append_if_missing "SMTP_USER"              "!SMTP_USER!"
    call :append_if_missing "SMTP_PASSWORD"          "!SMTP_PASSWORD!"
    call :append_if_missing "NG_ENV"                 "!NG_ENV!"
)

:: ------------------------------------------------------------------
:: Ensure pnpm is installed
:: ------------------------------------------------------------------
where pnpm >nul 2>nul
if errorlevel 1 (
    echo pnpm not found. Installing with npm...
    npm install -g pnpm@10
    where pnpm >nul 2>nul
    if errorlevel 1 (
        echo Failed to install pnpm. Make sure Node.js and npm are installed.
        exit /b 1
    )
)

echo Running pnpm install...
call pnpm install
if errorlevel 1 (
    echo pnpm install failed. Aborting...
    exit /b 1
)

:: Run docker compose
docker compose up --build -d
goto :eof

:: ------------------------------------------------------------------
:: Subroutine: append KEY=VALUE to .env only if KEY is absent
:: Usage: call :append_if_missing "KEY" "VALUE"
:: ------------------------------------------------------------------
:append_if_missing
set "_key=%~1"
set "_val=%~2"
findstr /i /b /c:"!_key!=" .env >nul 2>nul
if errorlevel 1 (
    echo.>> .env
    echo !_key!=!_val!>> .env
    echo   Added missing !_key! to .env
)
goto :eof
