#!/usr/bin/env node

const ws = require('ws')
const http = require('http')
const Y = require('yjs')

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || 1234

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('Yjs WebSocket Server Running\n')
})

const wss = new ws.Server({ server })

// Store documents in memory
const docs = new Map()

// Get or create document
const getDoc = (docname) => {
  let doc = docs.get(docname)
  if (!doc) {
    doc = new Y.Doc()
    docs.set(docname, doc)
    console.log(`Created new document: ${docname}`)
  }
  return doc
}

wss.on('connection', (conn, req) => {
  const docname = req.url.slice(1).split('?')[0]
  console.log(`New connection for document: ${docname}`)

  const doc = getDoc(docname)
  const clients = new Set()

  // Send initial state
  const sendSyncStep1 = () => {
    const stateVector = Y.encodeStateVector(doc)
    const message = new Uint8Array([0, ...stateVector])
    conn.send(message)
  }

  // Handle messages from client
  conn.on('message', (message) => {
    const uint8Array = new Uint8Array(message)
    const messageType = uint8Array[0]

    switch (messageType) {
      case 0: // sync step 1
        const stateVector = uint8Array.slice(1)
        const update = Y.encodeStateAsUpdate(doc, stateVector)
        const response = new Uint8Array([1, ...update])
        conn.send(response)
        break

      case 1: // sync step 2
        const update2 = uint8Array.slice(1)
        Y.applyUpdate(doc, update2)
        // Broadcast to all other clients
        wss.clients.forEach((client) => {
          if (client !== conn && client.readyState === ws.OPEN) {
            client.send(message)
          }
        })
        break

      case 2: // update
        const updateData = uint8Array.slice(1)
        Y.applyUpdate(doc, updateData)
        // Broadcast to all other clients
        wss.clients.forEach((client) => {
          if (client !== conn && client.readyState === ws.OPEN) {
            client.send(message)
          }
        })
        break
    }
  })

  conn.on('close', () => {
    console.log(`Connection closed for document: ${docname}`)
  })

  // Send initial sync
  sendSyncStep1()
})

server.listen(port, host, () => {
  console.log(`Yjs WebSocket server running at ws://${host}:${port}`)
})
