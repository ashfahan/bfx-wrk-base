'use strict'

const net = require('net')

class RPCServer {
  constructor (port = 9000) {
    this.port = port
    this.methods = {}
  }

  register (name, fn) {
    this.methods[name] = fn
  }

  listen (cb) {
    this.server = net.createServer(socket => {
      let buf = ''
      socket.on('data', chunk => {
        buf += chunk.toString()
        let i
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i)
          buf = buf.slice(i + 1)
          if (!line.trim()) continue
          let msg
          try {
            msg = JSON.parse(line)
          } catch (e) {
            continue
          }
          const handler = this.methods[msg.method]
          if (!handler) {
            socket.write(JSON.stringify({ id: msg.id, error: 'Method not found' }) + '\n')
            continue
          }
          Promise.resolve(handler(msg.params))
            .then(res => {
              socket.write(JSON.stringify({ id: msg.id, result: res }) + '\n')
            })
            .catch(err => {
              socket.write(JSON.stringify({ id: msg.id, error: err.message }) + '\n')
            })
        }
      })
    })
    this.server.listen(this.port, cb)
  }

  close (cb) {
    if (this.server) this.server.close(cb)
  }
}

class RPCClient {
  constructor (port = 9000, host = '127.0.0.1') {
    this.port = port
    this.host = host
    this.id = 0
    this.pending = {}
  }

  connect (cb) {
    this.socket = net.connect(this.port, this.host, cb)
    let buf = ''
    this.socket.on('data', chunk => {
      buf += chunk.toString()
      let i
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i)
        buf = buf.slice(i + 1)
        if (!line.trim()) continue
        let msg
        try {
          msg = JSON.parse(line)
        } catch (e) {
          continue
        }
        const cb = this.pending[msg.id]
        if (cb) {
          delete this.pending[msg.id]
          cb(msg.error, msg.result)
        }
      }
    })
  }

  request (method, params, cb) {
    const id = ++this.id
    this.pending[id] = cb
    this.socket.write(JSON.stringify({ id, method, params }) + '\n')
  }

  close () {
    if (this.socket) this.socket.end()
  }
}

module.exports = { RPCServer, RPCClient }
