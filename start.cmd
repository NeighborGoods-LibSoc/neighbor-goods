@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

:: Default all variables to empty
set DATABASE_URI=
set DATABASE_TYPE=
set PAYLOAD_SECRET=
set NEXT_PUBLIC_SERVER_URL=
set CRON_SECRET=
set PREVIEW_SECRET=

:: Check if .env file exists
set OVERWRITE_ENV=n
if exist .env (
    echo A .env file already exists.
    set /p OVERWRITE_ENV="Do you want to overwrite it? (y/n) [default: n]: "
    if /i "!OVERWRITE_ENV!"=="" set OVERWRITE_ENV=n
) else (
    set OVERWRITE_ENV=y
)

:: If not overwriting, load existing values
if /i "!OVERWRITE_ENV!"=="n" (
    echo Reusing values from existing .env file...
    for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
        set "key=%%A"
        set "value=%%B"
        if /i "!key!"=="DATABASE_URI" set DATABASE_URI=!value!
        if /i "!key!"=="DATABASE_TYPE" set DATABASE_TYPE=!value!
        if /i "!key!"=="NEXT_PUBLIC_SERVER_URL" set NEXT_PUBLIC_SERVER_URL=!value!
        if /i "!key!"=="PAYLOAD_SECRET" set PAYLOAD_SECRET=!value!
        if /i "!key!"=="CRON_SECRET" set CRON_SECRET=!value!
        if /i "!key!"=="PREVIEW_SECRET" set PREVIEW_SECRET=!value!
    )

    if not defined DATABASE_TYPE (
        echo WARNING: DATABASE_TYPE is not set. Setting to mongodb...
        set DATABASE_TYPE=mongodb
        echo( >> .env
        echo DATABASE_TYPE=!DATABASE_TYPE! >> .env
    )

    if not defined DATABASE_URI (
        echo WARNING: DATABASE_URI is not set. Setting default...
        set DATABASE_URI=mongodb://mongo:27017/neighbor-goods
        echo( >> .env
        echo DATABASE_URI=!DATABASE_URI! >> .env
    )

    if not defined NEXT_PUBLIC_SERVER_URL (
        echo WARNING: NEXT_PUBLIC_SERVER_URL is not set. You will be prompted for this.
    )

    if not defined PAYLOAD_SECRET (
        echo WARNING: PAYLOAD_SECRET is not set. This will be generated and added to .env.
    )

    if not defined CRON_SECRET (
        echo WARNING: CRON_SECRET is not set. This will be generated and added to .env.
    )

    if not defined PREVIEW_SECRET (
        echo WARNING: PREVIEW_SECRET is not set. This will be generated and added to .env.
    )
)

:: Parse command-line arguments
:parse_args
if "%~1"=="" goto after_args
if "%~1"=="--server-url" (
    set NEXT_PUBLIC_SERVER_URL=%~2
    shift
) else (
    echo Unknown argument: %~1
    exit /b 1
)
shift
goto parse_args

:after_args
:: Prompt for required values
if not defined NEXT_PUBLIC_SERVER_URL (
    set /p NEXT_PUBLIC_SERVER_URL=Enter NEXT_PUBLIC_SERVER_URL without http nor https nor www:
    set NEXT_PUBLIC_SERVER_URL=http://!NEXT_PUBLIC_SERVER_URL!:3000
)

:: Set defaults if needed
if not defined DATABASE_TYPE (
    set DATABASE_TYPE=mongodb
)

if not defined DATABASE_URI (
    set DATABASE_URI=mongodb://mongo:27017/neighbor-goods
)

:: Setup unique value generation
set charset=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789
set length=32

:: Generate PAYLOAD_SECRET only if not set
if not defined PAYLOAD_SECRET (
    echo Generating PAYLOAD_SECRET...
    for /L %%i in (1,1,%length%) do (
        set /A "index=!random! %% 62"
        call set "char=%%charset:~!index!,1%%"
        set "PAYLOAD_SECRET=!PAYLOAD_SECRET!!char!"
    )

    if /i "!OVERWRITE_ENV!"=="n" (
        echo Adding missing PAYLOAD_SECRET to .env...
        echo( >> .env
        echo PAYLOAD_SECRET=!PAYLOAD_SECRET! >> .env
    )
    echo Done!
)

:: Generate CRON_SECRET only if not set
if not defined CRON_SECRET (
    echo Generating CRON_SECRET...
    for /L %%i in (1,1,%length%) do (
        set /A "index=!random! %% 62"
        call set "char=%%charset:~!index!,1%%"
        set "CRON_SECRET=!CRON_SECRET!!char!"
    )

    if /i "!OVERWRITE_ENV!"=="n" (
        echo Adding missing CRON_SECRET to .env...
        echo( >> .env
        echo CRON_SECRET=!CRON_SECRET! >> .env
    )
    echo Done!
)

:: Generate PREVIEW_SECRET only if not set
if not defined PREVIEW_SECRET (
    echo Generating PREVIEW_SECRET...
    for /L %%i in (1,1,%length%) do (
        set /A "index=!random! %% 62"
        call set "char=%%charset:~!index!,1%%"
        set "PREVIEW_SECRET=!PREVIEW_SECRET!!char!"
    )
    if /i "!OVERWRITE_ENV!"=="n" (
        echo Adding missing node ID to .env...
        echo( >> .env
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

if exist node_modules (
    echo node_modules directory found, skipping pnpm install...
) else (
    echo node_modules directory not found, running pnpm install...
    call pnpm install
    if errorlevel 1 (
        echo pnpm install failed. Aborting...
        exit /b 1
    )
)

:: Run docker-compose
::docker compose build --no-cache
docker compose up --build -d
