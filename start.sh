#!/usr/bin/env bash

# Default all variables
DATABASE_URI=""
DATABASE_TYPE=""
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

# Set defaults if needed or using no-input mode
[[ -z "$DATABASE_TYPE" ]] && DATABASE_TYPE="mongodb"
[[ -z "$DATABASE_URI" ]] && DATABASE_URI="mongodb://mongo:27017/neighbor-goods"
[[ -z "$NEXT_PUBLIC_SERVER_URL" ]] && NEXT_PUBLIC_SERVER_URL="http://localhost:3000"
[[ -z "$SMTP_SERVER" ]] && SMTP_SERVER=""
[[ -z "$SMTP_USER" ]] && SMTP_USER=""
[[ -z "$SMTP_PASSWORD" ]] && SMTP_PASSWORD=""

# Only prompt if not in CI mode and values are not set
if [[ "$CI_MODE" == false ]]; then
    if [[ -z "$NEXT_PUBLIC_SERVER_URL" ]]; then
        read -rp "Enter NEXT_PUBLIC_SERVER_URL (without http:// nor https:// nor www.): " INPUT_URL
        NEXT_PUBLIC_SERVER_URL="http://$INPUT_URL:3000"
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
        read -rp "Enter SMTP_PASSWORD(this may be separate from your email login, depending on provider): " INPUT_SMTP_PASSWORD
        SMTP_PASSWORD="$INPUT_SMTP_PASSWORD"
    fi
fi

# Generate random secrets if missing
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

        if [[ "$OVERWRITE_ENV" =~ ^[Nn]$ ]]; then
            echo "Adding NG_ENV to .env..."
            echo "" >> .env
            echo "NG_ENV=$NG_ENV" >> .env
        fi
    fi
fi

# Write new .env file if overwriting
if [[ "$OVERWRITE_ENV" =~ ^[Yy]$ ]]; then
    echo "Writing new values to .env file..."
    cat > .env <<EOF
DATABASE_URI=$DATABASE_URI
DATABASE_TYPE=$DATABASE_TYPE
NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
PAYLOAD_SECRET=$PAYLOAD_SECRET
CRON_SECRET=$CRON_SECRET
PREVIEW_SECRET=$PREVIEW_SECRET
SMTP_SERVER=$SMTP_SERVER
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=$SMTP_PASSWORD
NG_ENV=$NG_ENV
EOF
fi

# Ensure pnpm is installed
if ! command -v pnpm &>/dev/null; then
    echo "pnpm not found. Installing with npm..."
    npm install -g pnpm || {
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
