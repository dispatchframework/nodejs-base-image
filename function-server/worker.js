var Promise = require('bluebird')
var fun = require(process.env.FUNCTION)

var worker = new Promise(async (resolve, reject) => {
        var result = await fun(JSON.parse(process.env.CONTEXT), JSON.parse(process.env.PAYLOAD), reject)
        console.log(JSON.stringify(result))
        resolve(result)
})


worker.then(result => process.send(result)).catch(err => process.send(err))
