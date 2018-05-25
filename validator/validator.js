/*
 * Copyright (c) 2018 VMware, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const f = require(process.argv[2]);

if (typeof f !== 'function') {
    throw new TypeError("handler is not a function");
}