'use strict'
const assert = require('assert')
const http = require('http')
const InferenceWorker = require('../services/inference-worker')
const { RPCClient } = require('../lib/hyperswarm-rpc')

const worker = new InferenceWorker({ rpcPort: 9100, httpPort: 9101, rateLimit: 2 }, { env: 'test', root: __dirname, wtype: 'inference' })
worker.init()

worker.start(() => {
  const data = JSON.stringify({ username: 'tester' })
  const req = http.request({ hostname: '127.0.0.1', port: 9101, path: '/register', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, res => {
    let body = ''
    res.on('data', d => { body += d })
    res.on('end', () => {
      const { apiKey } = JSON.parse(body)
      const client = new RPCClient(9100, '127.0.0.1')
      client.connect(() => {
        client.request('inference', { key: apiKey, prompt: 'hi' }, (err, result) => {
          assert.ifError(err)
          assert.strictEqual(result.reply, 'Echo: hi')
          client.close()
          worker.stop(() => {
            console.log('tests passed')
          })
        })
      })
    })
  })
  req.write(data)
  req.end()
})
