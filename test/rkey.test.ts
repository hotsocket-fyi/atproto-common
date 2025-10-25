import { assert } from "@std/assert";
import { validateRecordKey } from "../mod.ts";

Deno.test("rkey: invalid: empty", () => {
	assert(!validateRecordKey("").ok, "empty rkey determined valid");
});

Deno.test("rkey: invalid: long rkey", () => {
	assert(!validateRecordKey("a".repeat(513)).ok, "rkey > 513 chars long determined valid");
});

Deno.test("rkey: invalid: multiple", () => {
	const tests = [
		`alpha/beta`,
		`.`,
		`..`,
		`#extra`,
		`@handle`,
		`any space`,
		`any+space`,
		`number[3]`,
		`number(3)`,
		`"quote"`,
		`dHJ1ZQ==`,
	];
	tests.forEach((v) => {
		assert(!validateRecordKey(v).ok, `rkey '${v}' determined valid`);
	});
});

Deno.test("rkey: valid: long rkey", () => {
	assert(validateRecordKey("a".repeat(512)).ok, "rkey = 512 chars long determined invalid");
});

Deno.test("rkey: valid: short rkey", () => {
	assert(validateRecordKey("a").ok, "rkey = 1 char long determined invalid");
});
