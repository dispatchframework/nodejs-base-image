module.exports = async function (context, params) {
    let name = "Noone";
    if (params.name) {
        name = params.name;
    }
    let place = "Nowhere";
    if (params.place) {
        place = params.place;
    }

    //var now = new Date()
    //var until = new Date(now.getTime() + (5 * 1000));
    //while (now.getTime() < until.getTime()) {
    //    now = new Date()
    //}

    var wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    var sleep = wait(5000)
    
    await sleep

    //throw new Error("err")
    return {myField: 'Hello, ' + name + ' from ' + place}
};
