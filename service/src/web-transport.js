import fs from 'node:fs'
import { Worker } from 'node:worker_threads'

import { Http3Server } from '@fails-components/webtransport'


function ReadableStream_from(iterator) {
  let iter = iterator

  return new ReadableStream({
    start(controller) {
      // breakup = () => controller.close()
    },
    pull(controller) {
      if(iter === null) { return }
      const { value, done } = iter.next()
      if(done) { return controller.close() }

      controller.enqueue(value)
    },
    cancel() {
      console.log('cancle out')
      iter = null
    }
  })
}


import HID from 'node-hid'

import { NodeHIDStreamSource } from '@johntalton/i2c-service-library'

const VENDOR_ID = 1240
const PRODUCT_ID = 221
//const worker = new Worker('./src/worker.js', { type: 'module' })


const PATH = '/hid0'

const cert = fs.readFileSync('./localhost+2.pem')
const privKey = fs.readFileSync('./localhost+2-key.pem')

const config = {
	secret: '🏴‍☠️',
	cert,
	privKey,
	host: 'localhost',
	port: 4433
}

const service = new Http3Server(config)

service.startServer()
await service.ready

for await (const sessionStream of service.sessionStream(PATH)) {
	console.log('new session stream')
	//const controller = new AbortController()

	sessionStream.closed.then(() => {
		console.log('session closed')
		// controller.abort('session closed')
	})
	.catch(e => console.log('closed catch', e))

	sessionStream.ready.then(async () => {
		console.log('ready')

		//
		// console.log(sessionStream.incomingBidirectionalStreams)
		// console.log(sessionStream.incomingUnidirectionalStreams)
		// console.log(sessionStream.datagrams)
		try {
			for await (const bidi of sessionStream.incomingBidirectionalStreams) {
				console.log('New BiDi')
				const { readable, writable } = bidi

				// try {
				// 	worker.postMessage({ type: 'bidi', readable, writable }, [ readable, writable ])
				// 	console.log('off to worker')
				// }
				// catch(e) {
				// 	console.log('worker go byebye', e)
				// }

				const controller = new AbortController()
				const { signal } = controller
				//const device = await HID.HIDAsync.open(VENDOR_ID, PRODUCT_ID)
				//const source = new NodeHIDStreamSource(device)
				const source = {
					readable: (new Blob([ Uint8Array.from([ 0x00 ]) ])).stream(),
					writable: new WritableStream({
						write(chunk, controller) {
							console.log(chunk)
						}
					})
				}

				Promise.resolve().then(async () => {
					const futureFinishOut = Promise.resolve() // source.readable.pipeTo(writable, { signal, preventClose: true })
					const futureFinishIn = readable.pipeTo(source.writable, {  })

					await futureFinishOut
					await futureFinishIn
				})

				// futureFinishIn.then(() => console.log('finishIn - done'))
				// futureFinishOut.then(() => console.log('finishOut - done'))

				// futureFinishIn.catch(e => console.log('finishIn - error', e.message))
				// futureFinishOut.catch(async e => {
				// 	console.log('finishOut - error', e.message)
				// 	controller.abort('out')
				// 	// await device.close()
				// })

			}
		}
		catch(e) {
			console.log(e)
		}
	})
	.catch(e => console.warn(e))
}

// await service.closed
console.log('end of line.')