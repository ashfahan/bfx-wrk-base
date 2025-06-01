'use strict'

const { RPCClient } = require('../lib/hyperswarm-rpc')
const fs = require('fs')
const path = require('path')

function loadConfig () {
  const p = path.join(__dirname, 'config.json')
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function main () {
  const prompt = process.argv.slice(2).join(' ')
  if (!prompt) {
    console.log('Usage: node cli/index.js <prompt>')
    return
  }
  const conf = loadConfig()
  const client = new RPCClient(conf.rpcPort || 9000, conf.host || '127.0.0.1')
  client.connect(() => {
    client.request('inference', { key: conf.apiKey, prompt }, (err, res) => {
      if (err) console.error('Error:', err)
      else console.log(res)
      client.close()
    })
  })
}

main()
