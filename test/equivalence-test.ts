// LICENSE : MIT
"use strict";
import assert from "assert";
import { matchAll, matchCaptureGroupAll } from "../src/match-index";
import * as original from "./fixtures/original-match-index";

/**
 * Call the function, and return the result or the thrown error as a comparable value.
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
    "a-b_c d",
    "2016-12-24 and 2026-11-16"
];
const patterns: RegExp[] = [
    /a/,
    /a/g,
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

describe("equivalence with match-index 1.0.3", function () {
    patterns.forEach(pattern => {
        it(`${pattern} returns the same results`, function () {
            texts.forEach(text => {
                assert.deepStrictEqual(
                    resultOf(() => matchAll(text, pattern)),
                    resultOf(() => original.matchAll(text, pattern)),
                    `matchAll(${JSON.stringify(text)}, ${pattern})`
                );
                assert.deepStrictEqual(
                    resultOf(() => matchCaptureGroupAll(text, pattern)),
                    resultOf(() => original.matchCaptureGroupAll(text, pattern)),
                    `matchCaptureGroupAll(${JSON.stringify(text)}, ${pattern})`
                );
            });
        });
    });
    it("returns the same results when the same pattern is used again and again", function () {
        const pattern = /(a)(b)?/;
        for (let i = 0; i < 3; i++) {
            texts.forEach(text => {
                assert.deepStrictEqual(matchAll(text, pattern), original.matchAll(text, pattern));
            });
        }
    });
    it("returns the same results for the same source with other flags", function () {
        const text = "ABC abc\nabc ABC";
        [/^(abc)/, /^(abc)/i, /^(abc)/m, /^(abc)/gim, /^(abc)/y, /^(abc)/].forEach(pattern => {
            assert.deepStrictEqual(matchAll(text, pattern), original.matchAll(text, pattern), String(pattern));
        });
    });
    it("returns the same results for RegExp objects created in every call", function () {
        const text = "ABC abc ABC";
        for (let i = 0; i < 3; i++) {
            assert.deepStrictEqual(
                matchAll(text, new RegExp("(A)(B)", "g")),
                original.matchAll(text, new RegExp("(A)(B)", "g"))
            );
        }
    });
    it("returns the same results for more patterns than the cache keeps", function () {
        const text = "a1 a22 a333 a1";
        for (let i = 0; i < 2100; i++) {
            const pattern = new RegExp(`(a)(${i % 1050})`);
            assert.deepStrictEqual(matchAll(text, pattern), original.matchAll(text, pattern), String(pattern));
        }
    });
    it("does not read and does not change lastIndex of the RegExp", function () {
        const text = "ABC ABC ABC";
        const pattern = /(ABC)/g;
        pattern.lastIndex = 5;
        const expected = original.matchAll(text, /(ABC)/g);
        assert.deepStrictEqual(matchAll(text, pattern), expected);
        assert.strictEqual(pattern.lastIndex, 5);
        assert.deepStrictEqual(matchAll(text, pattern), expected);
        const sticky = /(ABC)/y;
        sticky.lastIndex = 4;
        assert.deepStrictEqual(matchAll(text, sticky), original.matchAll(text, /(ABC)/y));
        assert.strictEqual(sticky.lastIndex, 4);
    });
    it("returns the same results in a call during another call", function () {
        const text = "ab ab ab";
        const pattern = /(a)(b)/g;
        const results = matchAll(text, pattern).map(() => matchAll(text, pattern));
        const expected = original.matchAll(text, pattern);
        assert.deepStrictEqual(results, [expected, expected, expected]);
    });
    it("returns the same results or throws the same error for a text that is not a string", function () {
        [undefined, null, 123, 1213, {}, ["a", "b"], new String("aabccde")].forEach(text => {
            [/(1)/, /(a.)(b)(c.)d/, /(x)/].forEach(pattern => {
                assert.deepStrictEqual(
                    resultOf(() => matchAll(text as any, pattern)),
                    resultOf(() => original.matchAll(text as any, pattern)),
                    `matchAll(${String(text)}, ${pattern})`
                );
            });
        });
    });
});
