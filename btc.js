const request = require('request');
var express = require('express');
var app = express();

app.use(express.json());
app.use(express.urlencoded()); 

const rpcUrl = 'http://127.0.0.1:18332'
const username = 'user'
const password = 'password'



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
        if(!response.error) {
            console.log(response.result.height)
        }
        const returnValue = JSON.stringify(response)
        res.setHeader('content-type', 'application/json')
        res.send(JSON.stringify(returnValue))
    }).catch(error => {
        console.log(error)
    })
    
});

app.listen(6060);

let id = 0

async function rpcRequest(method, params) {
    id++
    const body = {
        "jsonrpc": "1.0",
        "id": String(id),
        method: method,
        params: params || []
    }

    return new Promise((resolve, reject) => {
        request.post(rpcUrl, {
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