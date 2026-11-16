// LICENSE : MIT
"use strict";
import assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { matchAll, matchCaptureGroupAll, MatchAllGroup } from "../src/match-index";

/**
 * The results of `matchAll` and `matchCaptureGroupAll` are kept in test/snapshots/results.json.
 * These tests fix the current results, including the odd ones, so that a change of the implementation does not change them.
 *
 * Update the file with: UPDATE_SNAPSHOT=1 npm test
 */
const snapshotFilePath = path.join(__dirname, "snapshots", "results.json");
const shouldUpdate = !!process.env.UPDATE_SNAPSHOT;
const snapshots: { [name: string]: unknown } = shouldUpdate ? {} : JSON.parse(fs.readFileSync(snapshotFilePath, "utf-8"));
/**
 * Convert the value to a value that JSON keeps: `undefined` is kept as a string.
 */
const toComparable = (value: unknown): unknown => {
    return JSON.parse(
        JSON.stringify(value, (_key, item) => {
            return item === undefined ? "[undefined]" : item;
        })
    );
};
const assertSnapshot = (name: string, value: unknown) => {
    const actual = toComparable(value);
    if (shouldUpdate) {
        snapshots[name] = actual;
        return;
    }
    assert.ok(Object.prototype.hasOwnProperty.call(snapshots, name), `No snapshot: ${name}`);
    assert.deepStrictEqual(actual, snapshots[name], name);
};
/**
 * Call the function, and return the result or the name of the thrown error.
 */
const resultOf = (fn: () => unknown) => {
    try {
        return { result: fn() };
    } catch (error) {
        return { error: String(error && (error as Error).name) };
    }
};
const texts = [
    "",
    "a",
    "aabccde",
    "abc1abc1",
    "test1test2",
    "Hi Hi Hi ",
    "123xxx789",
    "ABC ABC abc",
    "undefined is undefined",
    "line 1\nline 2\r\nline 3\n",
    "これは 日本語 のテキストです。ABC と １２３ を含む（括弧 ）。",
    "全角スペース　と 半角スペース ( a ) [ b ]",
    "ｶﾀｶﾅ と カタカナ・ひらがな",
    "𠮷野家で𩸽を食べる😀😀",
    "\uD842 lone surrogate \uDFB7",
    "aaaa",
    "\uD842a𠮷\uDFB7",
    "a-b_c d",
    "2016-12-24 and 2026-11-16"
];
const patterns: RegExp[] = [
    /(a)/,
    /(a.)(b)(c.)d/,
    /([a-z])*([a-z])*(1)/,
    /t(e)(st(\d?))/g,
    /Hi(\s)/g,
    /(x+)/,
    /(x*)/,
    /(ABC)/,
    /(ABC)/i,
    /(abc)/gi,
    /(ABC).*?(EFG)/,
    /(a)|(b)/g,
    /(a)?(b)?(c)/,
    /(undefined)?(x)?/,
    /()/,
    /()()/g,
    /(?:)/,
    /(a*)(a*)/,
    /(a)(a)/,
    /(a)(?=(a))/g,
    /^(.)/,
    /^(.)/m,
    /(.)$/gm,
    /(.)/s,
    /(.)/u,
    /(.)/gu,
    /()/u,
    /(\u{20BB7})/u,
    /(a)/y,
    /(a)/gy,
    /(\d+)-(\d+)-(\d+)/,
    /(?<year>\d+)-(?<month>\d+)/,
    /(?<letter>a)/g,
    /(?<!\d)(\d)/g,
    /([ 　])\(/g,
    /（([ 　])/g,
    /([０-９]+)/,
    /([･-ﾟ]+)/g,
    /[A-Za-z0-9]([ 　])(?:[㐀-䶿一-鿿豈-﫿]|[\uD840-\uD87F][\uDC00-\uDFFF]|[ぁ-んァ-ヶ])/,
    /(?:[㐀-䶿一-鿿豈-﫿]|[\uD840-\uD87F][\uDC00-\uDFFF]|[ぁ-んァ-ヶ])([ 　])[A-Za-z0-9]/,
    /(\s)+/g,
    /(\b)/g,
    /(\r?\n)/g
];

/**
 * These patterns match at almost every position of the text.
 * They are tested with short texts only, to keep the snapshot file small.
 */
const everyPositionPatterns = [/(undefined)?(x)?/, /()()/g, /(a*)(a*)/, /()/, /(x*)/, /()/u, /(.)/s, /(.)/u, /(.)/gu, /(?:)/]
    .map(pattern => String(pattern));
const SHORT_TEXT_LENGTH = 15;

describe("results", function () {
    after(function () {
        if (shouldUpdate) {
            fs.mkdirSync(path.dirname(snapshotFilePath), { recursive: true });
            // one snapshot in one line
            const lines = Object.keys(snapshots).map(name => {
                return `${JSON.stringify(name)}: ${JSON.stringify(snapshots[name])}`;
            });
            fs.writeFileSync(snapshotFilePath, `{\n${lines.join(",\n")}\n}\n`);
        }
    });
    patterns.forEach(pattern => {
        it(`${pattern} returns the same results as the snapshot`, function () {
            const targetTexts = everyPositionPatterns.indexOf(String(pattern)) !== -1
                ? texts.filter(text => text.length <= SHORT_TEXT_LENGTH)
                : texts;
            targetTexts.forEach(text => {
                const result = resultOf(() => matchAll(text, pattern));
                assertSnapshot(`matchAll(${JSON.stringify(text)}, ${pattern})`, result);
                // matchCaptureGroupAll returns the capture groups of all matches in a single array
                const captureGroups: unknown[] = [];
                (result.result as MatchAllGroup[]).forEach(match => {
                    match.captureGroups.forEach(captureGroup => captureGroups.push(captureGroup));
                });
                assert.deepStrictEqual(matchCaptureGroupAll(text, pattern), captureGroups);
            });
        });
    });
    it("matchCaptureGroupAll throws an error for a RegExp without a capture group", function () {
        texts.forEach(text => {
            assert.throws(() => matchCaptureGroupAll(text, /a/g));
        });
    });
    it("returns the same results when the same RegExp object is used again and again", function () {
        const pattern = /(a)(b)?/;
        texts.forEach(text => {
            const first = matchAll(text, pattern);
            assertSnapshot(`again and again: ${JSON.stringify(text)}`, first);
            assert.deepStrictEqual(matchAll(text, pattern), first);
            assert.deepStrictEqual(matchAll(text, pattern), first);
        });
    });
    it("returns the results of each flags for the same source", function () {
        const text = "ABC abc\nabc ABC";
        [/^(abc)/, /^(abc)/i, /^(abc)/m, /^(abc)/gim, /^(abc)/y, /^(abc)/].forEach((pattern, index) => {
            assertSnapshot(`same source with other flags: ${index} ${pattern}`, matchAll(text, pattern));
        });
    });
    it("returns the same results for RegExp objects created in every call", function () {
        const text = "ABC abc ABC";
        const first = matchAll(text, new RegExp("(A)(B)", "g"));
        assertSnapshot("RegExp created in every call", first);
        assert.deepStrictEqual(matchAll(text, new RegExp("(A)(B)", "g")), first);
        assert.deepStrictEqual(matchAll(text, new RegExp("(A)(B)", "g")), first);
    });
    it("returns the same results for many patterns", function () {
        const text = "a1 a22 a333 a1";
        const createPattern = (i: number) => new RegExp(`(a)(${i % 1050})`);
        const results: { [pattern: string]: unknown } = {};
        for (let i = 0; i < 2100; i++) {
            const pattern = createPattern(i);
            const result = matchAll(text, pattern);
            if (i < 1050) {
                if (result.length > 0) {
                    results[String(pattern)] = result;
                }
            } else {
                // the same pattern as 1050 patterns before
                assert.deepStrictEqual(result, matchAll(text, createPattern(i)), String(pattern));
                assert.deepStrictEqual(toComparable(result), toComparable(results[String(pattern)] || []));
            }
        }
        assertSnapshot("many patterns", results);
    });
    it("does not read and does not change lastIndex of the RegExp", function () {
        const text = "ABC ABC ABC";
        const expected = matchAll(text, /(ABC)/g);
        assert.strictEqual(expected.length, 3);
        const pattern = /(ABC)/g;
        pattern.lastIndex = 5;
        assert.deepStrictEqual(matchAll(text, pattern), expected);
        assert.strictEqual(pattern.lastIndex, 5);
        assert.deepStrictEqual(matchAll(text, pattern), expected);
        const expectedSticky = matchAll(text, /(ABC)/y);
        assert.strictEqual(expectedSticky.length, 1);
        const sticky = /(ABC)/y;
        sticky.lastIndex = 4;
        assert.deepStrictEqual(matchAll(text, sticky), expectedSticky);
        assert.strictEqual(sticky.lastIndex, 4);
    });
    it("restores lastIndex of a global RegExp for named capture groups and for an error", function () {
        const named = /(?<letter>a)/g;
        named.lastIndex = 2;
        assert.strictEqual(matchAll("aaa", named).length, 3);
        assert.strictEqual(named.lastIndex, 2);
        const pattern = /(a)/g;
        pattern.lastIndex = 2;
        assert.throws(() => matchAll(undefined as any, pattern));
        assert.strictEqual(pattern.lastIndex, 2);
    });
    it("returns the same results for a frozen RegExp", function () {
        const text = "ABC ABC ABC";
        const expected = matchAll(text, /(ABC)/g);
        assert.deepStrictEqual(matchAll(text, Object.freeze(/(ABC)/g) as RegExp), expected);
        assert.deepStrictEqual(matchAll(text, Object.freeze(/(ABC)/) as RegExp), expected);
    });
    it("returns the same results in a call during another call", function () {
        const text = "ab ab ab";
        const pattern = /(a)(b)/g;
        const expected = matchAll(text, pattern);
        assert.strictEqual(expected.length, 3);
        const results = matchAll(text, pattern).map(() => matchAll(text, pattern));
        assert.deepStrictEqual(results, [expected, expected, expected]);
    });
    it("returns the result or throws the error for a text that is not a string", function () {
        [undefined, null, 123, 1213, {}, ["a", "b"], new String("aabccde")].forEach((text, index) => {
            [/(1)/, /(a.)(b)(c.)d/, /(x)/].forEach(pattern => {
                assertSnapshot(
                    `not a string: ${index} ${String(text)} ${pattern}`,
                    resultOf(() => matchAll(text as any, pattern))
                );
            });
        });
    });
});
