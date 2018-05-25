/*
 * Copyright (c) 2018 VMware, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

 'use strict';

 describe("validator tests", function() {
    it("should fail with nonexistent handler", function() {
        process.argv[2] = 'nonexistent.js';

        expect(() => {require('../../validator')}).toThrowError();
    });

    it("should fail with non-function type", function () {
        process.argv[2] = __dirname + '/handlers/non-function.js';

        expect(() => {require('../../validator')}).toThrowError(TypeError);
    });

    it("should fail without module.exports set", function() {
        process.argv[2] = __dirname + '/handlers/no-export.js';

        expect(() => {require('../../validator')}).toThrowError(TypeError);
    });

    it("should succeed with valid handler", function() {
        process.argv[2] = __dirname + '/handlers/valid-handler.js';

        expect(() => {require('../../validator')}).not.toThrowError();
    });
 });