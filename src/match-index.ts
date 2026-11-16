// LICENSE : MIT
"use strict";
const flagsGetter = require("regexp.prototype.flags");
const assert = require("assert");

/**
 * @typedef {Object} MatchCaptureGroup
 * @property {string} text - text is matched texts
 * @property {number} index - index is start of match
 */
export type MatchCaptureGroup = {
    text: string;
    index: number;
}
export type MatchAllGroup = {
    all: string[];
    input: string;
    index: number;
    captureGroups: MatchCaptureGroup[]
}

/**
 * Return a new RegExp object that has the same source and flags with `regExp`, and has the `g` flag.
 */
const createGlobalRegExp = (regExp: RegExp): RegExp => {
    const flags: string = regExp.flags || flagsGetter(regExp);
    return new RegExp(regExp.source, flags.indexOf("g") === -1 ? "g" + flags : flags);
};

/**
 * Return the index after an empty match at `index`.
 * It is AdvanceStringIndex of ECMAScript: with the `u` or `v` flag, it does not stop inside of a surrogate pair.
 */
const advanceIndex = (text: string, index: number, fullUnicode: boolean): number => {
    if (fullUnicode && index + 1 < text.length) {
        const first = text.charCodeAt(index);
        if (first >= 0xd800 && first <= 0xdbff) {
            const second = text.charCodeAt(index + 1);
            if (second >= 0xdc00 && second <= 0xdfff) {
                return index + 2;
            }
        }
    }
    return index + 1;
};

/**
 * Compute the index of each capture group of the match.
 * It searches the text of each capture group from the end of the previous capture group.
 */
const createCaptureGroups = (text: string, match: string[], matchIndex: number): MatchCaptureGroup[] => {
    const captureGroups: MatchCaptureGroup[] = [];
    const lastGroup = match.length - 1;
    for (let cursor = matchIndex, i = 1; i <= lastGroup; i++) {
        const group = match[i];
        let index = cursor;
        if (i !== lastGroup && group !== match[i + 1]) {
            const nextIndex = text.indexOf(match[i + 1], cursor);
            while (true) {
                const currentIndex = text.indexOf(group, index);
                if (currentIndex !== -1 && currentIndex <= nextIndex) {
                    index = currentIndex + 1;
                } else {
                    break;
                }
            }
            index--;
        } else {
            index = text.indexOf(group, cursor);
        }
        cursor = index + (group ? group.length : 0);
        captureGroups.push({
            text: group,
            index
        });
    }
    return captureGroups;
};

/**
 * `matchAll` for a RegExp that has named capture groups.
 * The replacer function of String.prototype.replace gets the `groups` object as the last argument for the RegExp,
 * and the result depends on it.
 * This keeps the result as it is.
 */
const matchAllByReplace = (text: string, rx: RegExp): MatchAllGroup[] => {
    const matches: MatchAllGroup[] = [];
    text.replace(rx, function () {
        const all: string[] = Array.prototype.slice.call(arguments, 0, -2);
        const index: number = arguments[arguments.length - 2];
        matches.push({
            all,
            input: arguments[arguments.length - 1],
            index,
            captureGroups: createCaptureGroups(text, all, index)
        });
        return "";
    });
    return matches;
};

/**
 * @param {string} text
 * @param {RegExp} regExp regExp should include capture
 * @returns {MatchCaptureGroup[]} return array of MatchCaptureGroup
 */
export function matchCaptureGroupAll(text: string, regExp: RegExp): MatchCaptureGroup[] {
    const source = regExp.source;
    assert(source.indexOf("(") >= 0, "RegExp should contains capture group at least one");
    const all = matchAll(text, regExp);
    const captureGroups: MatchCaptureGroup[] = [];
    for (let i = 0; i < all.length; i++) {
        const groups = all[i].captureGroups;
        for (let j = 0; j < groups.length; j++) {
            captureGroups.push(groups[j]);
        }
    }
    return captureGroups;
}

/**
 * matchAll function inspired String.prototype.matchAll
 * @param {String} text
 * @param {RegExp} regExp
 * @returns {MatchAllGroup[]}
 * @see reference https://github.com/tc39/String.prototype.matchAll
 * http://stackoverflow.com/questions/15934353/get-index-of-each-capture-in-a-javascript-regex
 */
export function matchAll(text: string, regExp: RegExp): MatchAllGroup[] {
    // A global RegExp is used as it is, without creating a RegExp object in every call.
    // It matches from the start of the text, and `lastIndex` is restored after that.
    if (regExp.global && Object.getPrototypeOf(regExp) === RegExp.prototype) {
        const lastIndex = regExp.lastIndex;
        let isWritable = true;
        try {
            regExp.lastIndex = 0;
        } catch (error) {
            // a frozen RegExp
            isWritable = false;
        }
        if (isWritable) {
            try {
                return matchAllByGlobalRegExp(text, regExp);
            } finally {
                regExp.lastIndex = lastIndex;
            }
        }
    }
    // Search first, and collect only when the text has a match: most calls have no match.
    // A RegExp without the g and y flags searches from the start of the text, and does not change `lastIndex`.
    if (
        !regExp.global &&
        !regExp.sticky &&
        typeof text === "string" &&
        Object.getPrototypeOf(regExp) === RegExp.prototype &&
        regExp.exec(text) === null
    ) {
        return [];
    }
    return matchAllByGlobalRegExp(text, createGlobalRegExp(regExp));
}

/**
 * @param text
 * @param rx a RegExp that has the `g` flag, and its `lastIndex` is 0
 */
function matchAllByGlobalRegExp(text: string, rx: RegExp): MatchAllGroup[] {
    const matches: MatchAllGroup[] = [];
    if (typeof text !== "string") {
        // keep the behavior for a value that is not a string: it is an error, or the value decides the result
        return matchAllByReplace(text, rx);
    }
    let match = rx.exec(text);
    if (match === null) {
        return matches;
    }
    if (match.groups !== undefined) {
        rx.lastIndex = 0;
        return matchAllByReplace(text, rx);
    }
    const fullUnicode = rx.unicode || (rx as any).unicodeSets === true;
    do {
        const all: string[] = [];
        for (let i = 0; i < match.length; i++) {
            all.push(match[i]);
        }
        matches.push({
            all,
            input: text,
            index: match.index,
            captureGroups: createCaptureGroups(text, all, match.index)
        });
        if (match[0] === "") {
            rx.lastIndex = advanceIndex(text, rx.lastIndex, fullUnicode);
        }
        match = rx.exec(text);
    } while (match !== null);
    return matches;
}
