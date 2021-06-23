function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]"
}

function date() {
    var currentDate = new Date()
    var day = currentDate.getDate()
    var month = currentDate.getMonth() + 1
    var year = currentDate.getFullYear()
    var hour = currentDate.getHours()
    var minutes = currentDate.getMinutes()
    var seconds = currentDate.getSeconds()
    return `${year}-${month}-${day}T${hour}:${minutes}:${seconds}`
}

module.exports = {
    buffer: {},
    match: false,
    mute: false,

    logRequest: function(json, modified = false) {
        if(this.match) {
            this.matchRpcs(json)
            return
        }
        if(this.mute) {
            return
        }
        console.log(`--- REQUEST --- ${modified ? "MODIFIED!" : ""} `, date())
        console.log(JSON.stringify(json))
        console.log('----------------')
    },

    logResponse: function(json, modified = false) {
        if(this.match) {
            this.matchRpcs(json)
            return
        }
        if(this.mute) {
            return
        }
        console.log(`--- RESPONSE --- ${modified ? "MODIFIED!" : ""} `, date())
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
        if(this.mute) {
            return
        }
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