#!/bin/sh
# ══════════════════════════════════════════════════════════════════════════════
# Docker Entrypoint Script
# Injects runtime environment variables into config.js
# ══════════════════════════════════════════════════════════════════════════════

set -e

# Default values
API_URL=${API_URL:-""}

# Generate runtime config.js
cat > /usr/share/nginx/html/config.js << EOF
// Runtime configuration - generated at container startup
window.APP_CONFIG = {
  API_URL: '${API_URL}',
};
EOF

echo "Runtime config.js generated with API_URL: ${API_URL:-'(empty - same origin)'}"

# Execute the main command (nginx)
exec "$@"
