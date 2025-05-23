import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Define public routes for Clerk (adjust as needed)
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/", // Example: Make homepage public
  "/api/webhooks/(.*)", // Example: Webhook routes
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // 1. Clerk Authentication & Authorization
  if (!isPublicRoute(request)) {
    await auth.protect(); // Protect non-public routes
  }

  // 2. Supabase Session Management
  // Create a response object that can be modified by Supabase
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update the request and response cookies
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            // Re-create response to apply cookie changes
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request and response cookies
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            // Re-create response to apply cookie changes
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Refresh Supabase session if expired - important for Server Components
  await supabase.auth.getUser();

  // Return the potentially modified response (e.g., with updated Supabase session cookies)
  // Clerk's middleware implicitly handles returning its own response if it redirects, etc.
  // If Clerk doesn't redirect, we return the response potentially modified by Supabase.
  return response;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to suit your needs.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
