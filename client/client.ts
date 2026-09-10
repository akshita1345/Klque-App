"use client";
import Cookies from 'js-cookie';

export const signOut = () => {
  window.localStorage.clear();
  Cookies.remove("userId");
  Cookies.remove("token");
  window.location.href = "/";
};

export const apiClient = async (url: string, options?: RequestInit) => {
  const token = Cookies.get('token') || "";
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { authorization: token }),
  };

  const config: RequestInit = {
    headers: {
      ...defaultHeaders,
      ...(options?.headers || {}),
    },
    ...options,
  };

  const response = await fetch(url, config);
  const responseData = await response.json();

  if (responseData?.error) {
    // Throw an error so it can be caught in the caller function
    if (["Unauthorized: Invalid token", "Session Invalid or expired."]?.includes(responseData.error)) {
      signOut();
    }
    throw new Error(responseData.error || "An error occurred");
  }

  return responseData;
};