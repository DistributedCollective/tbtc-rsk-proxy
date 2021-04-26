function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

module.exports = {
    apply: function(json) {

        if(json.method == "eth_subscribe") {
            this.fixNulls(json)
        }
        return json
    },

    fixNulls: function(json) {
        // if(json.params[1] && json.params[1].address && isArray(json.params[1].address) && json.params[1].address.length == 1) {
        //     json.params[1].address = json.params[1].address[0]
        // }
        if(json.params && json.params[1] && json.params[1].topics) {
            const topics = json.params[1].topics.filter(el => el != null)
            json.params[1].topics = topics.flat()
        }
    }
}