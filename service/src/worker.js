import { workerData, parentPort } from 'node:worker_threads'

import HID from 'node-hid'

import { NodeHIDStreamSource } from '@johntalton/i2c-service-library'
import { I2CPort } from '@johntalton/i2c-port'
import { MCP2221A } from '@johntalton/mcp2221'
import { I2CBusMCP2221 } from '@johntalton/i2c-bus-mcp2221'

const VENDOR_ID = 1240
const PRODUCT_ID = 221

const KNOWN_DEVICES = new Map()

// const devices = await HID.devicesAsync()
// console.log(devices)


async function setupMCP2221() {
	const device = await HID.HIDAsync.open(VENDOR_ID, PRODUCT_ID)
	const source = new NodeHIDStreamSource(device)
	const mcp2221 = MCP2221A.from(source)
	const mcp2221Bus = I2CBusMCP2221.from(mcp2221, { opaquePrefix: 'Web' })
	return { bus: mcp2221Bus }
}

setupMCP2221()
	.then(device => {
		KNOWN_DEVICES.set('mcp2221', device)
	})
	.catch(e => console.warn(e))


parentPort?.addEventListener('message', async event => {
  event.preventDefault()
	// console.log(event, event.data)
  const message = event.data
	const { id, type, port } = message

	if(!KNOWN_DEVICES.has(id)) {
		port.postMessage({ error: 'unknown id' })
		return
	}

	const { bus } = KNOWN_DEVICES.get(id)

  switch(type) {
		default:
			const result = await I2CPort.handleMessage(bus, message)

			if('buffer' in result) {
				port.postMessage(result, { transferList: [ result.buffer ]})
				break
			}

			port.postMessage(result)
			break

  }

})

setInterval(() => console.log('tick'), 1000 * 30)