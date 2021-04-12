var stream = require('stream')
var fixes = require('./fixes')

module.exports = {
    buffer: null,

    bindSockets: function(socket, proxySocket) {
        const transform = this.transformStream()
        proxySocket.pipe(transform).pipe(socket).pipe(proxySocket)
    },

    transformStream: function() {
        var transform = new stream.Transform()

        const _filter = this
        transform._transform = function (chunk, encoding, done) {
            _filter.gather(chunk, encoding, this)
            done()
        }
        return transform
    },

    gather: function(chunk, encoding, transform) {
        const str = chunk.toString()

        if(this.buffer) {
            this.buffer = Buffer.concat([this.buffer, chunk])
        }else {
            this.buffer = chunk
        }
        const terminator = str.charAt(str.length - 1);
        if(terminator == '\n') {
            this.edit(transform)
        }
    },

    edit: function(transform) {
        const header = new DataView(this.buffer.buffer)
        const l1 = header.getUint8(1)
        const l2 = header.getUint16(2, false)
        const l3 = header.getBigUint64(4, false)

        let headerSize 
        let payloadSize
        if(l1 < 126) {
            payloadSize = l1
            headerSize = 2
        }else if(l1 == 126) {
            payloadSize = l2
            headerSize = 4
        }else if(l1 == 127) {
            headerSize = 8
            payloadSize = l3
        }

        const originalMessage = String(this.buffer)
        const jsonString = originalMessage.slice(headerSize)
        var json = JSON.parse(jsonString)

        const originalLen = jsonString.length
        json = this.fix(json)
        
        const modJsonString = JSON.stringify(json)
        const modJsonStringLen = modJsonString.length

        const modHeader = Buffer.alloc(headerSize, 0)
        this.buffer.copy(modHeader, 0, 0, headerSize)

        if(modJsonStringLen != originalLen) {
            const header2 = new DataView(modHeader.buffer)
            if(l1 < 126) {
                header2.setUint8(1, modJsonStringLen)
            }else if(l1 == 126) {
                header2.setUint16(2, modJsonStringLen)
            }else if(l1 == 127) {
                header2.setUint64(4, modJsonStringLen)
            }
        }


        const finalModBuff = Buffer.concat([modHeader, Buffer.from(modJsonString)])
        transform.push(finalModBuff)
        this.buffer = null
    },

    fix: function(json) {
        const response = json.result
        fixes.do(response)
        return json
    }
}