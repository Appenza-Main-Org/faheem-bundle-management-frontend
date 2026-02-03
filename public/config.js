// Runtime configuration - for local development only
// In production, API_URL comes from build-time environment variable (VITE_API_URL)
// Set in GitHub Actions workflow during build
window.APP_CONFIG = {
  // Leave API_URL undefined in production - will use VITE_API_URL from build
  // Uncomment below for local development:
  // API_URL: 'http://localhost:3001',
};
