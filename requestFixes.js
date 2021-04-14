module.exports = {
    apply: function(json) {

        if(json.method == "eth_subscribe") {
            this.fixNulls(json)
        }
        return json
    },

    fixNulls: function(json) {
        if(!json.params || !json.params[1] || !json.params[1].topics) {
            return
        }
        json.params[1].topics = json.params[1].topics.filter(el => el != null)
    }
}