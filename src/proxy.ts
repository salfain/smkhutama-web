import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "cbt-session";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sess = req.cookies.get(COOKIE_NAME)?.value;

  // Block protected pages without session
  const isAdmin   = pathname.startsWith("/admin");
  const isTeacher = pathname.startsWith("/teacher");
  const isStudent = pathname.startsWith("/student");
  const isCms     = pathname.startsWith("/cms") && !pathname.startsWith("/cms/login");

  if ((isAdmin || isTeacher || isStudent || isCms) && !sess) {
    const url = req.nextUrl.clone();
    url.pathname = isCms ? "/cms/login" : "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/student/:path*", "/cms/:path*"],
};
