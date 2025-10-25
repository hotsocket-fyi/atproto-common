/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { AtURI } from "../mod.ts";
import { assertEquals } from "@std/assert";

Deno.test("aturi: parse: single", () => {
	const tval = AtURI.parse("at://example.com/com.example.something.other/probablygoodrkey");
	assertEquals(tval.okValue()?.toString().okValue(), "at://example.com/com.example.something.other/probablygoodrkey");
});

Deno.test("aturi: parse: both", () => {
	const tval = AtURI.parse("com.example.something.other", "at://example.com");
	assertEquals(tval.okValue()?.toString().okValue(), "at://example.com/com.example.something.other");
});

Deno.test("aturi: parse: overwrite", () => {
	const tval = AtURI.parse("at://elpmaxe.com", "at://example.com");
	assertEquals(tval.okValue()?.toString().okValue(), "at://elpmaxe.com");
});
