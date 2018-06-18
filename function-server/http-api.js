/*
 * Copyright (c) 2018 VMware, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const SYSTEM_ERROR = 'SystemError';

module.exports = (fun) => {
    const app = express();

    app.get('/healthz', (req, res) => {
        if (!HEALTHY) {
            res.statusCode = 500
        }
        res.json({});
    });

    app.use(/.*/, bodyParser.json({strict: false}));

    app.post(/.*/, async (req, res) => {
        res.json(await fun(req.body));
    });

    app.use(function errorHandler (err, req, res, next) {
      if (res.headersSent) {
        return next(err);
      }
      let stacktrace = err.stack.split(/\r?\n/);
      let e = {type: SYSTEM_ERROR, message: err.message, stacktrace: stacktrace};
      res.status(500);
      res.json({context: {logs: {stderr: stacktrace, stdout: []}, error: e}, payload: null});
    });

    return app;
};
