import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { STRAPI_BASE_URL } from "./lib/strapi";

const protectedRoutes = ["/dashboard"];

function checkIsProtectedRoute(path: string) {
  return protectedRoutes.includes(path);
}

function redirectLogin(request: NextRequest) {
  return NextResponse.redirect(new URL("/signin", request.url));
}

export async function proxy(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;

  const isProtectedRoute = checkIsProtectedRoute(currentPath);

  if (!isProtectedRoute) return NextResponse.next();

  // la ruta , es una ruta protegida, por lo que debemos verificar si el usuario esta autenticado
  try {
    // 1. valida si el usuario tiene el token jwt
    // 2. si el usuario existe en la base de datos
    // 3. TODO:: si el usuario esta activo ( Bloqueado?)
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value;
    if (!jwt) {
      return redirectLogin(request);
    }

    const response = await fetch(`${STRAPI_BASE_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    });

    const userResponse = await response.json();
    console.log(userResponse);

    // si el usuario existe en la base de datos
    if (!userResponse) {
      return redirectLogin(request);
    }

    // le dejamos pasar la solicitud
    return NextResponse.next();
  } catch (error) {
    console.error("Error verifying user authentication", error);
    return redirectLogin(request);
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    "/dashboard",
    "/dashboard/:path*",
  ],
};
