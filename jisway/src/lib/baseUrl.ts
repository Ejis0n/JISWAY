export function getAppBaseUrl() {
  const url =
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

