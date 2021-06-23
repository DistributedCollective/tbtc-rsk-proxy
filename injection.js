const responseFixes = require('./responseFixes')
const requestFixes = require('./requestFixes')
const logger = require('./logger')

const SocketProxy = require('./socketProxy')

module.exports = {
    inject: function(client, proxySocket) {
        const requestProxy = new SocketProxy()
        const responseProxy = new SocketProxy()

        logger.match = (process.env.MATCH_REQUESTS == 1)
        logger.mute = (process.env.MUTE_LOGGING == 1)

        responseProxy.editCallback = (json) => {
            const result = responseFixes.apply(json)
            logger.logResponse(json, (result.modCount > 0))
        }

        requestProxy.editCallback = (json) => {
            const result = requestFixes.apply(json)
            logger.logRequest(json, (result.modCount > 0))
        }

        const responseTransform = responseProxy.transform()
        const requestTransform = requestProxy.transform()

        client.pipe(requestTransform).pipe(proxySocket).pipe(responseTransform).pipe(client)
    }
}