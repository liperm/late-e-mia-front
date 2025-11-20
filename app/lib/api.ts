export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const res = await fetch(input, {
    ...init,
    credentials: "include",  // envia o cookie HttpOnly
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login?error=session_expired";
    }
    return null;
  }

  return res;
}
