const http = require('http')
const httpProxy = require('./node-http-proxy/lib/http-proxy')

const httpMode = process.env.HTTP_MODE
const targetUrl = process.env.TARGET_URL
const targetPort = process.env.TARGET_PORT

let proxy
let server

if(httpMode == 1) {
    proxy = new httpProxy.createProxyServer({
        target: targetUrl,
        port: targetPort,
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
        target: targetUrl,
        port: targetPort,
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


let port = Number(process.env.PROXY_PORT || 5050)
const increment = process.env.NODE_APP_INSTANCE
if(increment != null) {
    port += Number(increment)
}

console.log(`--- ${httpMode == 1 ? 'Http' : 'Websocket'} mode --- \n--- Target: ${targetUrl}:${targetPort} - Listening at: ${port} ---`)
server.listen(port)
