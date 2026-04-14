// Navigation data is served dynamically via /api/categories/nav.
// Keep this script as a stable prebuild/generate:nav entrypoint.

console.log(
  '[generate-nav-data] Skipping static nav generation because navigation is loaded dynamically from the database.',
)

