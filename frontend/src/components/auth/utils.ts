import { jwtDecode } from "jwt-decode";


export function isTokenExpired(token: string): boolean {
	try {
		const decoded: { exp: number } = jwtDecode(token);
		const now = Date.now() / 1000;
		return decoded.exp < now;
	} catch {
		return true; 
	}
}


export async function authFetch(
	input: RequestInfo,
	init: RequestInit = {}
): Promise<Response> {
	const token = localStorage.getItem("token");

	const headers = new Headers(init.headers || {});
	if (token) {
		headers.set("Authorization", `Bearer ${token}`);
	}

	const response = await fetch(input, {
		...init,
		headers,
	});

	if ([401].includes(response.status)) {
		localStorage.removeItem("token");
		window.location.href = "/login";
	}

	return response;
}


export async function fetchMe() {
	return authFetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/user/me`);
}
