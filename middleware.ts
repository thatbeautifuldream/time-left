import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Get the time-left-storage cookie
  const storageCookie = request.cookies.get("time-left-storage")?.value;

  let birthdate = null;

  // Parse the cookie and extract the birthdate if it exists
  if (storageCookie) {
    try {
      const storage = JSON.parse(decodeURIComponent(storageCookie));
      birthdate = storage?.state?.birthdate;
      console.log("Middleware - extracted birthdate:", birthdate);
    } catch (error) {
      console.error("Failed to parse storage cookie:", error);
    }
  }

  // If user is trying to access the main page but doesn't have a birthdate,
  // redirect to the setup page
  if (path === "/" && !birthdate) {
    console.log("Redirecting to /setup from /");
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  // If user is on setup page but already has birthdate, redirect to main page
  if (path === "/setup" && birthdate) {
    console.log("Redirecting to / from /setup");
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware
export const config = {
  matcher: ["/", "/setup"],
};
