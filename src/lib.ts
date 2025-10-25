/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Err, Ok, Result } from "@hotsocket/dhmo";
import type { Stringifiable } from "./types.ts";

/** Standard format for XRPC errors.
 * @see {@link https://atproto.com/specs/xrpc#error-responses}
 */
export type XError = {
	error: string;
	message?: string;
};

type SoftRef = {
	repo: string;
	collection: string;
	rkey: string;
};

// full:   "at://" AUTHORITY [ PATH ] [ "?" QUERY ] [ "#" FRAGMENT ]
// actual: "at://" AUTHORITY [ "/" COLLECTION [ "/" RKEY ] ]
/** {@link URL}-like at:// URI thing */
export class AtURI implements Stringifiable {
	authority: string;
	collection!: string;
	rkey!: string;

	/** Convenience method that returns a repo/collection/rkey object for certain XRPC endpoints */
	softRef(): SoftRef {
		return {
			repo: this.authority,
			collection: this.authority!,
			rkey: this.rkey!,
		};
	}

	private static getSerialization(
		uri: string,
		base?: string,
	): Result<string[], string> {
		const lower = base ?? uri;
		const upper = base && uri;
		const out_lowerParts = lower.split("/").filter((x) => x);

		// lower length, protocol enforcement
		if (out_lowerParts.length > 4) {
			return Err(`Lower part count ${out_lowerParts.length} is greater than the maximum of 4`);
		}
		if (out_lowerParts[0] != "at:") return Err(`Bad protocol '${out_lowerParts[0]}', must be 'at:'`);

		if (upper) {
			const upperParts = upper.split("/").filter((x) => x);

			// upper length enforcement, early drop-out if valid rooted
			if (upperParts[0] == "at:") {
				if (upperParts.length > 4) {
					return Err(`part count > 4 in rooted upper '${upper}'`);
				} else {
					return Ok(upperParts);
				}
			} else if (upperParts.length > 2) {
				return Err(`too many parts in upper w/o authority '${upper}'`);
			}

			// const offset = upperParts.length - out_lowerParts.length;
			// assert(offset > 0, `${offset}`);

			for (let i = 0; i < upperParts.length; i++) {
				out_lowerParts[2 + i] = upperParts[i];
			}
		}

		return Ok(out_lowerParts);
	}

	constructor(authority: string, collection?: string, rkey?: string) {
		if (!authority && collection) throw new Error("collection w/o authority");
		if (!collection && rkey) throw new Error("rkey w/o collection");
		this.authority = authority;
		this.collection = collection ?? "";
		this.rkey = rkey ?? "";
	}

	/** Creates a new instance of {@link AtURI} from a string, but returns a Result instead of throwing. */
	static parse(uri: Stringifiable | string, base?: Stringifiable | string): Result<AtURI, string> {
		const uas = uri.toString();
		const bas = base?.toString();
		const parts = this.getSerialization(
			typeof uas == "string" ? uas : uas.okValue()!,
			typeof bas == "string" ? bas : bas?.okValue(),
		);
		if (!parts.ok) return Err(parts.error);
		return Result.from(() => new AtURI(parts.value[1], parts.value[2], parts.value[3])).mapErr((e) => e.message);
	}
	/** Wraps around {@link parse}, returning false if it returns an Err. */
	static canParse(uri: Stringifiable, base?: Stringifiable): boolean {
		return AtURI.parse(uri, base).ok;
	}
	/**
	 * Converts URI to at:// URI.
	 * @returns The string form of this URI, unless if any parts are specified without any preceding elements.
	 * @example ```
	 * // Invalid collection NSID, returns null.
	 * new AtURI("at://did:web:example.com/cheese/abc123").toString()
	 * // Invalid 'authority' DID, returns null.
	 * new AtURI("at://not-a-did/com.example.nsid").toString()
	 * // All good and happy, returns the string fed in.
	 * new AtURI("at://did:web:example.com/com.example.nsid/abc123").toString()
	 * ```
	 */
	toString(): Result<string, string> {
		const ret: (string | null)[] = ["at://"];
		// using `?? ""` to have a "bad" value to find
		if (this.authority) {
			ret.push(this.authority);
		} else return Err("no authority");
		if (this.collection) {
			ret.push("/");
			ret.push(this.collection);
		} else return Ok(ret.join(""));
		if (this.rkey) {
			ret.push("/");
			ret.push(this.rkey);
		}
		return Ok(ret.join(""));
	}
}

// named XBlob to avoid conflicts with built-in "Blob"
/** ATProto `blob` type. */
export type XBlob = {
	$type: "blob";
	ref: {
		$link: string;
	};
	mimeType: string;
	size: number;
};

const rkeyExpression = /^([A-Za-z0-9.\-_:~]{1,512})$/;
/** Validates an rkey, and returns null if it fails.
 * Uses RegEx from the {@link https://atproto.com/specs/record-key#record-key-syntax Record Key Syntax} spec.
 */
export function validateRecordKey(rkey: string): string | null {
	const matched = rkey.match(rkeyExpression);
	if (!matched) return null;
	return matched[0];
}
