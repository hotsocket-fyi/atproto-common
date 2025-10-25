/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

type TSRecord<K extends string | number | symbol, T> = globalThis.Record<K, T>;

// strings are in backticks to line up with spec
// https://atproto.com/specs/lexicon
// a lot of these descriptions are lifted from that page too fyi,
// since there's like a creative commons license i gotta mention it somewhere

/** Lexicon is a schema definition language used to describe ATProto records, HTTP endpoints (XRPC), and event stream messages.
 * It builds on top of the ATProto {@link https://atproto.com/specs/data-model Data Model}. */
export type Lexicon = {
	lexicon: 1;
	id: string;
	description?: string;
	defs: TSRecord<string, AnySchemaObject>;
};
/** Exclusive to the `main` def. */
export type PrimaryTypes = Query | Procedure | Subscription | Record;

/** Describes a record. */
export type Record = SchemaObject & {
	type: `record`;
	key: `tid` | `nsid` | `literal:${string}` | `any`;
	record: Object;
};
/** Describes an XRPC query. */
export type Query = RPC & {
	type: `query`;
	parameters: Params;
};
/** Describes an XRPC procedure. */
export type Procedure = RPC & {
	type: `procedure`;
	input?: RPC_IO;
};
/** Common type for XRPC calls */
export type RPC = SchemaObject & {
	output?: RPC_IO;
	parameters?: Params;
	errors?: RPC_Error[];
};
/** Describes an error that may be returned by an XRPC call. */
type RPC_Error = {
	name: string;
	description?: string;
};
/** For input, output fields in XRPC call definitions. */
export type RPC_IO = {
	description?: string;
	encoding: `application/json` | `${string}/${string}`;
	schema?: Object | Ref | Union;
};
/** Describes an XRPC 'subscription', which is basically just a fancy WebSocket.
 *
 * Not well supported by this implementation.
 */
export type Subscription = RPC & {
	type: `subscription`;
	message?: {
		description?: string;
		schema: Union;
	};
};

/** Describes parameters used for XRPC queries. */
export type Params = FieldDef & {
	type: `params`;
	required?: string[];
	properties: TSRecord<string, ParamTypes>;
};
type ParamTypes =
	| Boolean
	| Integer
	| String
	| Unknown
	| Array<Boolean | Integer | String | Unknown>;

/** Any type seen in a lexicon. */
export type AnySchemaObject = PrimaryTypes | FieldTypes;
/** Types other than the "primary ones", along with them as an array. */
export type FieldTypes = _FieldTypes | Array<_FieldTypes>;
type _FieldTypes =
	| Null
	| Boolean
	| Integer
	| String
	| Bytes
	| CidLink
	| Blob
	| Object
	| Params
	| Token
	| Ref
	| Union
	| Unknown;

/** Base type for field types. */
export type FieldDef = SchemaObject & {
	type:
		| `null`
		| `boolean`
		| `integer`
		| `string`
		| `bytes`
		| `cid-link`
		| `blob`
		| `array`
		| `object`
		| `params`
		| `token`
		| `ref`
		| `union`
		| `unknown`;
};

/** Constant null value. */
export type Null = FieldDef & {
	type: `null`;
};

/** Typical boolean. */
export type Boolean = FieldDef & {
	type: `boolean`;
	default?: boolean;
	const?: boolean;
};

/** A signed integer number. */
export type Integer = FieldDef & {
	type: `integer`;
	minimum?: number;
	maximum?: number;
	enum?: number[];
	default?: number;
	const?: number;
};
/** String with fields describing limitations such as length and format. */
export type String = FieldDef & {
	type: `string`;
	format?: string;
	maxLength?: number;
	minLength?: number;
	maxGraphemes?: number;
	minGraphemes?: number;
	knownValues?: string[];
	enum?: string[];
	default?: string;
	const?: string;
};
/** base64-encoded in JSON, native bytes in CBOR. */
export type Bytes = FieldDef & {
	type: `bytes`;
	minLength?: number;
	maxLength?: number;
};
/** In DAG-CBOR encodes as a binary CID (multibase type 0x00) in a bytestring with CBOR tag 42.
 *
 * In JSON, encodes as $link object */
export type CidLink = FieldDef & {
	type: `cid-link`;
};
/** It's an array, man. */
export type Array<T extends AnySchemaObject> = FieldDef & {
	type: `array`;
	items: T;
	minLength?: number;
	maxLength?: number;
};
/** Object (called a 'map' in CBOR-land) */
export type Object = FieldDef & {
	type: `object`;
	properties: TSRecord<string, FieldTypes>;
	required?: string[];
	nullable?: string[];
};
/** Describes a blob stored in the PDS. */
export type Blob = FieldDef & {
	type: `blob`;
	accept?: `${string}/${string}`[];
	maxSize?: number;
};
/**
 * Tokens are empty data values which exist only to be referenced by name.
 * They are used to define a set of values with specific meanings.
 * The `description` field should clarify the meaning of the token.
 * Tokens encode as string data, with the string being the fully-qualified reference to the token itself
 * (NSID followed by an optional fragment).
 *
 * Tokens are similar to the concept of a "symbol" in some programming languages, distinct from strings,
 * variables, built-in keywords, or other identifiers.
 *
 * For example, tokens could be defined to represent the state of an entity (in a state machine),
 * or to enumerate a list of categories.
 */
export type Token = FieldDef & {
	type: `token`;
};
/**
 * Refs are a mechanism for re-using a schema definition in multiple places.
 * The `ref` string can be a global reference to a Lexicon type definition
 * (an NSID, optionally with a `#`-delimited name indicating a definition other than `main`),
 * or can indicate a local definition within the same Lexicon file (a `#` followed by a name).
 */
export type Ref = FieldDef & {
	type: `ref`;
	ref: string;
};
/** Unions represent that multiple possible types could be present at this location in the schema.
 * The references follow the same syntax as `ref`, allowing references to both global or local schema definitions.
 * Actual data will validate against a single specific type:
 * the union does not combine fields from multiple schemas, or define a new hybrid data type.
 * The different types are referred to as **variants**. */
export type Union = FieldDef & {
	type: `union`;
	refs: string[];
	close?: boolean;
};
/** Indicates than any data object could appear at this location, with no specific validation.
 * The top-level data must be an object (not a string, boolean, etc).
 * As with all other data types, the value null is not allowed unless the field is specifically marked as nullable. */
export type Unknown = FieldDef & {
	type: `unknown`;
};
/** Base type for everything in here that lands inside the lexicon. */
export type SchemaObject = {
	type:
		| `null`
		| `boolean`
		| `integer`
		| `string`
		| `bytes`
		| `cid-link`
		| `blob`
		| `array`
		| `object`
		| `params`
		| `token`
		| `ref`
		| `union`
		| `unknown`
		| `record`
		| `query`
		| `procedure`
		| `subscription`;
	description?: string;
};
