#!/usr/bin/env bash

# Default all variables
DATABASE_URI=""
DATABASE_TYPE=""
POSTGRES_USER=""
POSTGRES_PASSWORD=""
POSTGRES_DB=""
PAYLOAD_SECRET=""
NEXT_PUBLIC_SERVER_URL=""
CRON_SECRET=""
PREVIEW_SECRET=""
SMTP_SERVER=""
SMTP_USER=""
SMTP_PASSWORD=""
NG_ENV=""
CI_MODE=false

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --server-url)
            NEXT_PUBLIC_SERVER_URL="$2"
            shift 2
            ;;
        --ci)
            CI_MODE=true
            shift
            ;;
        *)
            echo "Unknown argument: $1"
            echo "Usage: $0 [--server-url <url>] [--ci]"
            exit 1
            ;;
    esac
done

# Check if .env file exists
OVERWRITE_ENV="n"
if [[ -f .env ]]; then
    if [[ "$CI_MODE" == true ]]; then
        OVERWRITE_ENV="n"
    else
        echo "A .env file already exists."
        read -rp "Do you want to overwrite it? (y/n) [default: n]: " OVERWRITE_ENV
        OVERWRITE_ENV="${OVERWRITE_ENV:-n}"
    fi
else
    OVERWRITE_ENV="y"
fi

# If not overwriting, load existing values
if [[ "$OVERWRITE_ENV" =~ ^[Nn]$ ]]; then
    echo "Reusing values from existing .env file..."
    while IFS='=' read -r key value; do
        case "$key" in
            DATABASE_URI) DATABASE_URI="$value" ;;
            DATABASE_TYPE) DATABASE_TYPE="$value" ;;
            POSTGRES_USER) POSTGRES_USER="$value" ;;
            POSTGRES_PASSWORD) POSTGRES_PASSWORD="$value" ;;
            POSTGRES_DB) POSTGRES_DB="$value" ;;
            NEXT_PUBLIC_SERVER_URL) NEXT_PUBLIC_SERVER_URL="$value" ;;
            PAYLOAD_SECRET) PAYLOAD_SECRET="$value" ;;
            CRON_SECRET) CRON_SECRET="$value" ;;
            PREVIEW_SECRET) PREVIEW_SECRET="$value" ;;
            SMTP_SERVER) SMTP_SERVER="$value" ;;
            SMTP_USER) SMTP_USER="$value" ;;
            SMTP_PASSWORD) SMTP_PASSWORD="$value" ;;
            NG_ENV) NG_ENV="$value" ;;
        esac
    done < <(grep '=' .env)
fi

# Helper: append a missing key=value to the existing .env
append_if_missing() {
    local key="$1"
    local value="$2"
    if ! grep -q "^${key}=" .env 2>/dev/null; then
        echo "${key}=${value}" >> .env
        echo "  Added missing ${key} to .env"
    fi
}

# Set simple defaults for non-secret values
[[ -z "$DATABASE_TYPE" ]] && DATABASE_TYPE="postgres"
[[ -z "$POSTGRES_DB" ]]   && POSTGRES_DB="neighbor-goods"
[[ -z "$NEXT_PUBLIC_SERVER_URL" ]] && NEXT_PUBLIC_SERVER_URL="http://localhost:3000"
[[ -z "$SMTP_SERVER" ]]   && SMTP_SERVER=""
[[ -z "$SMTP_USER" ]]     && SMTP_USER=""
[[ -z "$SMTP_PASSWORD" ]] && SMTP_PASSWORD=""

# Generate secrets / credentials if missing (never default to a static value)
if [[ -z "$POSTGRES_USER" ]]; then
    echo "Generating POSTGRES_USER..."
    POSTGRES_USER="payload_$(head -c 16 /dev/urandom | base64 | tr -dc a-z0-9 | head -c 8)"
    echo "Done!"
fi

if [[ -z "$POSTGRES_PASSWORD" ]]; then
    echo "Generating POSTGRES_PASSWORD..."
    POSTGRES_PASSWORD=$(head -c 32 /dev/urandom | base64 | tr -dc A-Za-z0-9 | head -c 32)
    echo "Done!"
fi

if [[ -z "$PAYLOAD_SECRET" ]]; then
    echo "Generating PAYLOAD_SECRET..."
    PAYLOAD_SECRET=$(head -c 32 /dev/urandom | base64 | tr -dc A-Za-z0-9 | head -c 32)
    echo "Done!"
fi

if [[ -z "$CRON_SECRET" ]]; then
    echo "Generating CRON_SECRET..."
    CRON_SECRET=$(head -c 32 /dev/urandom | base64 | tr -dc A-Za-z0-9 | head -c 32)
    echo "Done!"
fi

if [[ -z "$PREVIEW_SECRET" ]]; then
    echo "Generating PREVIEW_SECRET..."
    PREVIEW_SECRET=$(head -c 32 /dev/urandom | base64 | tr -dc A-Za-z0-9 | head -c 32)
    echo "Done!"
fi

# Build DATABASE_URI from credentials if not already set
[[ -z "$DATABASE_URI" ]] && DATABASE_URI="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres:5432/$POSTGRES_DB"

# Only prompt if not in CI mode and values are not set
if [[ "$CI_MODE" == false ]]; then
    if [[ -z "$NEXT_PUBLIC_SERVER_URL" || "$NEXT_PUBLIC_SERVER_URL" == "http://localhost:3000" ]]; then
        read -rp "Enter NEXT_PUBLIC_SERVER_URL (without http:// nor https:// nor www.) [leave blank for localhost:3000]: " INPUT_URL
        [[ -n "$INPUT_URL" ]] && NEXT_PUBLIC_SERVER_URL="http://$INPUT_URL:3000"
    fi

    if [[ -z "$SMTP_SERVER" ]]; then
        read -rp "Enter SMTP_SERVER (e.g. smtp.gmail.com): " INPUT_SMTP_SERVER
        SMTP_SERVER="$INPUT_SMTP_SERVER"
    fi

    if [[ -z "$SMTP_USER" ]]; then
        read -rp "Enter SMTP_USER (e.g. example@gmail.com): " INPUT_SMTP_USER
        SMTP_USER="$INPUT_SMTP_USER"
    fi

    if [[ -z "$SMTP_PASSWORD" ]]; then
        read -rp "Enter SMTP_PASSWORD (this may be separate from your email login, depending on provider): " INPUT_SMTP_PASSWORD
        SMTP_PASSWORD="$INPUT_SMTP_PASSWORD"
    fi
fi

# Prompt for NG_ENV if not set (default to production)
if [[ -z "$NG_ENV" ]]; then
    if [[ "$CI_MODE" == true ]]; then
        NG_ENV="production"
    else
        read -rp "Is this a development server? (y/n) [default: n]: " IS_DEV
        if [[ "$IS_DEV" =~ ^[Yy]$ ]]; then
            NG_ENV="development"
        else
            NG_ENV="production"
        fi
    fi
fi

# Write new .env file if overwriting; otherwise backfill any missing variables
if [[ "$OVERWRITE_ENV" =~ ^[Yy]$ ]]; then
    echo "Writing new values to .env file..."
    cat > .env <<EOF
DATABASE_URI=$DATABASE_URI
DATABASE_TYPE=$DATABASE_TYPE
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=$POSTGRES_DB
NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
PAYLOAD_SECRET=$PAYLOAD_SECRET
CRON_SECRET=$CRON_SECRET
PREVIEW_SECRET=$PREVIEW_SECRET
SMTP_SERVER=$SMTP_SERVER
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=$SMTP_PASSWORD
NG_ENV=$NG_ENV
EOF
else
    # Backfill only — append keys that are absent from the existing .env
    echo "Backfilling missing variables into existing .env..."
    append_if_missing "DATABASE_URI"          "$DATABASE_URI"
    append_if_missing "DATABASE_TYPE"         "$DATABASE_TYPE"
    append_if_missing "POSTGRES_USER"         "$POSTGRES_USER"
    append_if_missing "POSTGRES_PASSWORD"     "$POSTGRES_PASSWORD"
    append_if_missing "POSTGRES_DB"           "$POSTGRES_DB"
    append_if_missing "NEXT_PUBLIC_SERVER_URL" "$NEXT_PUBLIC_SERVER_URL"
    append_if_missing "PAYLOAD_SECRET"        "$PAYLOAD_SECRET"
    append_if_missing "CRON_SECRET"           "$CRON_SECRET"
    append_if_missing "PREVIEW_SECRET"        "$PREVIEW_SECRET"
    append_if_missing "SMTP_SERVER"           "$SMTP_SERVER"
    append_if_missing "SMTP_USER"             "$SMTP_USER"
    append_if_missing "SMTP_PASSWORD"         "$SMTP_PASSWORD"
    append_if_missing "NG_ENV"                "$NG_ENV"
fi

# Ensure pnpm is installed
if ! command -v pnpm &>/dev/null; then
    echo "pnpm not found. Installing with npm..."
    npm install -g pnpm@10 || {
        echo "Failed to install pnpm. Make sure Node.js and npm are installed."
        exit 1
    }
fi

# Install node_modules if needed
echo "Running pnpm install..."
pnpm install || {
    echo "pnpm install failed. Aborting..."
    exit 1
}

# Run docker compose
# Use sudo only if not in CI mode (GitHub Actions doesn't need it)
if [[ "$CI_MODE" == true ]]; then
    docker compose up --build -d
else
    sudo docker compose up --build -d
fi
