/* eslint-disable no-var */

const WEBAUDIO_BLOCK_SIZE = 128


/** Overlap-Add Node */
class OLAProcessor extends globalThis.AudioWorkletProcessor {
  constructor(options) {
    super(options)

    this.keepReturnTrue = true
    this.processNow = false

    this.nbInputs = options.numberOfInputs
    this.nbOutputs = options.numberOfOutputs

    this.blockSize = options.processorOptions.blockSize
    // TODO for now, the only support hop size is the size of a web audio block
    this.hopSize = WEBAUDIO_BLOCK_SIZE

    this.nbOverlaps = this.blockSize / this.hopSize

    this.lastSilencedHopCount = 0
    this.nbOverlaps2x = this.nbOverlaps * 2
    this.fakeEmptyInputs = [new Array(2).fill(new Float32Array(WEBAUDIO_BLOCK_SIZE))]


    // pre-allocate input buffers (will be reallocated if needed)
    this.inputBuffers = new Array(this.nbInputs)
    this.inputBuffersHead = new Array(this.nbInputs)
    this.inputBuffersToSend = new Array(this.nbInputs)
    // assume 2 channels per input
    for (var i = 0; i < this.nbInputs; i++) {
      this.allocateInputChannels(i, 2)
    }
    // pre-allocate input buffers (will be reallocated if needed)
    this.outputBuffers = new Array(this.nbOutputs)
    this.outputBuffersToRetrieve = new Array(this.nbOutputs)
    // assume 2 channels per output
    for (i = 0; i < this.nbOutputs; i++) {
      this.allocateOutputChannels(i, 2)
    }

    this.port.onmessage = (e) => this.keepReturnTrue = false
  }

  /** Handles dynamic reallocation of input/output channels buffer
     (channel numbers may vary during lifecycle) **/
  reallocateChannelsIfNeeded(inputs, outputs, force) {
    for (var i = 0; i < this.nbInputs; i++) {
      let nbChannels = inputs[i].length
      if (force || (nbChannels != this.inputBuffers[i].length)) {
        this.allocateInputChannels(i, nbChannels)
        // console.log("reallocateChannelsIfNeeded");
      }
    }

    for (i = 0; i < this.nbOutputs; i++) {
      let nbChannels = outputs[i].length
      if (force || (nbChannels != this.outputBuffers[i].length)) {
        this.allocateOutputChannels(i, nbChannels)
        // console.log("reallocateChannelsIfNeeded");
      }
    }
  }

  allocateInputChannels(inputIndex, nbChannels) {
    // allocate input buffers
    // console.log("allocateInputChannels");

    this.inputBuffers[inputIndex] = new Array(nbChannels)
    for (var i = 0; i < nbChannels; i++) {
      this.inputBuffers[inputIndex][i] = new Float32Array(this.blockSize + WEBAUDIO_BLOCK_SIZE)
      this.inputBuffers[inputIndex][i].fill(0)
    }

    // allocate input buffers to send and head pointers to copy from
    // (cannot directly send a pointer/subarray because input may be modified)
    this.inputBuffersHead[inputIndex] = new Array(nbChannels)
    this.inputBuffersToSend[inputIndex] = new Array(nbChannels)
    for (i = 0; i < nbChannels; i++) {
      this.inputBuffersHead[inputIndex][i] = this.inputBuffers[inputIndex][i].subarray(0, this.blockSize)
      this.inputBuffersToSend[inputIndex][i] = new Float32Array(this.blockSize)
    }
  }

  allocateOutputChannels(outputIndex, nbChannels) {
    // allocate output buffers
    this.outputBuffers[outputIndex] = new Array(nbChannels)
    for (var i = 0; i < nbChannels; i++) {
      this.outputBuffers[outputIndex][i] = new Float32Array(this.blockSize)
      this.outputBuffers[outputIndex][i].fill(0)
    }

    // allocate output buffers to retrieve
    // (cannot send a pointer/subarray because new output has to be add to existing output)
    this.outputBuffersToRetrieve[outputIndex] = new Array(nbChannels)
    for (i = 0; i < nbChannels; i++) {
      this.outputBuffersToRetrieve[outputIndex][i] = new Float32Array(this.blockSize)
      this.outputBuffersToRetrieve[outputIndex][i].fill(0)
    }
  }

  checkForNotSilence(value) {
    return value !== 0
  }

  /** Read next web audio block to input buffers **/
  readInputs(inputs) {
    // when playback is paused, we may stop receiving new samples
    /* if (inputs[0].length && inputs[0][0].length == 0) {
            for (var i = 0; i < this.nbInputs; i++) {
                for (var j = 0; j < this.inputBuffers[i].length; j++) {
                    this.inputBuffers[i][j].fill(0, this.blockSize);
                }
            }
            return;
        } */

    for (let i = 0; i < this.nbInputs; i++) {
      for (let j = 0; j < this.inputBuffers[i].length; j++) {
        let webAudioBlock = inputs[i][j]
        this.inputBuffers[i][j]?.set(webAudioBlock, this.blockSize)
      }
    }
  }

  /** Shift left content of input buffers to receive new web audio block **/
  shiftInputBuffers() {
    for (let i = 0; i < this.nbInputs; i++) {
      for (let j = 0; j < this.inputBuffers[i].length; j++) {
        this.inputBuffers[i][j].copyWithin(0, WEBAUDIO_BLOCK_SIZE)
      }
    }
  }

  /** Copy contents of input buffers to buffer actually sent to process **/
  prepareInputBuffersToSend() {
    for (let i = 0; i < this.nbInputs; i++) {
      for (let j = 0; j < this.inputBuffers[i].length; j++) {
        this.inputBuffersToSend[i][j].set(this.inputBuffersHead[i][j])
      }
    }
  }

  /** Add contents of output buffers just processed to output buffers **/
  handleOutputBuffersToRetrieve() {
    for (let i = 0; i < this.nbOutputs; i++) {
      for (let j = 0; j < this.outputBuffers[i].length; j++) {
        for (let k = 0; k < this.blockSize; k++) {
          this.outputBuffers[i][j][k] += this.outputBuffersToRetrieve[i][j][k] / this.nbOverlaps
        }
      }
    }
  }

  /** Write next web audio block from output buffers **/
  writeOutputs(outputs) {
    for (let i = 0; i < this.nbInputs; i++) {
      for (let j = 0; j < this.inputBuffers[i].length; j++) {
        let webAudioBlock = this.outputBuffers[i][j].subarray(0, WEBAUDIO_BLOCK_SIZE)
        outputs[i][j]?.set(webAudioBlock)
      }
    }
  }

  /** Shift left content of output buffers to receive new web audio block **/
  shiftOutputBuffers() {
    for (let i = 0; i < this.nbOutputs; i++) {
      for (let j = 0; j < this.outputBuffers[i].length; j++) {
        this.outputBuffers[i][j].copyWithin(0, WEBAUDIO_BLOCK_SIZE)
        this.outputBuffers[i][j].subarray(this.blockSize - WEBAUDIO_BLOCK_SIZE).fill(0)
      }
    }
  }

  process(inputs, outputs, params) {
    // console.log(inputs[0].length ? "active" : "inactive");
    // this.reallocateChannelsIfNeeded(inputs, outputs);
    // if (inputs[0][0].some(this.checkForNotSilence) || inputs[0][1].some(this.checkForNotSilence))
    // console.log(inputs[0].length)
    if (inputs[0].length < 2) {
      // DUE TO CHROME BUG/INCONSISTENCY, WHEN INACTIVE SILENT NODE IS CONNECTED, inputs[0] IS EITHER EMPTY OR CONTAINS 1 CHANNEL OF SILENT AUDIO DATA, REQUIRES SPECIAL HANDLING
      // if (inputs[0][0].some(this.checkForNotSilence)) console.warn("single channel not silence exception!");
      if (this.lastSilencedHopCount < this.nbOverlaps2x) {
        // ALLOW nbOverlaps2x BLOCKS OF SILENCE TO COME THROUGH TO ACCOMODATE LATENCY TAIL
        this.lastSilencedHopCount++
        inputs = this.fakeEmptyInputs
        this.processNow = true
      } else {
        // console.warn("skipping processing");
        if (this.lastSilencedHopCount === this.nbOverlaps2x) {
          this.lastSilencedHopCount++
          this.reallocateChannelsIfNeeded(this.fakeEmptyInputs, outputs, true)
          // console.warn("reallocateChannels");
        }
        this.processNow = false // ENABLES SKIPPING UNNEEDED PROCESSING OF SILENT INPUT
      }
    } else {
      if (this.lastSilencedHopCount) {
        this.lastSilencedHopCount = 0
        // this.reallocateChannelsIfNeeded(inputs, outputs, true);
        // console.warn("reallocateChannels");
      }
      this.processNow = true
    }
    if (this.processNow) {
      this.readInputs(inputs)
      this.shiftInputBuffers()
      this.prepareInputBuffersToSend()
      this.processOLA(this.inputBuffersToSend, this.outputBuffersToRetrieve, params)
      this.handleOutputBuffersToRetrieve()
      this.writeOutputs(outputs)
      this.shiftOutputBuffers()
    }
    return this.keepReturnTrue
  }

  /* processOLA(inputs, outputs, params) {
        console.assert(false, "Not overriden");
    } */
}

export default OLAProcessor
