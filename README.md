# nodejs-base-image
JavaScript (Node.js) support for Dispatch

Latest image [on Docker Hub](https://hub.docker.com/r/dispatchframework/nodejs-base/): `dispatchframework/nodejs-base:0.0.6`

## Usage

You need a recent version of Dispatch [installed in your Kubernetes cluster, Dispatch CLI configured](https://vmware.github.io/dispatch/documentation/guides/quickstart) to use it.

### Adding the Base Image

To add the base-image to Dispatch:
```bash
$ dispatch create base-image nodejs-base dispatchframework/nodejs-base:0.0.6
```

Make sure the base-image status is `READY` (it normally goes from `INITIALIZED` to `READY`):
```bash
$ dispatch get base-image nodejs-base
```

### Adding Runtime Dependencies

Library dependencies listed in `package.json` ([npm dependency manifest](https://docs.npmjs.com/files/package.json)) need to be wrapped into a Dispatch image. For example, suppose we need a math library:

```bash
$ cat ./package.json
```
```json
{
    "dependencies": {
      "mathjs": "4.1.2"
    }
}
```
```bash
$ dispatch create image nodejs-mylibs nodejs-base --runtime-deps ./package.json
```

Make sure the image status is `READY` (it normally goes from `INITIALIZED` to `READY`):
```bash
$ dispatch get image nodejs-mylibs
```


### Creating Functions

Using the Node.js base-image, you can create Dispatch functions from Node.js (javascript) source files. The file can require any libraries from the image (see above).

The only requirement is: **`module.exports`** must be set to a function that accepts 2 arguments (`context` and `payload`), for example:  
```bash
$ cat ./demo.js
```
```javascript
const math = require('mathjs');
module.exports = function (context, payload) {
    return { myField: math.chain(payload.val).add(4).divide(4).done() }
};
```

```bash
$ dispatch create function nodejs-mylibs math-js ./demo.js
```

Make sure the function status is `READY` (it normally goes from `INITIALIZED` to `READY`):
```bash
$ dispatch get function math-js
```

### Running Functions

As usual:

```bash
$ dispatch exec --json --input '{"val": 12}' --wait math-js
```
```json
{
    "blocking": true,
    "executedTime": 1524612028,
    "faasId": "9ff4d69e-44e7-4ad3-a54c-6cfeb06729dd",
    "finishedTime": 1524612028,
    "functionId": "931828dc-87b8-43c7-b990-cb3f027f1e47",
    "functionName": "math-js",
    "input": {
        "val": 12
    },
    "logs": {
        "stderr": null,
        "stdout": null
    },
    "name": "28d9acec-b9c2-408c-876a-1ef14611a803",
    "output": {
        "myField": 4
    },
    "reason": null,
    "secrets": [],
    "services": null,
    "status": "READY",
    "tags": []
}
```

## Error Handling

There are three types of errors that can be thrown when invoking a function:
* `InputError`
* `FunctionError`
* `SystemError`

`SystemError` represents an error in the Dispatch infrastructure. `InputError` represents an error in the input detected either early in the function itself or through input schema validation. `FunctionError` represents an error in the function logic or an output schema validation error.

Functions themselves can either throw `InputError` or `FunctionError`

### Input Validation

For Node.js, the following exceptions thrown from the function are considered `InputError`:
* **`TypeError`**

All other exceptions thrown from the function are considered `FunctionError`.

To validate input in the function body:
```javascript
module.exports = function(context, payload) {
    if (typeof payload !== 'string') {
        throw new TypeError("payload is not of type string");
    }

    return payload.toLowerCase();
};
```

### Note

Since **`TypeError`** is considered an `InputError`, functions should not throw it unless explicitly thrown due to an input validation error. Functions should catch and handle **`TypeError`** accordingly if it should not be classified as an `InputError`. 
