export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Validates a user-supplied (not auto-generated) slug: lowercase
// alphanumeric segments separated by single hyphens, no leading/trailing/
// double hyphens.
export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}
