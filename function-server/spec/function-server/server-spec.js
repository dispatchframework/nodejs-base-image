/*
 * Copyright (c) 2018 VMware, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

describe("server tests", function() {
    // server depends on these environmental variables
    process.argv[2] = "../function.js";
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

            expect(r).toEqual({"myField": "Hello, Jon from Winterfell"});
        });

        it ("should return a FunctionError with fail function", async function() {
            const f = server.wrap(fail);
            try {
                let r = await f({'context': null, 'payload': null});
            } catch (err) {
                expect(err.type).toEqual(server.FUNCTION_ERROR);
                expect(err.message).toEqual("undefinedVariable is not defined");
            }
        });

        it ("should return an InputError with lower function on invalid input", async function() {
            const f = server.wrap(lower);
            try {
                let r = await f({'context': null, 'payload': 1});
            } catch (err) {
                expect(err.type).toEqual(server.INPUT_ERROR);
                expect(err.message).toEqual("payload is not of type string");
            }
        });
    });
});
