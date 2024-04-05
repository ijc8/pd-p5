class CustomProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.setup()
    }

    async setup() {
        console.log("hey")
        await new Promise(resolve => { Module.onRuntimeInitialized = resolve })
        // const ctx = Module.ccall("hv_export_test_new", "number", ["number"], 48000);
        this.ctx = Module._hv_export_test_new(48000);
        console.log(this.ctx)

        const receiverHash = Module.ccall("hv_stringToHash", "number", ["string"], ["freq"])
        Module._hv_sendFloatToReceiver(this.ctx, receiverHash, 440);

        const block_size = 128;
        const num_channels = 2;
        this.buffer = Module._malloc(block_size * num_channels & Float32Array.BYTES_PER_ELEMENT)
        this.port.onmessage = e => {
            Module._hv_sendFloatToReceiver(this.ctx, receiverHash, e.data);
        }
    }

    process(inputs, outputs, parameters) {
        if (this.buffer === undefined) return
        const array = outputs[0][0]
        Module.HEAPF32.set(array, this.buffer / Float32Array.BYTES_PER_ELEMENT)
        const n = Module._hv_processInline(this.ctx, this.buffer, this.buffer, array.length)
        array.set(new Float32Array(Module.HEAP32.buffer, this.buffer, array.length))
        console.log(n)
        return true
    }
}

registerProcessor("custom-processor", CustomProcessor)
