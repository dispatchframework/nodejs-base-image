/*
 * Copyright (c) 2018 VMware, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const {PORT} = process.env;

const util = require('util');

const INPUT_ERROR = 'InputError';
const FUNCTION_ERROR = 'FunctionError';

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
            r = await f(context, payload);
        } catch (e) {
            console.error(e.stack);
            let stacktrace = [];
            printTo(stacktrace)(e.stack);
            if (e instanceof TypeError) {
                err = {type: INPUT_ERROR, message: e.message, stacktrace: stacktrace};
            } else {
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