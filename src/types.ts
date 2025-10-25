/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// implementation-specific bits

import type { Result } from "@hotsocket/dhmo";

/** Interface for classes with a `toString` function that returns a Result. */
export interface Stringifiable {
	/** Converts this class to a string. */
	toString(): Result<string, string>;
}

/** Types that can be serialized to JSON without trouble */
export type Serializable =
	| SerializableTypes
	| SerializableObject
	| Array<Serializable>
	| SerializableParams;
/** Object containing string keys mapping to {@link Serializable} values. */
export interface SerializableObject {
	[key: string]: Serializable;
	$type?: string;
}
/** Like {@link SerializableObject}, but only for types that can be URL parameters. */
export interface SerializableParams {
	[key: string]: SerializableTypes | Array<SerializableTypes>;
}
/** Also serializable stuff but just the values */
export type SerializableTypes = string | number | boolean | null | undefined;
