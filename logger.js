function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]"
}

module.exports = {
    buffer: {},
    match: false,


    logRequest: function(json) {
        if(this.match) {
            this.matchRpcs(json)
            return
        }
        console.log('--- REQUEST ---')
        console.log(JSON.stringify(json))
        console.log('----------------')
    },

    logResponse: function(json) {
        if(this.match) {
            this.matchRpcs(json)
            return
        }
        console.log('--- RESPONSE ---')
        console.log(JSON.stringify(json))
        console.log('----------------')
    },


    matchRpcs: function(json) {
        if(isArray(json)) {
            for(const rpc of json) {
                this.log(rpc.id, rpc)
            }
        }else {
            this.log(json.id, json)
        }
    },

    log: function(id, json) {
        if(this.buffer[id]) {
            console.log('------------')
            console.log('--- REQUEST ---')
            console.log(JSON.stringify(this.buffer[id]))
            console.log('--- RESPONSE ---')
            console.log(JSON.stringify(json))
            console.log('------------')
            delete this.buffer[id]
        }else {
            this.buffer[id] = json
        }
    }
}