/** Bagian situs yang dianggap "aplikasi" untuk keperluan PWA: halaman login dan portal di baliknya. */
const PWA_SCOPE_PREFIXES = [
  "/login",
  "/admin",
  "/teacher",
  "/student",
  "/counselor",
  "/piket",
  "/cms",
  "/profile",
];

export function isInPwaScope(pathname: string): boolean {
  return PWA_SCOPE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
