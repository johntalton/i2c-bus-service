
export class I2CBusWeb {
	#url

	constructor(url = 'http://localhost:3000/port') {
		this.#url = url
	}

	get name() { return `WebI²C(${this.#url})`}

	async postCommand(command, options) {
		try {
			const response = await fetch(this.#url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					namespace: window.origin,
					opaque: '🤷🏻‍♂️',
					type: command,
					...options
				})
			})

			if(!response.ok) { throw new Error(`response not ok ${response.status}`) }

			const result = await response.json()
			console.log(result)

			if(result.type === 'error') {
				throw new Error('WebI²C Remote Error: ' + result.why)
			}

			return {
				...result,
				buffer: (result.buffer !== undefined) ? Uint8Array.from(result.buffer) : undefined
			}
		}
		catch(e) {
			// console.warn('fetch exception', e)
			throw e
		}
	}

	async scan() {
		const result = await this.postCommand('scan', {})
		// {"name":"I²C MCP2221","type":"scanResult","addresses":[56]}
		if(result.type !== 'scanResult') { throw new Error('remote connection did not return scan results') }
		const { addresses } = result

		return addresses
	}

	async readI2cBlock(address, cmd, length, target) {
		return this.postCommand('readI2cBlock', {
			address,
			cmd,
			length
		})
	}

	async writeI2cBlock(address, cmd, length, buffer) {
		return this.postCommand('writeI2cBlock', {
			address,
			cmd,
			length,
      buffer: [ ...buffer ]
		})
	}

	async i2cRead(address, length, target) {
		return this.postCommand('i2cRead', {
			address,
			length
		})
  }

  async i2cWrite(address, length, buffer) {
    return this.postCommand('i2cWrite', {
			address,
			length,
      buffer: [ ...buffer ]
		})
  }
}
