// LICENSE : MIT
"use strict";
const assert = require("power-assert");
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
                assert.equal(captureGroups.length, 1);
                const x = captureGroups[0];
                assert.equal(x.text, "ABC");
                assert.equal(x.index, 8);
            });
            it("example should return correct", function () {
                const text = "aabccde";
                const regExp = /(a.)(b)(c.)d/;
                const captureGroups = matchCaptureGroupAll(text, regExp);
                assert.equal(captureGroups.length, 3);
                const [a, b, c ]= captureGroups;
                assert.equal(a.text, "aa");
                assert.equal(a.index, 0);
                assert.equal(b.text, "b");
                assert.equal(b.index, 2);
                assert.equal(c.text, "cc");
                assert.equal(c.index, 3);
            });
        });
        context("when multiple hit!", function () {
            it("should get multiple results", function () {
                const captureGroups = matchCaptureGroupAll("ABC ABC", /(ABC)/);
                assert.equal(captureGroups.length, 2);
                const [x, y] = captureGroups;
                assert.equal(x.text, "ABC");
                assert.equal(x.index, 0);
                assert.equal(y.text, "ABC");
                assert.equal(y.index, 4);
            });
        });
        context("when include multiple ( and ) ", function () {
            it("should get multiple results", function () {
                const captureGroups = matchCaptureGroupAll("ABC EFG", /(ABC).*?(EFG)/);
                assert(captureGroups.length, 2);
                const [x, y] = captureGroups;
                assert.equal(x.text, "ABC");
                assert.equal(x.index, 0);
                assert.equal(y.text, "EFG");
                assert.equal(y.index, 4);
            });
        });

        context("when include + plugin", function () {
            it("should get a single result", function () {
                const captureGroups = matchCaptureGroupAll("123xxx789", /(x+)/);
                assert.equal(captureGroups.length, 1);
                const x = captureGroups[0];
                assert.equal(x.text, "xxx");
                assert.equal(x.index, 3);
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
                assert.equal(matchXGroup.length, 1);
            });
        });
    });
    describe("#matchAll", function () {
        it("should return MatchAllGroup", function () {
            const text = 'test1test2';
            const regexp = /t(e)(st(\d?))/g;
            const captureGroups = matchAll(text, regexp);
            assert.equal(captureGroups.length, 2);
            const [test1, test2] = captureGroups;
            assert.equal(test1.index, 0);
            assert.equal(test1.input, text);
            assert.deepEqual(test1.all, ['test1', 'e', 'st1', '1']);
            assert.deepEqual(test1.captureGroups, [
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
            assert.equal(test2.index, 5);
            assert.equal(test2.input, text);
            assert.deepEqual(test2.all, ['test2', 'e', 'st2', '2']);
            assert.deepEqual(test2.captureGroups, [
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
            assert.equal(captureGroups.length, 3);
            const [test1, test2, test3] = captureGroups;
            assert.equal(test1.index, 0);
            assert.equal(test1.input, text);
            assert.deepEqual(test1.all, ["Hi ", " "]);
            assert.deepEqual(test1.captureGroups, [
                {
                    index: 2,
                    text: ' '
                }
            ]);
            assert.equal(test2.index, 3);
            assert.equal(test2.input, text);
            assert.deepEqual(test2.all, ["Hi ", " "]);
            assert.deepEqual(test2.captureGroups, [
                {
                    index: 5,
                    text: ' '
                }
            ]);
        });
    });
});