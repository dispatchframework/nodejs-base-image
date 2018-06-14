/*
 * Copyright (c) 2018 VMware, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const Promise = require('bluebird')
Promise.config({
    cancellation: true
})

var cluster = require('cluster')

const {PORT} = process.env;

const util = require('util');

const INPUT_ERROR = 'InputError';
const FUNCTION_ERROR = 'FunctionError';

var HEALTHY = true

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

function wrap(file) {
    cluster.setupMaster({
        exec: `${process.cwd()}/worker.js`
    });
    var f = require(file);
    return async ({context, payload}) => { 
        let [stderr, stdout, r, err] = [[], [], null, null];
        patchLog(stderr, stdout);
        try {
            if (context['timeout']) {
                var worker = cluster.fork({
                    FUNCTION: file,
                    CONTEXT: JSON.stringify(context),
                    PAYLOAD: JSON.stringify(payload)
                })
                var promise = new Promise((resolve, reject, onCancel) => {
                    onCancel(() => {
                        worker.kill();
                    })
                    cluster.on("message", (w, message) => {
                        console.log(JSON.stringify(message))
                        if (message instanceof TypeError) {
                            reject(message)
                        } else {
                            resolve(message)
                        }
                    });
                });
                r = await promise.timeout(context['timeout'])
            } else {
                r = await f(context, payload)
            }
        } catch (e) {
            console.error(e.stack);
            let stacktrace = [];
            printTo(stacktrace)(e.stack);
            if (e instanceof TypeError) {
                err = {type: INPUT_ERROR, message: e.message, stacktrace: stacktrace};
            } else if (e instanceof Promise.TimeoutError) {
                err = {type: FUNCTION_ERROR, message: e.message, stacktrace: stacktrace};
                HEALTHY = false;
            } else {
                err = {type: FUNCTION_ERROR, message: e.message, stacktrace: stacktrace};
            }
        }
        return {context: {logs: {stderr: stderr, stdout: stdout}, error: err}, payload: r};
    }
}

const fun = wrap(`${process.cwd()}/${process.argv[2]}`);
const createApp = require('./http-api');

const app = createApp(fun);
app.listen(PORT);

console.log("Function Runtime API started");

process.on('SIGTERM', process.exit);
process.on('SIGINT', process.exit);

module.exports = {
    INPUT_ERROR: INPUT_ERROR,
    FUNCTION_ERROR: FUNCTION_ERROR,
    HEALTHY: HEALTHY,
    printTo: printTo,
    patchLog: patchLog,
    wrap: wrap
};

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function timeout(p, ms) {
    return Promise.race([p, wait(ms).catch(() => {
        throw new Error("timeout")
    })]);
}