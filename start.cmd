@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

:: Default all variables to empty
set "DATABASE_URI="
set "DATABASE_TYPE="
set "PAYLOAD_SECRET="
set "NEXT_PUBLIC_SERVER_URL="
set "CRON_SECRET="
set "PREVIEW_SECRET="
set "SMTP_SERVER="
set "SMTP_USER="
set "SMTP_PASSWORD="

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
    if exist .env (
        for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
            set "key=%%A"
            set "value=%%B"
            if /i "!key!"=="DATABASE_URI" set "DATABASE_URI=!value!"
            if /i "!key!"=="DATABASE_TYPE" set "DATABASE_TYPE=!value!"
            if /i "!key!"=="NEXT_PUBLIC_SERVER_URL" set "NEXT_PUBLIC_SERVER_URL=!value!"
            if /i "!key!"=="PAYLOAD_SECRET" set "PAYLOAD_SECRET=!value!"
            if /i "!key!"=="CRON_SECRET" set "CRON_SECRET=!value!"
            if /i "!key!"=="PREVIEW_SECRET" set "PREVIEW_SECRET=!value!"
            if /i "!key!"=="SMTP_SERVER" set "SMTP_SERVER=!value!"
            if /i "!key!"=="SMTP_USER" set "SMTP_USER=!value!"
            if /i "!key!"=="SMTP_PASSWORD" set "SMTP_PASSWORD=!value!"
        )
    )

    if "!DATABASE_TYPE!"=="" (
        echo WARNING: DATABASE_TYPE is not set. Setting to mongodb...
        set "DATABASE_TYPE=mongodb"
        echo. >> .env
        echo DATABASE_TYPE=!DATABASE_TYPE! >> .env
    )

    if "!DATABASE_URI!"=="" (
        echo WARNING: DATABASE_URI is not set. Setting default...
        set "DATABASE_URI=mongodb://mongo:27017/neighbor-goods"
        echo. >> .env
        echo DATABASE_URI=!DATABASE_URI! >> .env
    )

    if "!NEXT_PUBLIC_SERVER_URL!"=="" (
        echo WARNING: NEXT_PUBLIC_SERVER_URL is not set. You will be prompted for this.
    )

    if "!PAYLOAD_SECRET!"=="" (
        echo WARNING: PAYLOAD_SECRET is not set. This will be generated and added to .env.
    )

    if "!CRON_SECRET!"=="" (
        echo WARNING: CRON_SECRET is not set. This will be generated and added to .env.
    )

    if "!PREVIEW_SECRET!"=="" (
        echo WARNING: PREVIEW_SECRET is not set. This will be generated and added to .env.
    )

    if "!SMTP_SERVER!"=="" (
        echo WARNING: SMTP_SERVER is not set. You will be prompted to enter this ^(required for password reset emails^).
    )

    if "!SMTP_USER!"=="" (
        echo WARNING: SMTP_USER is not set. You will be prompted to enter this ^(required for password reset emails^).
    )

    if "!SMTP_PASSWORD!"=="" (
        echo WARNING: SMTP_PASSWORD is not set. You will be prompted to enter this ^(required for password reset emails^).
    )
)

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
:: Prompt for required values
if "!NEXT_PUBLIC_SERVER_URL!"=="" (
    set /p "NEXT_PUBLIC_SERVER_URL=Enter NEXT_PUBLIC_SERVER_URL (without http:// nor https:// nor www.):"
    set "NEXT_PUBLIC_SERVER_URL=http://!NEXT_PUBLIC_SERVER_URL!:3000"

    if /i "!OVERWRITE_ENV!"=="n" (
        echo Adding missing NEXT_PUBLIC_SERVER_URL to .env...
        echo. >> .env
        echo NEXT_PUBLIC_SERVER_URL=!NEXT_PUBLIC_SERVER_URL! >> .env
    )
)

if "!SMTP_SERVER!"=="" (
    set /p "SMTP_SERVER=Enter SMTP_SERVER (e.g. smtp.gmail.com):"

    if /i "!OVERWRITE_ENV!"=="n" (
        echo Adding missing SMTP_SERVER to .env...
        echo. >> .env
        echo SMTP_SERVER=!SMTP_SERVER! >> .env
    )
)

if "!SMTP_USER!"=="" (
    set /p "SMTP_USER=Enter SMTP_USER (e.g. example@gmail.com):"

    if /i "!OVERWRITE_ENV!"=="n" (
        echo Adding missing SMTP_USER to .env...
        echo. >> .env
        echo SMTP_USER=!SMTP_USER! >> .env
    )
)

if "!SMTP_PASSWORD!"=="" (
    set /p "SMTP_PASSWORD=Enter SMTP_PASSWORD (this may be separate from your email login, depending on provider):"

    if /i "!OVERWRITE_ENV!"=="n" (
        echo Adding missing SMTP_PASSWORD to .env...
        echo. >> .env
        echo SMTP_PASSWORD=!SMTP_PASSWORD! >> .env
    )
)

:: Set defaults if needed
if "!DATABASE_TYPE!"=="" (
    set "DATABASE_TYPE=mongodb"

    if /i "!OVERWRITE_ENV!"=="n" (
        echo Adding missing DATABASE_TYPE to .env...
        echo. >> .env
        echo DATABASE_TYPE=!DATABASE_TYPE! >> .env
    )
)

if "!DATABASE_URI!"=="" (
    set "DATABASE_URI=mongodb://mongo:27017/neighbor-goods"

    if /i "!OVERWRITE_ENV!"=="n" (
        echo Adding missing DATABASE_URI to .env...
        echo. >> .env
        echo DATABASE_URI=!DATABASE_URI! >> .env
    )
)

:: Setup unique value generation
set "charset=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
set "length=32"

:: Generate PAYLOAD_SECRET only if not set
if "!PAYLOAD_SECRET!"=="" (
    echo Generating PAYLOAD_SECRET...
    set "PAYLOAD_SECRET="
    for /L %%i in (1,1,!length!) do (
        set /A "index=!random! %% 62"
        for %%j in (!index!) do set "PAYLOAD_SECRET=!PAYLOAD_SECRET!!charset:~%%j,1!"
    )

    if /i "!OVERWRITE_ENV!"=="n" (
        echo Adding missing PAYLOAD_SECRET to .env...
        echo. >> .env
        echo PAYLOAD_SECRET=!PAYLOAD_SECRET! >> .env
    )
    echo Done!
)

:: Generate CRON_SECRET only if not set
if "!CRON_SECRET!"=="" (
    echo Generating CRON_SECRET...
    set "CRON_SECRET="
    for /L %%i in (1,1,!length!) do (
        set /A "index=!random! %% 62"
        for %%j in (!index!) do set "CRON_SECRET=!CRON_SECRET!!charset:~%%j,1!"
    )

    if /i "!OVERWRITE_ENV!"=="n" (
        echo Adding missing CRON_SECRET to .env...
        echo. >> .env
        echo CRON_SECRET=!CRON_SECRET! >> .env
    )
    echo Done!
)

:: Generate PREVIEW_SECRET only if not set
if "!PREVIEW_SECRET!"=="" (
    echo Generating PREVIEW_SECRET...
    set "PREVIEW_SECRET="
    for /L %%i in (1,1,!length!) do (
        set /A "index=!random! %% 62"
        for %%j in (!index!) do set "PREVIEW_SECRET=!PREVIEW_SECRET!!charset:~%%j,1!"
    )
    if /i "!OVERWRITE_ENV!"=="n" (
        echo Adding missing PREVIEW_SECRET to .env...
        echo. >> .env
        echo PREVIEW_SECRET=!PREVIEW_SECRET! >> .env
    )
    echo Done!
)

:: Write to .env
if /i "!OVERWRITE_ENV!"=="y" (
    echo Writing new values to .env file...
    (
        echo DATABASE_URI=!DATABASE_URI!
        echo DATABASE_TYPE=!DATABASE_TYPE!
        echo NEXT_PUBLIC_SERVER_URL=!NEXT_PUBLIC_SERVER_URL!
        echo PAYLOAD_SECRET=!PAYLOAD_SECRET!
        echo CRON_SECRET=!CRON_SECRET!
        echo PREVIEW_SECRET=!PREVIEW_SECRET!
        echo SMTP_SERVER=!SMTP_SERVER!
        echo SMTP_USER=!SMTP_USER!
        echo SMTP_PASSWORD=!SMTP_PASSWORD!
    ) > .env
)

:: Install npm node_modules
:: Ensure pnpm is installed
where pnpm >nul 2>nul
if errorlevel 1 (
    echo pnpm not found. Installing with npm...
    npm install -g pnpm
    :: Re-check if pnpm was successfully installed
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

:: Run docker-compose
docker compose up --build -d
