const request = require('request')
var express = require('express')
var app = express()

app.use(express.json())
app.use(express.urlencoded())

const targetUrl = process.env.TARGET_URL
const targetPort = process.env.TARGET_PORT
const username = process.env.TARGET_USERNAME
const password = process.env.TARGET_PASSWORD
const port = process.env.PROXY_PORT

const url = "http://" + targetUrl + ":" + targetPort
let requestId = 0

app.post('/', function(req, res){
    const json = req.body

    let requestPromise
    if(json.method == 'getblockbyheight') {
        const height = json.params[0]
        const verbosity = json.params[1]
        requestPromise = getBlockByHeight(height, verbosity)
    }else {
        requestPromise = rpcRequest(json.method, json.params)
    }

    requestPromise.then(response => {
        const returnValue = JSON.stringify(response)
        console.log(returnValue)
        res.setHeader('content-type', 'application/json')
        res.send(JSON.stringify(returnValue))
    }).catch(error => {
        console.log(error)
    })
    
});

console.log(`Target: ${targetUrl}:${targetPort} - Listening at: ${port} ---`)
app.listen(port)

async function rpcRequest(method, params) {
    if(requestId == Number.MAX_SAFE_INTEGER) {
        requestId = 0
    }else {
        requestId++
    }

    const body = {
        "jsonrpc": "1.0",
        "id": String(requestId),
        method: method,
        params: params || []
    }

    return new Promise((resolve, reject) => {
        request.post(url, {
            json: true,
            auth: {
                user: username,
                password: password,
                sendImmediately: false 
            },
            body: body
        }, function (error, response, body) {
            if(!error && body){
                resolve(body)
            }else {
                reject(error)
            }
        })
    })
}

async function getBlockByHeight(height, verbosity) {
    const hashResult = await rpcRequest('getblockhash', [height])
    if(hashResult.error) {
        console.log('notFoundHashForHeight: ', height)
        return hashResult
    }
    const result = await rpcRequest('getblock', [hashResult.result, verbosity])
    if(result.error) {
        console.log('notFoundBlockForHeight: ', height)
    }
    return result
}
