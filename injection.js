const fixes = require('./fixes')
const debug = require('./debug')

const SocketProxy = require('./socketProxy')

module.exports = {
    inject: function(client, proxySocket) {
        const requestProxy = new SocketProxy()
        const responseProxy = new SocketProxy()

        responseProxy.editCallback = (json) => {
            fixes.fix(json)
        }

        requestProxy.editCallback = (json) => {
            debug.log(json)
        }

        const responseTransform = responseProxy.transform()
        const requestTransform = requestProxy.transform()

        //full
        client.pipe(requestTransform).pipe(proxySocket).pipe(responseTransform).pipe(client)

        //response mod
        // client.pipe(proxySocket).pipe(responseTransform).pipe(client)

        //request mod
        // client.pipe(requestTransform).pipe(proxySocket).pipe(client)
    }
}