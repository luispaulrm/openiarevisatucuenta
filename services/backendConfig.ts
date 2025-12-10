
// Utilities to centralize backend URL handling.
// CRITICAL FIX: For AI Studio and containerized environments, we must prefer 
// relative paths to ensure requests go through the Vite proxy (port 3000 -> 3001).
// Hardcoding external URLs often breaks the internal networking.

export const getBackendUrl = (): string => {
  // Always return empty string to force relative paths in this environment
  return '';
};

export const withBackendUrl = (path: string): string => {
  // Ensure the path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // Return just the path (e.g., "/api/analyze/bill")
  return normalizedPath;
};
