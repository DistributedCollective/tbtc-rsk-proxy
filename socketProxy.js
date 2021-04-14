var stream = require('stream')


module.exports = class SocketProxy {
    editCallback = function(json){}
    buffer = Buffer.alloc(0)

    transform() {
        var transform = new stream.Transform()

        const _filter = this
        transform._transform = function (chunk, encoding, done) {
            _filter.gather(chunk, encoding, this)
            done()
        }
        return transform
    }

    gather(chunk, encoding, transform) {
        if(this.info == null) {
            this.info = this.parseHeader(chunk.buffer)
            this.buffer = Buffer.alloc(0)
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
            this.info = null

        }else if(chunkSize > left) {
            const toCopy = chunk.slice(0, left)
            this.buffer = Buffer.concat([this.buffer, toCopy])

            const chunkContent = String(chunk)
            const bufferContent = String(this.buffer)
            const toCopyContent = String(toCopy)
            this.edit(this.info, this.buffer, transform)
            this.info = null

            const restLength = chunkSize - left
            const rest = chunk.slice(left)
            const restContent = String(rest)

            const dBuffer = Buffer.alloc(rest.length)
            rest.copy(dBuffer)
            this.info = this.parseHeader(dBuffer.buffer)
            this.buffer = Buffer.alloc(0)
            this.gather(rest, encoding, transform)
        }
    }

    parseHeader(buffer) {
        const header = new DataView(buffer)
        const l1r = header.getUint8(1)
        const l1 = l1r & 127
        const masked = (l1r & 128) ? 1 : 0

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

        let mask = null
        if(masked) {
            mask = []
            mask[0] = header.getUint8(headerSize)
            mask[1] = header.getUint8(headerSize+1)
            mask[2] = header.getUint8(headerSize+2)
            mask[3] = header.getUint8(headerSize+3)
            headerSize += 4
        }

        return {
            headerSize: headerSize,
            payloadSize: payloadSize,
            totalSize: headerSize + payloadSize,
            masked: masked,
            mask: mask
        }
    }

    applyMask(message, size, mask) {
        for(let i = 0; i < size; i++) {
            message[i] = message[i] ^ mask[i % 4]
        }
    }

    updateHeader(buffer, modPayloadLen, mask = null) {
        const header = new DataView(buffer)

        let headerSize = 2
        let headerSizeValue = 0
        if(modPayloadLen < 126) {
            headerSizeValue = modPayloadLen
            headerSize = 2
        }else if(modPayloadLen >= 126) {
            headerSizeValue = 126
            header.setUint16(2, modPayloadLen, false)
            headerSize = 4
        }else if(modPayloadLen > 65535) {
            headerSizeValue = 127
            header.setUint64(4, modPayloadLen, false)
            headerSize = 8
        }
        
        if(mask) {
            headerSizeValue = headerSizeValue | 128
            header.setUint8(headerSize, mask[0])
            header.setUint8(headerSize+1, mask[1])
            header.setUint8(headerSize+2, mask[2])
            header.setUint8(headerSize+3, mask[3])
        }

        header.setUint8(1, headerSizeValue)
    }

    edit(info, buffer, transform) {
        let message = buffer.slice(info.headerSize)
        if(info.masked) {
            this.applyMask(message, info.payloadSize, info.mask)
        }
        const originalMessage = String(message)
        var json = JSON.parse(originalMessage)

        console.log('----------')
        console.log(originalMessage)
        // console.log(json)
        console.log('----------')
        
        json = this.editCallback(json) || json
        
        const modJsonString = JSON.stringify(json)
        const modJsonStringLen = modJsonString.length

        const modHeader = Buffer.alloc(info.headerSize, 0)
        buffer.copy(modHeader, 0, 0, info.headerSize)

        this.updateHeader(modHeader.buffer, modJsonStringLen, info.mask)


        let payloadBuffer = Buffer.from(modJsonString)
        if(info.masked) {
            this.applyMask(payloadBuffer, payloadBuffer.length, info.mask)
        }

        const finalModBuff = Buffer.concat([modHeader, payloadBuffer])
        transform.push(finalModBuff)
    }
}