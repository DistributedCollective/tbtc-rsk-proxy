var stream = require('stream')


module.exports = class SocketProxy {
    MTU = 65000
    editCallback = function(json){}
    buffer = Buffer.alloc(0)
    messageBuffer = Buffer.alloc(0)

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
            this.unpack(this.info, this.buffer, transform)
            this.info = null

        }else if(chunkSize > left) {
            const toCopy = chunk.slice(0, left)
            this.buffer = Buffer.concat([this.buffer, toCopy])

            this.unpack(this.info, this.buffer, transform)
            this.info = null

            const rest = chunk.slice(left)

            const dBuffer = Buffer.alloc(rest.length)
            rest.copy(dBuffer)
            this.info = this.parseHeader(dBuffer.buffer)
            this.buffer = Buffer.alloc(0)
            this.gather(rest, encoding, transform)
        }
    }

    parseHeader(buffer) {
        const header = new DataView(buffer)
        
        const fields = header.getUint8(0)
        const fin = (fields & 128) ? 1 : 0

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

        const opcode = fields & 15

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
            fin: fin,
            headerSize: headerSize,
            payloadSize: payloadSize,
            totalSize: headerSize + payloadSize,
            masked: masked,
            mask: mask,
            opcode: opcode
        }
    }

    applyMask(message, size, mask) {
        for(let i = 0; i < size; i++) {
            message[i] = message[i] ^ mask[i % 4]
        }
    }

    createHeader(payloadLen, mask = null, fin = true, opcode = 1) {
        let headerSize = 2
        let headerSizeValue = 0
        if(payloadLen < 126) {
            headerSizeValue = payloadLen
            headerSize = 2
        }else if(payloadLen >= 126 && payloadLen < 65535) {
            headerSizeValue = 126
            headerSize = 4
        }else if(payloadLen > 65535) {
            headerSizeValue = 127
            headerSize = 8
        }

        const totalHeaderSize = mask ? headerSize + 4 : headerSize
        const headerBuffer = Buffer.alloc(totalHeaderSize)
        const header = new DataView(headerBuffer.buffer)

        if(headerSizeValue == 126) {
            header.setUint16(2, payloadLen, false)
        }else if(headerSizeValue == 127) {
            header.setUint64(4, payloadLen, false)
        }
        
        if(mask) {
            headerSizeValue = headerSizeValue | 128
            header.setUint8(headerSize, mask[0])
            header.setUint8(headerSize+1, mask[1])
            header.setUint8(headerSize+2, mask[2])
            header.setUint8(headerSize+3, mask[3])
        }

        if(fin) {
            const value = 128 | opcode
            header.setUint8(0, value)
        }else {
            header.setUint8(0, opcode)
        }
        header.setUint8(1, headerSizeValue)

        return headerBuffer
    }

    unpack(info, buffer, transform) {
        if(info.opcode == 9 || info.opcode == 10) {
            console.log('ping-pong')
            this.send(buffer, info.mask, transform, true, info.opcode)
            return
        }
        let payload = buffer.slice(info.headerSize)
        if(info.masked) {
            this.applyMask(payload, info.payloadSize, info.mask)
        }

        this.messageBuffer = Buffer.concat([this.messageBuffer, payload])
        if(!info.fin) {
            console.log('--not fin!---')
            return
        }

        const originalMessage = String(this.messageBuffer)
        const modifiedMessage = this.update(originalMessage)
        this.messageBuffer = Buffer.alloc(0)

        let left = modifiedMessage.length
        let position = 0
        let iteration = 0
        while(left > 0) {
            let portion = left > this.MTU ? this.MTU : left

            const part = modifiedMessage.slice(position, position + portion)
            position += portion
            left-= portion

            const fin = (left <= 0)
            const opcode = (iteration == 0) ? 1 : 0
            const payloadBuffer = Buffer.from(part)
            this.send(payloadBuffer, info.mask, transform, fin, opcode)
            iteration++
        }
    }

    update(message) {
        let json = JSON.parse(message)
        json = this.editCallback(json) || json
        return JSON.stringify(json)
    }

    send(payload, mask, transform, fin, opcode) {
        const headerBuffer = this.createHeader(payload.length, mask, fin, opcode)
        
        if(mask) {
            this.applyMask(payload, payload.length, mask)
        }

        const packet = Buffer.concat([headerBuffer, payload])
        transform.push(packet)
    }
}