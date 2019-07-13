// LICENSE : MIT
"use strict";
import assert from "assert";
import {matchAll, matchCaptureGroupAll} from "../src/match-index";
describe("match-index-test", function () {
    describe("#matchCaptureGroupAll", function () {
        context("when not include ( or ) ", function () {
            it("should throw error", function () {
                assert.throws(() => {
                    matchCaptureGroupAll("text", /a/);
                });
            });
        });
        context("when include one ( and ) ", function () {
            it("should get one capture", function () {
                const captureGroups = matchCaptureGroupAll("This is ABC", /(ABC)/);
                assert.strictEqual(captureGroups.length, 1);
                const x = captureGroups[0];
                assert.strictEqual(x.text, "ABC");
                assert.strictEqual(x.index, 8);
            });
            it("example should return correct", function () {
                const text = "aabccde";
                const regExp = /(a.)(b)(c.)d/;
                const captureGroups = matchCaptureGroupAll(text, regExp);
                assert.strictEqual(captureGroups.length, 3);
                const [a, b, c ]= captureGroups;
                assert.strictEqual(a.text, "aa");
                assert.strictEqual(a.index, 0);
                assert.strictEqual(b.text, "b");
                assert.strictEqual(b.index, 2);
                assert.strictEqual(c.text, "cc");
                assert.strictEqual(c.index, 3);
            });
        });
        context("when multiple hit!", function () {
            it("should get multiple results", function () {
                const captureGroups = matchCaptureGroupAll("ABC ABC", /(ABC)/);
                assert.strictEqual(captureGroups.length, 2);
                const [x, y] = captureGroups;
                assert.strictEqual(x.text, "ABC");
                assert.strictEqual(x.index, 0);
                assert.strictEqual(y.text, "ABC");
                assert.strictEqual(y.index, 4);
            });
        });
        context("when include multiple ( and ) ", function () {
            it("should get multiple results", function () {
                const captureGroups = matchCaptureGroupAll("ABC EFG", /(ABC).*?(EFG)/);
                assert.strictEqual(captureGroups.length, 2);
                const [x, y] = captureGroups;
                assert.strictEqual(x.text, "ABC");
                assert.strictEqual(x.index, 0);
                assert.strictEqual(y.text, "EFG");
                assert.strictEqual(y.index, 4);
            });
        });

        context("when include + plugin", function () {
            it("should get a single result", function () {
                const captureGroups = matchCaptureGroupAll("123xxx789", /(x+)/);
                assert.strictEqual(captureGroups.length, 1);
                const x = captureGroups[0];
                assert.strictEqual(x.text, "xxx");
                assert.strictEqual(x.index, 3);
            });
        });
        context("when include * star", function () {
            it("should get multiple results, 0 >= ", function () {
                var text = "123xxx789";
                const captureGroups = matchCaptureGroupAll(text, /(x*)/);
                assert(captureGroups.length > 1);
                const matchXGroup = captureGroups.filter(group => {
                    return group.text === "xxx"
                });
                assert.strictEqual(matchXGroup.length, 1);
            });
        });
    });
    describe("#matchAll", function () {
        it("should return MatchAllGroup", function () {
            const text = 'test1test2';
            const regexp = /t(e)(st(\d?))/g;
            const captureGroups = matchAll(text, regexp);
            assert.strictEqual(captureGroups.length, 2);
            const [test1, test2] = captureGroups;
            assert.strictEqual(test1.index, 0);
            assert.strictEqual(test1.input, text);
            assert.deepStrictEqual(test1.all, ['test1', 'e', 'st1', '1']);
            assert.deepStrictEqual(test1.captureGroups, [
                {
                    index: 1,
                    text: 'e'
                }, {
                    index: 2,
                    text: 'st1'
                }, {
                    index: -1,// Limitation of capture nest
                    text: '1'
                }
            ]);
            assert.strictEqual(test2.index, 5);
            assert.strictEqual(test2.input, text);
            assert.deepStrictEqual(test2.all, ['test2', 'e', 'st2', '2']);
            assert.deepStrictEqual(test2.captureGroups, [
                {
                    index: 6,
                    text: 'e'
                }, {
                    index: 7,
                    text: 'st2'
                }, {
                    index: -1, // Limitation
                    text: '2'
                }
            ]);
        });
        it("should return MatchAllGroup", function () {
            const text = 'Hi Hi Hi ';
            const regexp = /Hi(\s)/g;
            const captureGroups = matchAll(text, regexp);
            assert.strictEqual(captureGroups.length, 3);
            const [test1, test2] = captureGroups;
            assert.strictEqual(test1.index, 0);
            assert.strictEqual(test1.input, text);
            assert.deepStrictEqual(test1.all, ["Hi ", " "]);
            assert.deepStrictEqual(test1.captureGroups, [
                {
                    index: 2,
                    text: ' '
                }
            ]);
            assert.strictEqual(test2.index, 3);
            assert.strictEqual(test2.input, text);
            assert.deepStrictEqual(test2.all, ["Hi ", " "]);
            assert.deepStrictEqual(test2.captureGroups, [
                {
                    index: 5,
                    text: ' '
                }
            ]);
        });
    });
});
