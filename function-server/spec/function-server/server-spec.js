/*
 * Copyright (c) 2018 VMware, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

describe("server tests", function() {
    // server depends on these environmental variables
    process.env.FUNCTION_MODULE = "../function";
    process.env.PORT = 8080;

    const server = require('../../server');

    const logger = function(context, params) {
        console.log("log");
        console.info("info");
        console.warn("warn");
        console.error("error");

        console.log("log2");
        console.info("info2");
        console.warn("warn2");
        console.error("error2");
    };

    describe("function printTo", function() {
        it("should return correct function", function() {
            let logs = [];
            const print = server.printTo(logs);

            print("line1", "line2");
            print("line3\n", "line4");
            print("line5\nline6");

            expect(logs).toEqual(["line1 line2", "line3", " line4", "line5", "line6"]);
        });
    });

    describe("function patchLog", function() {
        it("should print to correct logs", function() {
            let [stderr, stdout] = [[], []];
            server.patchLog(stderr, stdout);

            logger();

            expect(stdout).toEqual(["log", "info", "log2", "info2"]);
            expect(stderr).toEqual(["warn", "error", "warn2", "error2"]);
        });
    });

    describe("function wrap", function() {

        const hello = function (context, params) {
            let name = "Noone";
            if (params.name) {
                name = params.name;
            }
            let place = "Nowhere";
            if (params.place) {
                place = params.place;
            }
            return {myField: 'Hello, ' + name + ' from ' + place}; 
        };

        const fail = function(context, params) {
            let a = undefinedVariable;
        };

        const lower = function(context, params) {
            if (typeof params !== 'string') {
                throw new TypeError("payload is not of type string");
            }

            return params.toLowerCase();
        };

        it("should return valid response with hello function" , async function() {
            let payload = {"name": "Jon", "place": "Winterfell"};
            const f = server.wrap(hello);
            
            let r = await f({'context': null, 'payload': payload});

            expect(r.context.error).toBeNull();
            expect(r.context.logs.stdout.length === 0).toBeTruthy();
            expect(r.context.logs.stderr.length === 0).toBeTruthy();
            expect(r.payload).toEqual({"myField": "Hello, Jon from Winterfell"});
        });

        it ("should return a FunctionError with fail function", async function() {
            const f = server.wrap(fail);
            let r = await f({'context': null, 'payload': null});

            expect(r.context.error.type).toEqual(server.FUNCTION_ERROR);
            expect(r.context.error.message).toEqual("undefinedVariable is not defined");
            expect(r.context.error.stacktrace).toEqual(r.context.logs.stderr);
            expect(r.context.logs.stderr[0].startsWith("ReferenceError: undefinedVariable is not defined")).toBeTruthy();
            expect(r.context.logs.stdout.length === 0).toBeTruthy();
            expect(r.payload).toBeNull();
        });

        it ("should return an InputError with lower function on invalid input", async function() {
            const f = server.wrap(lower);
            let r = await f({'context': null, 'payload': 1});

            expect(r.context.error.type).toEqual(server.INPUT_ERROR);
            expect(r.context.error.message).toEqual("payload is not of type string");
            expect(r.context.error.stacktrace).toEqual(r.context.logs.stderr);
            expect(r.context.logs.stderr[0].startsWith("TypeError: payload is not of type string")).toBeTruthy();
            expect(r.context.logs.stdout.length === 0).toBeTruthy();
            expect(r.payload).toBeNull();
        });

        it ("should return correct logs with logger function", async function() {
            const f = server.wrap(logger);
            let r = await f({'context': null, 'payload': null});

            expect(r.context.error).toBeNull();
            expect(r.context.logs.stdout).toEqual(["log", "info", "log2", "info2"]);
            expect(r.context.logs.stderr).toEqual(["warn", "error", "warn2", "error2"]);
            expect(r.payload).toBeUndefined();
        });
    });
});
