/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/** Functions to make XRPC-flavored requests/open websockets
 * @module
 */

import type { XError } from "./types.ts";
import type { Serializable, SerializableObject, SerializableParams } from "./types.ts";
import { Err, Ok, type Result } from "@hotsocket/dhmo";

/** {@link https://atproto.com/specs/xrpc XRPC} query. (HTTP GET request) */
export async function query<T extends SerializableObject | Blob>({ method, service, parameters, headers }: {
	method: string;
	service: URL;
	headers?: Headers;
	parameters?: SerializableParams;
}): Promise<Result<T | Blob, XError>> {
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
	if (rsp.headers.get("Content-Type") != "application/json") {
		return Ok(await rsp.blob()) as Result<T | Blob, XError>;
	} else {
		const data = await rsp.json();
		if ("error" in (data as XError)) {
			return Err(data as XError);
		} else {
			return Ok(data as T);
		}
	}
}

/** {@link https://atproto.com/specs/xrpc XRPC} procedure. (HTTP POST request) */
export async function procedure<T>(
	{ method, service, input, headers = new Headers() }: {
		method: string;
		service: URL;
		headers: Headers;
		input?: Record<string, Serializable> | Blob;
	},
): Promise<Result<T | Blob, XError>> {
	if (input instanceof Blob) {
		headers.append("Content-Type", input.type);
	} else {
		headers.append("Content-Type", "application/json");
	}
	const rsp = await fetch(new URL(`/xrpc/${method}`, service).toString(), {
		method: "POST",
		headers: headers,
		body: (input instanceof Blob ? input : JSON.stringify(input)) as BodyInit,
	});
	if (rsp.headers.get("Content-Type") != "application/json") {
		return Ok(await rsp.blob()) as Result<T | Blob, XError>;
	} else {
		const data = await rsp.json() as T | XError;
		if ("error" in (data as XError)) {
			return Err(data as XError);
		} else {
			return Ok(data as T);
		}
	}
}

/** {@link https://atproto.com/specs/xrpc XRPC} subscription. (WebSocket)
 *
 * Currently returns a straight websocket. This will change.
 */
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
