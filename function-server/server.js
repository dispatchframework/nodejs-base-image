/*
 * Copyright (c) 2018 VMware, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const {PORT} = process.env;

const util = require('util');

const INPUT_ERROR = 'InputError';
const FUNCTION_ERROR = 'FunctionError';

global.HEALTHY = true;

function printTo(logs) {
    return (str, ...args) => {
        logs.push(...util.format(str, ...args).split(/\r?\n/));
    }
}

function patchLog(stderr, stdout) {
    console.log = printTo(stdout);
    console.info = printTo(stdout);
    console.warn = printTo(stderr);
    console.error = printTo(stderr);
}

function wrap(f) {
    return async ({context, payload}) => {
        let [stderr, stdout, r, err] = [[], [], null, null];
        try {
            patchLog(stderr, stdout);
            if (context['timeout']) {
                r = await timeout(promisify(f)(context, payload), context['timeout']);
            } else {
                r = await f(context, payload);
            }
        } catch (e) {
            console.error(e.stack);
            let stacktrace = [];
            printTo(stacktrace)(e.stack);
            if (e instanceof TypeError) {
                err = {type: INPUT_ERROR, message: e.message, stacktrace: stacktrace};
            } else {
                if (e.message === 'timeout') {
                    HEALTHY = false;
                }
                err = {type: FUNCTION_ERROR, message: e.message, stacktrace: stacktrace};
            }
        }
        return {context: {logs: {stderr: stderr, stdout: stdout}, error: err}, payload: r};
    }
}

const fun = wrap(require(`${process.cwd()}/${process.argv[2]}`));
const createApp = require('./http-api');

const app = createApp(fun);
app.listen(PORT);

console.log("Function Runtime API started");

process.on('SIGTERM', process.exit);
process.on('SIGINT', process.exit);

module.exports = {
    INPUT_ERROR: INPUT_ERROR,
    FUNCTION_ERROR: FUNCTION_ERROR,
    printTo: printTo,
    patchLog: patchLog,
    wrap: wrap
};

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function timeout(p, ms) {
    return Promise.race([p, wait(ms).then(resolve => { throw new Error("timeout") })]);
}

function promisify(f, target) {
    return async function() {
        var appliedArgs = arguments
        return new Promise(async (resolve, reject) => {
            try {
                resolve(await f.apply(target, appliedArgs))
            } catch (e) {
                reject(e)
            }
        });
    }
}
