'use strict'

const Base = require('../base')
const { RPCServer } = require('../lib/hyperswarm-rpc')
const crypto = require('crypto')
const http = require('http')

class InferenceWorker extends Base {
  constructor (conf, ctx) {
    super(conf, ctx)
    this.users = {}
    this.rateLimit = conf.rateLimit || 10
    this.metrics = { requests: 0, fails: 0 }
  }

  _start (cb) {
    this.rpc = new RPCServer(this.conf.rpcPort)
    this.rpc.register('inference', async (params) => this.handleInference(params))
    this.rpc.listen(() => console.log(`RPC listening on ${this.conf.rpcPort}`))

    this.httpServer = http.createServer((req, res) => this.handleHttp(req, res))
    this.httpServer.listen(this.conf.httpPort, () => console.log(`HTTP listening on ${this.conf.httpPort}`))
    cb()
  }

  handleHttp (req, res) {
    if (req.method === 'POST' && req.url === '/register') {
      let body = ''
      req.on('data', chunk => { body += chunk.toString() })
      req.on('end', () => {
        const { username } = JSON.parse(body || '{}')
        const key = crypto.randomBytes(8).toString('hex')
        this.users[key] = { username, usage: 0, last: Date.now(), count: 0 }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ apiKey: key }))
      })
      return
    }

    if (req.method === 'GET' && req.url.startsWith('/usage')) {
      const url = new URL(req.url, `http://${req.headers.host}`)
      const key = url.searchParams.get('key')
      if (!this.users[key]) {
        res.writeHead(404)
        res.end()
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ usage: this.users[key].usage }))
      return
    }

    if (req.method === 'GET' && req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end(`requests ${this.metrics.requests}\nfailures ${this.metrics.fails}\n`)
      return
    }

    res.writeHead(404)
    res.end()
  }

  async handleInference (params = {}) {
    const { key, prompt } = params
    if (!this.users[key]) {
      this.metrics.fails++
      throw new Error('invalid api key')
    }
    if (!this.checkRateLimit(key)) {
      this.metrics.fails++
      throw new Error('rate limit exceeded')
    }
    this.metrics.requests++
    this.users[key].usage++
    const reply = `Echo: ${prompt}`
    return { reply }
  }

  checkRateLimit (key) {
    const usr = this.users[key]
    const now = Date.now()
    if (now - usr.last > 60000) {
      usr.last = now
      usr.count = 0
    }
    usr.count = (usr.count || 0) + 1
    return usr.count <= this.rateLimit
  }

  _stop (cb) {
    this.rpc.close(() => {
      this.httpServer.close(cb)
    })
  }
}

module.exports = InferenceWorker
