var fun = require(process.env.FUNCTION)

Error.prototype.toJSON = function() {
    var ret = {
        name: this.name,
        message: this.message,
        stack: this.stack,
        __error__: true
    };
    // Add any custom properties such as .code in file-system errors
    Object.keys(this).forEach(function(key) {
        if (!ret[key]) {
            ret[key] = this[key];
        }
    }, this);
    return ret;
};

var worker = new Promise(async (resolve, reject) => {
    try {
        var r = await fun(JSON.parse(process.env.CONTEXT), JSON.parse(process.env.PAYLOAD))
        resolve(r)
    } catch (e) {
        reject(e)
    }
})

worker.then(result => process.send(result), err => process.send(err))