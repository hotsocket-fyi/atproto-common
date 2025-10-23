import { XError } from "./lib.ts";
import { Serializable, SerializableParams } from "./types.ts";

export async function query<T>({ method, service, parameters, headers }: {
	method: string;
	service: URL;
	headers?: Headers;
	parameters?: SerializableParams;
}): Promise<T | XError> {
	const requestURL = new URL(`/xrpc/${method}`, service);
	if (parameters) {
		const usp = new URLSearchParams();
		for (const key in parameters) {
			if (!Object.hasOwn(parameters, key)) continue;
			const value = parameters[key];
			if (!value) continue;
			usp.append(key, value.toString());
		}
		requestURL.search = "?" + usp.toString();
	}
	const opts: RequestInit = {};
	if (headers) opts.headers = headers;
	const rsp = await fetch(requestURL, opts);
	return (await rsp.json()) as T | XError;
}

export async function procedure<T>(
	{ method, service, input, headers = new Headers() }: {
		method: string;
		service: URL;
		headers: Headers;
		input?: Record<string, Serializable> | Blob;
	},
): Promise<T | XError> {
	if (input instanceof Blob) {
		headers.append("Content-Type", input.type);
	} else {
		headers.append("Content-Type", "application/json");
	}
	const rsp = await fetch(new URL(`/xrpc/${method}`, service).toString(), {
		method: "POST",
		headers: headers,
		cache: "no-store",
		body: input instanceof Blob ? input : JSON.stringify(input),
	});
	return await rsp.json();
}

export function subscription({ method, service, parameters }: {
	method: string;
	service: URL;
	parameters?: SerializableParams;
}): WebSocket {
	const requestURL = new URL(`/xrpc/${method}`, service);
	requestURL.protocol = "wss:";
	if (parameters) {
		const usp = new URLSearchParams();
		for (const key in parameters) {
			if (!Object.hasOwn(parameters, key)) continue;
			const value = parameters[key];
			if (!value) continue;
			usp.append(key, value.toString());
		}
		requestURL.search = "?" + usp.toString();
	}
	return new WebSocket(requestURL);
}
