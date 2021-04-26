var http = require('http')
var httpProxy = require('./node-http-proxy/lib/http-proxy')


var server = http.createServer()

var proxy = new httpProxy.createProxyServer({
    target: 'wss://testnet.sovryn.app/ws',
    port: 443,
    changeOrigin: true,
    ignorePath: true,
    hostRewrite: true,
    followRedirects: true,
    protocolRewrite: true,
    ws: true
})
  
server.on('upgrade', function (req, socket, head) {
    proxy.ws(req, socket, head)
})


let port = process.env.PROXY_PORT || 5056
const increment = process.env.NODE_APP_INSTANCE
if(increment != null) {
    port += Number(increment)
}

console.log("Listening at:", port)
server.listen(port);
