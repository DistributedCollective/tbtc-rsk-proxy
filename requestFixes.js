module.exports = {
    apply: function(json) {
        if(json.method == "eth_subscribe") {
            this.fixNulls(json)
        }
        return json
    },

    fixNulls: function(json) {
        if(json.params && json.params[1] && json.params[1].topics) {
            const topics = json.params[1].topics.filter(el => el != null)
            json.params[1].topics = topics.flat()
        }
    }
}