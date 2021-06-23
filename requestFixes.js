module.exports = {
    apply: function(json) {
        let modCount = 0
        if(json.method == "eth_subscribe") {
            modCount += this.fixNulls(json)
        }
        return {json: json, modCount: modCount}
    },

    fixNulls: function(json) {
        if(json.params && json.params[1] && json.params[1].topics) {
            const topics = json.params[1].topics.filter(el => el != null)
            json.params[1].topics = topics.flat()
            return 1
        }
        return 0
    }
}