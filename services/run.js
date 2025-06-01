'use strict'

const InferenceWorker = require('./inference-worker')

const worker = new InferenceWorker({
  rpcPort: 9000,
  httpPort: 9001,
  rateLimit: 5
}, { env: 'dev', root: __dirname, wtype: 'inference' })

worker.init()
worker.start(() => console.log('Worker started'))
