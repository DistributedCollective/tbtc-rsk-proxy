var stream = require('stream')

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
        const originalMessage = String(Buffer.from(this.buffer, 4, 0))
        const prefix = Buffer.from(this.buffer, 0, 4)
        const jsonString = originalMessage.slice(4)
        var json = JSON.parse(jsonString)

        json = this.fix(json)
        
        const lateJsonString = JSON.stringify(json)
        const edited = Buffer.concat([prefix, Buffer.from(lateJsonString)])
        const result = Buffer.compare(this.buffer, edited)

        transform.push(this.buffer)
        this.buffer = null
    },

    fix: function(json) {
        console.dir(json)
        return json
    }
}