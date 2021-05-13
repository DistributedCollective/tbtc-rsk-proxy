const http = require('http')
const httpProxy = require('./node-http-proxy/lib/http-proxy')


const rpcUrl = 'https://testnet.sovryn.app/rpc'
const rpcPort = 443
const websocketUrl = 'wss://testnet.sovryn.app/ws'
const websocketPort = 443

const httpMode = process.env.HTTP_MODE

let proxy
let server

if(httpMode) {
    console.log("Starting in HTTP RPC MODE")
}else {
    console.log("Starting in WEBSOCKET RPC MODE")
}

if(httpMode) {
    proxy = new httpProxy.createProxyServer({
        target: rpcUrl,
        port: rpcPort,
        changeOrigin: true,
        ignorePath: true,
        hostRewrite: true,
        followRedirects: true,
        protocolRewrite: true
    })
    proxy.on('proxyRes', function(proxyRes, req, res) {
        res.setHeader('Content-Type', 'application/json');
    });
    server = http.createServer(function(req, res) {
        proxy.web(req, res) 
    })
}else {
    proxy = new httpProxy.createProxyServer({
        target: websocketUrl,
        port: websocketPort,
        changeOrigin: true,
        ignorePath: true,
        hostRewrite: true,
        followRedirects: true,
        protocolRewrite: true,
        ws: true
    })
    server = http.createServer()
    server.on('upgrade', function (req, socket, head) {
        proxy.ws(req, socket, head)
    })
}


let port = process.env.PROXY_PORT || 5050
const increment = process.env.NODE_APP_INSTANCE
if(increment != null) {
    port += Number(increment)
}

console.log("Listening at:", port)
server.listen(port)
