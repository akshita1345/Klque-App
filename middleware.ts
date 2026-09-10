import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { OnboardUrl, PublicUrl } from './constant/routes';

const redirectTo = (url: string, request: any) => NextResponse.redirect(new URL(url, request.url));

export async function middleware(request: NextRequest) {

  const { pathname: path } = request.nextUrl;
  const token = request.cookies.get('token')?.value || "";
  const userId = request.cookies.get('userId')?.value;
  const response = userId ? await fetch(`${request.nextUrl.origin}/api/get-user?userId=${userId}`, { method: "GET" }) : null;
  const responseData = response ? await response.json() : {};
  const userRes = responseData?.user;

  // Handle public routes access
  if ((PublicUrl.includes(path) || path === "/") && token) {
    return redirectTo('/ideate', request);
  }
  // Handle protected routes access
  if (!PublicUrl.includes(path) && !token) {
    return redirectTo('/login', request);
  }
  if (token && !userRes?.emailVerified) {
    const targetRoute = "/verify-email";
    return redirectTo(targetRoute, request);
  }
  // Redirect to appropriate onboarding step if not completed
  if (!userRes?.isOnboarded) {
    const targetRoute = OnboardUrl[userRes?.onboardingStep];
    if (targetRoute && request.nextUrl.pathname !== targetRoute) {
      return redirectTo(targetRoute, request);
    }
  }
  // Handle onboarding flow
  if (OnboardUrl.includes(path)) {
    return userRes?.isOnboarded ? redirectTo('/ideate', request) : NextResponse.next();
  }

  // ALLOW THE REQUEST TO PROCEED IF IT DOESN'T MATCH ANY OF THE ABOVE CONDITIONS
  return NextResponse.next();
}

// ADD ALL THE PARENT ROUTES HERE
export const config = {
  matcher: [
    '/',
    '/welcome',
    '/login',
    '/ideate',
    '/forgot-password',
    '/reset-password',
    '/onboard/:path*',
    '/plan',
    '/calender',
  ]
};
