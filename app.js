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
    console.log("upgrade", req.url)
    proxy.ws(req, socket, head)
})


const port = process.env.PROXY_PORT || 5050
console.log("Listening at:", port)
server.listen(port);
