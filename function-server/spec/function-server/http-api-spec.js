/*
 * Copyright (c) 2018 VMware, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

describe("http-api tests", function() {
    // server depends on these environmental variables
    process.argv[2] = "../function.js";
    process.env.PORT = 8080;

    const server = require('../../server');
    const createApp = require('../../http-api');
    const request = require('supertest');

    const SYSTEM_ERROR = 'SystemError';

    describe("app valid request", function() {
        it("should correctly return json response", function(done) {
            const fun = server.wrap((context, params) => {
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
                    expect(res.body.name).toEqual("Jon");
                    expect(res.body.place).toEqual("Winterfell");
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
                    expect(res.body.type).toEqual(SYSTEM_ERROR);
                    expect(res.body.message).toEqual("Unexpected end of JSON input");
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
                    expect(res.body.type).toEqual(SYSTEM_ERROR);
                    expect(res.body.message).toEqual("request entity too large");
                })
                .end(done);
        });
    });
});