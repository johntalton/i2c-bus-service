import { Worker} from 'node:worker_threads'

import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'

const hidWorker = new Worker('./src/worker.js', { type: 'module' })
// const i2cWorker = new Worker('./src/worker.js', { type: 'module' })

const WORKER_MAP = {
	hid: hidWorker,
	// i2c: i2cWorker
}

//
const e = express()
e.use(bodyParser.json())
e.use(cors())

//
e.options('/:worker/:id', cors())
e.post('/:worker/:id', async (request, response) => {
  console.log('POST', request.params.worker, request.params.id)

	const controller = new AbortController()
	const channel = new MessageChannel()
	const signal = AbortSignal.any([ controller.signal, AbortSignal.timeout(15 * 1000) ])

	signal.addEventListener('abort', event => {
		console.log('aborted', signal.reason)
		response.status(500)
		response.json({ error: 'aborted', reason: signal.reason })
	}, { signal: controller.signal, once: true })


	channel.port1.addEventListener('message', event => {
		console.log('reply message')
		const { data } = event

		controller.abort('handled')

		if('error' in data) {
			response.status(500)
			response.json(data)
			return
		}

		const buffer = (data.buffer !== undefined) ? [ ...(ArrayBuffer.isView(data.buffer) ?
			new Uint8Array(data.buffer.buffer, data.buffer.byteOffset, data.buffer.byteLength) :
			new Uint8Array(data.buffer, 0, data.buffer.byteLength)) ] :
			undefined

		response.json({
			...data,
			buffer
		})
	}, { signal, once: true })


	const buffer = (request.body?.buffer !== undefined) ? Uint8Array.from( request.body.buffer ) : undefined
  const message = {
		id: request.params.id,
    ...request.body,
		port: channel.port2,
    buffer
  }

	hidWorker.postMessage(message, [ channel.port2 ])
})

//
e.listen(3000, () => { console.log('service up') })
// process.on('SIGINT', handle)
// process.on('SIGTERM', handle)