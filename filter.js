var stream = require('stream')
var fixes = require('./fixes')

function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

module.exports = {
    buffer: Buffer.alloc(0),

    bindSockets: function(clientSocket, appSocket) {
        const transform = this.transformStream()
        clientSocket.pipe(appSocket)

        appSocket.pipe(transform)
        transform.pipe(clientSocket)
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
        if(this.info == null) {
            this.info = this.parseHeader(chunk.buffer)
        }
            
        const chunkSize = chunk.length
        const left = this.info.totalSize - this.buffer.length
        if(left < 0) {
            console.log('error')
            return
        }

        if(chunkSize < left) {
            this.buffer = Buffer.concat([this.buffer, chunk])
        }else if(chunkSize == left) {
            this.buffer = Buffer.concat([this.buffer, chunk])
            this.edit(this.info, this.buffer, transform)

            this.buffer = Buffer.alloc(0)
            this.info = null
        }else if(chunkSize > left) {
            const toCopy = chunk.slice(0, left)
            this.buffer = Buffer.concat([this.buffer, toCopy])
            this.edit(this.info, this.buffer, transform)

            this.buffer = Buffer.alloc(0)
            this.info = null

            this.buffer = chunk.slice(left-1)
            this.info = this.parseHeader(this.buffer.buffer)
        }
    },

    parseHeader: function(buffer) {
        const header = new DataView(buffer)
        const l1r = header.getUint8(1)
        const l1 = l1r & 127

        let headerSize 
        let payloadSize
        if(l1 < 126) {
            payloadSize = l1
            headerSize = 2
        }else if(l1 == 126) {
            payloadSize = header.getUint16(2, false)
            headerSize = 4
        }else if(l1 == 127) {
            headerSize = 8
            payloadSize = header.getBigUint64(4, false)
        }
        return {
            headerSize: headerSize,
            payloadSize: payloadSize,
            totalSize: headerSize + payloadSize
        }
    },

    updateHeader: function(buffer, modPayloadLen) {
        const header = new DataView(buffer)
        if(modPayloadLen < 126) {
            header.setUint8(1, modPayloadLen)
        }else if(modPayloadLen >= 126) {
            header.setUint8(1, 126)
            header.setUint16(2, modPayloadLen, false)
        }else if(modPayloadLen > 65535) {
            header.setUint8(1, 127)
            header.setUint64(4, modPayloadLen, false)
        }
    },

    edit: function(info, buffer, transform) {
        const originalMessage = String(buffer.slice(info.headerSize))
        var json = JSON.parse(originalMessage)

        json = this.fix(json)
        
        const modJsonString = JSON.stringify(json)
        const modJsonStringLen = modJsonString.length

        const modHeader = Buffer.alloc(info.headerSize, 0)
        buffer.copy(modHeader, 0, 0, info.headerSize)

        this.updateHeader(modHeader.buffer, modJsonStringLen)

        const finalModBuff = Buffer.concat([modHeader, Buffer.from(modJsonString)])

        const debug = finalModBuff.toString()
        transform.push(finalModBuff)
    },

    fix: function(json) {
        if(isArray(json)) {
            for(const rpc of json) {
                fixes.do(rpc.result)
            }
        }else {
            fixes.do(json.result)
        }
        return json
    }
}