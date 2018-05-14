/*
 * Copyright (c) 2018 VMware, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

describe("http-api tests", function() {
    // server depends on these environmental variables
    process.env.FUNCTION_MODULE = "../function";
    process.env.PORT = 8080;

    const server = require('../../server');
    const createApp = require('../../http-api');
    const request = require('supertest');

    const SYSTEM_ERROR = 'SystemError';

    describe("app valid request", function() {
        it("should correctly return json response", function(done) {
            const fun = server.wrap((context, params) => {
                console.log("log");
                console.info("info");
                console.warn("warn");
                console.error("error");
                return params;
            });
            const app = createApp(fun);

            request(app)
                .post('/')
                .type('application/json')
                .send('{"context": null, "payload": {"name": "Jon", "place": "Winterfell"}}')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200)
                .expect((res) => {
                    expect(res.body.payload.name).toEqual("Jon");
                    expect(res.body.payload.place).toEqual("Winterfell");
                    expect(res.body.context.logs.stderr).toEqual(["warn", "error"]);
                    expect(res.body.context.logs.stdout).toEqual(["log", "info"]);
                    expect(res.body.context.error).toBeNull();
                })
                .end(done);
        });
    });

    describe("app error handling", function() {
        const fun = server.wrap((context, params) => {});
        const app = createApp(fun);

        it("should return json error response upon invalid json request", function(done) {
            request(app)
                .post('/')
                .type('application/json')
                .send("{")
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(500)
                .expect((res) => {
                    expect(res.body.payload).toBeNull();
                    expect(res.body.context.logs.stderr[0]).toEqual("SyntaxError: Unexpected end of JSON input");
                    expect(res.body.context.logs.stdout.length === 0).toBeTruthy();
                    expect(res.body.context.error.type).toEqual(SYSTEM_ERROR);
                    expect(res.body.context.error.message).toEqual("Unexpected end of JSON input");
                    expect(res.body.context.error.stacktrace).toEqual(res.body.context.logs.stderr);
                })
                .end(done);
        });

        it("should return error when request entity is too large", function(done) {
            // Create long string greater than default limit 100kb
            var longString = "a";
            var iterations = 14;
            for (var i = 0; i < iterations; i++) {
              longString += longString+longString;
            }

            request(app)
                .post('/')
                .set('Accept', 'application/json')
                .type('application/json')
                .send(longString)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(500)
                .expect((res) => {
                    expect(res.body.payload).toBeNull();
                    expect(res.body.context.logs.stderr[0]).toEqual("PayloadTooLargeError: request entity too large");
                    expect(res.body.context.logs.stdout.length === 0).toBeTruthy();
                    expect(res.body.context.error.type).toEqual(SYSTEM_ERROR);
                    expect(res.body.context.error.message).toEqual("request entity too large");
                    expect(res.body.context.error.stacktrace).toEqual(res.body.context.logs.stderr);
                })
                .end(done);
        });
    });
});