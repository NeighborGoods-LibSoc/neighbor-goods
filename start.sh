#!/usr/bin/env bash
set -euo pipefail

# Default all variables
DATABASE_URI=""
DATABASE_TYPE=""
PAYLOAD_SECRET=""
NEXT_PUBLIC_SERVER_URL=""
CRON_SECRET=""
PREVIEW_SECRET=""

# Check if .env file exists
OVERWRITE_ENV="n"
if [[ -f .env ]]; then
    echo "A .env file already exists."
    read -rp "Do you want to overwrite it? (y/n) [default: n]: " OVERWRITE_ENV
    OVERWRITE_ENV="${OVERWRITE_ENV:-n}"
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
        esac
    done < <(grep '=' .env)

    [[ -z "$DATABASE_TYPE" ]] && {
        echo "WARNING: DATABASE_TYPE is not set. Setting to mongodb..."
        DATABASE_TYPE="mongodb"
        echo -e "\nDATABASE_TYPE=$DATABASE_TYPE" >> .env
    }

    [[ -z "$DATABASE_URI" ]] && {
        echo "WARNING: DATABASE_URI is not set. Setting default..."
        DATABASE_URI="mongodb://mongo:27017/neighbor-goods"
        echo -e "\nDATABASE_URI=$DATABASE_URI" >> .env
    }

    [[ -z "$NEXT_PUBLIC_SERVER_URL" ]] && echo "WARNING: NEXT_PUBLIC_SERVER_URL is not set. You will be prompted for this."
    [[ -z "$PAYLOAD_SECRET" ]] && echo "WARNING: PAYLOAD_SECRET is not set. This will be generated and added to .env."
    [[ -z "$CRON_SECRET" ]] && echo "WARNING: CRON_SECRET is not set. This will be generated and added to .env."
    [[ -z "$PREVIEW_SECRET" ]] && echo "WARNING: PREVIEW_SECRET is not set. This will be generated and added to .env."
fi

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --server-url)
            NEXT_PUBLIC_SERVER_URL="$2"
            shift 2
            ;;
        *)
            echo "Unknown argument: $1"
            exit 1
            ;;
    esac
done

# Prompt if not set
if [[ -z "$NEXT_PUBLIC_SERVER_URL" ]]; then
    read -rp "Enter NEXT_PUBLIC_SERVER_URL without http nor https nor www: " INPUT_URL
    NEXT_PUBLIC_SERVER_URL="http://$INPUT_URL:3000"
fi

# Set defaults if needed
[[ -z "$DATABASE_TYPE" ]] && DATABASE_TYPE="mongodb"
[[ -z "$DATABASE_URI" ]] && DATABASE_URI="mongodb://mongo:27017/neighbor-goods"

# Generate random secrets if missing
if [[ -z "$PAYLOAD_SECRET" ]]; then
    echo "Generating PAYLOAD_SECRET..."
    PAYLOAD_SECRET=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 32)
    if [[ "$OVERWRITE_ENV" == "n" ]]; then
        echo -e "\nPAYLOAD_SECRET=$PAYLOAD_SECRET" >> .env
    fi
    echo "Done!"
fi

if [[ -z "$CRON_SECRET" ]]; then
    echo "Generating CRON_SECRET..."
    CRON_SECRET=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 32)
    if [[ "$OVERWRITE_ENV" == "n" ]]; then
        echo -e "\nCRON_SECRET=$CRON_SECRET" >> .env
    fi
    echo "Done!"
fi

if [[ -z "$PREVIEW_SECRET" ]]; then
    echo "Generating PREVIEW_SECRET..."
    PREVIEW_SECRET=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 32)
    if [[ "$OVERWRITE_ENV" == "n" ]]; then
        echo -e "\nPREVIEW_SECRET=$PREVIEW_SECRET" >> .env
    fi
    echo "Done!"
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
if [[ -d node_modules ]]; then
    echo "node_modules directory found, skipping pnpm install..."
else
    echo "node_modules directory not found, running pnpm install..."
    pnpm install || {
        echo "pnpm install failed. Aborting..."
        exit 1
    }
fi

# Run docker compose
docker compose up --build -d
