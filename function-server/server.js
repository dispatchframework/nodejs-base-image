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

function wrap(f) {
    return async ({context, payload}) => {
        let [r, err] = [null, null];
        try {
            r = await f(context, payload);
        } catch (e) {
            let stacktrace = [];
            printTo(stacktrace)(e.stack);
            if (e instanceof TypeError) {
                return {type: INPUT_ERROR, message: e.message, stacktrace: stacktrace};
            } else {
                return {type: FUNCTION_ERROR, message: e.message, stacktrace: stacktrace};
            }
        }
        return r;
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
    wrap: wrap
};
