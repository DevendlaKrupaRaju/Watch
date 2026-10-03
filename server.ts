import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local first — must happen before any other imports that use env vars
config({ path: resolve(__dirname, '.env.local') })
config({ path: resolve(__dirname, '.env') })

import { createServer } from 'http'
import next from 'next'
import express from 'express'
import { initSocketServer } from './lib/socket/server'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const expressApp = express()
const httpServer = createServer(expressApp)

// Initialize Socket.IO before starting
initSocketServer(httpServer)

// Let Next.js handle all requests
expressApp.all('/{*path}', (req, res) => {
  return handle(req, res)
})

// Start listening first, then prepare Next.js in background
httpServer.listen(port, () => {
  console.log(`> WatchHub ready on http://${hostname}:${port}`)
  console.log(`> Socket.IO server running`)
  console.log(`> Environment: ${dev ? 'development' : 'production'}`)
  console.log(`> Compiling pages on first request...`)
})

// Prepare Next.js in background (don't block server start)
app.prepare().catch((err: Error) => {
  console.error('Next.js prepare error:', err)
})
