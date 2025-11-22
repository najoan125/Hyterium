#!/usr/bin/env node

const { Server } = require('@hocuspocus/server')

const server = new Server({
  port: 1234,

  onConnect(data) {
    console.log(`Client connected to document: ${data.documentName}`)
  },

  onDisconnect(data) {
    console.log(`Client disconnected from document: ${data.documentName}`)
  },

  onChange(data) {
    console.log(`Document ${data.documentName} changed`)
  },
})

server.listen()
console.log('Hocuspocus server running on ws://localhost:1234')
