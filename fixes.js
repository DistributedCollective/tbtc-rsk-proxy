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

const requiredKeys = ['v', 'r', 's']
const shortEncodingKeys = ["nonce", "gasPrice", "gasLimit", "value", "input", "v", "r", "s"]

module.exports = {
    do: function(res) {
        if(!isString(res)) {
            this.leadingZeroes(res)
        }
    },

    leadingZeroes: function(json) {
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