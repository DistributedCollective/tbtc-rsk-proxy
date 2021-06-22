function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]"
}

function prefixCheck(obj) {
    if(!obj || obj.length < 4) {
        return false
    }
    if(obj.indexOf("0x0") == -1) {
        return false
    }
    return true
}

const requiredKeys = ['v', 'r', 's', "input", "value"]
const shortEncodingKeys = ["nonce", "gasPrice", "gasLimit", "value", "v", "r", "s"]

module.exports = {
    apply: function(json) {
        if(isArray(json)) {
            for(const rpc of json) {
                if(json.method == "eth_subscription") {
                    this.fixNullData(json)
                }else if(rpc.result) {
                    this.fixResult(rpc.result)
                }
            }
        }else {
            if(json.method == "eth_subscription") {
                this.fixNullData(json)
            }else if(json.result) {
                this.fixResult(json.result)
            }
        }
        return json
    },

    fixNullData: function(json) {
        if (json.params && json.params.result && json.params.result.topics.length > 0 && json.params.result.topics[0].includes("0x34f611be")) {
            json.params.result.data=null
        }
    },

    fixResult: function(res) {
        if(!isString(res)) {
            this.leadingZeroes(res)
        }
    },

    leadingZeroes: function(json) {
        if(!json.transactions) {
            return
        }
        json.transactions.forEach(t => {
            for(const key in t) {
                if(requiredKeys.includes(key) && t[key] == null) {
                    t[key] = '0x00'
                }
                if(shortEncodingKeys.includes(key) && prefixCheck(t[key])) {
                    t[key] = t[key].replace("0x0", "0x")
                }
            }
        })
    },
}