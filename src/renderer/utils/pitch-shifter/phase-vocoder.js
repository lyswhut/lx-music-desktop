// https://github.com/olvb/phaze
// https://github.com/indutny/fft.js
// import OLAProcessor from './ola-processor'

function FFT(size) {
  this.size = size | 0
  if (this.size <= 1 || (this.size & (this.size - 1)) !== 0) { throw new Error('FFT size must be a power of two and bigger than 1') }

  this._csize = size << 1

  // NOTE: Use of `var` is intentional for old V8 versions
  let table = new Array(this.size * 2)
  for (let i = 0; i < table.length; i += 2) {
    const angle = Math.PI * i / this.size
    table[i] = Math.cos(angle)
    table[i + 1] = -Math.sin(angle)
  }
  this.table = table

  // Find size's power of two
  let power = 0
  for (let t = 1; this.size > t; t <<= 1) { power++ }

  // Calculate initial step's width:
  //   * If we are full radix-4 - it is 2x smaller to give inital len=8
  //   * Otherwise it is the same as `power` to give len=4
  this._width = power % 2 === 0 ? power - 1 : power

  // Pre-compute bit-reversal patterns
  this._bitrev = new Array(1 << this._width)
  for (let j = 0; j < this._bitrev.length; j++) {
    this._bitrev[j] = 0
    for (let shift = 0; shift < this._width; shift += 2) {
      let revShift = this._width - shift - 2
      this._bitrev[j] |= ((j >>> shift) & 3) << revShift
    }
  }

  this._out = null
  this._data = null
  this._inv = 0
}

FFT.prototype.fromComplexArray = function fromComplexArray(complex, storage) {
  let res = storage || new Array(complex.length >>> 1)
  for (let i = 0; i < complex.length; i += 2) { res[i >>> 1] = complex[i] }
  return res
}

FFT.prototype.createComplexArray = function createComplexArray() {
  const res = new Array(this._csize)
  for (let i = 0; i < res.length; i++) { res[i] = 0 }
  return res
}

FFT.prototype.toComplexArray = function toComplexArray(input, storage) {
  let res = storage || this.createComplexArray()
  for (let i = 0; i < res.length; i += 2) {
    res[i] = input[i >>> 1]
    res[i + 1] = 0
  }
  return res
}

FFT.prototype.completeSpectrum = function completeSpectrum(spectrum) {
  let size = this._csize
  let half = size >>> 1
  for (let i = 2; i < half; i += 2) {
    spectrum[size - i] = spectrum[i]
    spectrum[size - i + 1] = -spectrum[i + 1]
  }
}

FFT.prototype.transform = function transform(out, data) {
  if (out === data) { throw new Error('Input and output buffers must be different') }

  this._out = out
  this._data = data
  this._inv = 0
  this._transform4()
  this._out = null
  this._data = null
}

FFT.prototype.realTransform = function realTransform(out, data) {
  if (out === data) { throw new Error('Input and output buffers must be different') }

  this._out = out
  this._data = data
  this._inv = 0
  this._realTransform4()
  this._out = null
  this._data = null
}

FFT.prototype.inverseTransform = function inverseTransform(out, data) {
  if (out === data) { throw new Error('Input and output buffers must be different') }

  this._out = out
  this._data = data
  this._inv = 1
  this._transform4()
  for (let i = 0; i < out.length; i++) { out[i] /= this.size }
  this._out = null
  this._data = null
}

// radix-4 implementation
//
// NOTE: Uses of `var` are intentional for older V8 version that do not
// support both `let compound assignments` and `const phi`
FFT.prototype._transform4 = function _transform4() {
  let out = this._out
  let size = this._csize

  // Initial step (permute and transform)
  let width = this._width
  let step = 1 << width
  let len = (size / step) << 1

  let outOff
  let t
  let bitrev = this._bitrev
  if (len === 4) {
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t]
      this._singleTransform2(outOff, off, step)
    }
  } else {
    // len === 8
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t]
      this._singleTransform4(outOff, off, step)
    }
  }

  // Loop through steps in decreasing order
  let inv = this._inv ? -1 : 1
  let table = this.table
  for (step >>= 2; step >= 2; step >>= 2) {
    len = (size / step) << 1
    let quarterLen = len >>> 2

    // Loop through offsets in the data
    for (outOff = 0; outOff < size; outOff += len) {
      // Full case
      let limit = outOff + quarterLen
      for (let i = outOff, k = 0; i < limit; i += 2, k += step) {
        const A = i
        const B = A + quarterLen
        const C = B + quarterLen
        const D = C + quarterLen

        // Original values
        const Ar = out[A]
        const Ai = out[A + 1]
        const Br = out[B]
        const Bi = out[B + 1]
        const Cr = out[C]
        const Ci = out[C + 1]
        const Dr = out[D]
        const Di = out[D + 1]

        // Middle values
        const MAr = Ar
        const MAi = Ai

        const tableBr = table[k]
        const tableBi = inv * table[k + 1]
        const MBr = Br * tableBr - Bi * tableBi
        const MBi = Br * tableBi + Bi * tableBr

        const tableCr = table[2 * k]
        const tableCi = inv * table[2 * k + 1]
        const MCr = Cr * tableCr - Ci * tableCi
        const MCi = Cr * tableCi + Ci * tableCr

        const tableDr = table[3 * k]
        const tableDi = inv * table[3 * k + 1]
        const MDr = Dr * tableDr - Di * tableDi
        const MDi = Dr * tableDi + Di * tableDr

        // Pre-Final values
        const T0r = MAr + MCr
        const T0i = MAi + MCi
        const T1r = MAr - MCr
        const T1i = MAi - MCi
        const T2r = MBr + MDr
        const T2i = MBi + MDi
        const T3r = inv * (MBr - MDr)
        const T3i = inv * (MBi - MDi)

        // Final values
        const FAr = T0r + T2r
        const FAi = T0i + T2i

        const FCr = T0r - T2r
        const FCi = T0i - T2i

        const FBr = T1r + T3i
        const FBi = T1i - T3r

        const FDr = T1r - T3i
        const FDi = T1i + T3r

        out[A] = FAr
        out[A + 1] = FAi
        out[B] = FBr
        out[B + 1] = FBi
        out[C] = FCr
        out[C + 1] = FCi
        out[D] = FDr
        out[D + 1] = FDi
      }
    }
  }
}

// radix-2 implementation
//
// NOTE: Only called for len=4
FFT.prototype._singleTransform2 = function _singleTransform2(outOff, off,
  step) {
  const out = this._out
  const data = this._data

  const evenR = data[off]
  const evenI = data[off + 1]
  const oddR = data[off + step]
  const oddI = data[off + step + 1]

  const leftR = evenR + oddR
  const leftI = evenI + oddI
  const rightR = evenR - oddR
  const rightI = evenI - oddI

  out[outOff] = leftR
  out[outOff + 1] = leftI
  out[outOff + 2] = rightR
  out[outOff + 3] = rightI
}

// radix-4
//
// NOTE: Only called for len=8
FFT.prototype._singleTransform4 = function _singleTransform4(outOff, off,
  step) {
  const out = this._out
  const data = this._data
  const inv = this._inv ? -1 : 1
  const step2 = step * 2
  const step3 = step * 3

  // Original values
  const Ar = data[off]
  const Ai = data[off + 1]
  const Br = data[off + step]
  const Bi = data[off + step + 1]
  const Cr = data[off + step2]
  const Ci = data[off + step2 + 1]
  const Dr = data[off + step3]
  const Di = data[off + step3 + 1]

  // Pre-Final values
  const T0r = Ar + Cr
  const T0i = Ai + Ci
  const T1r = Ar - Cr
  const T1i = Ai - Ci
  const T2r = Br + Dr
  const T2i = Bi + Di
  const T3r = inv * (Br - Dr)
  const T3i = inv * (Bi - Di)

  // Final values
  const FAr = T0r + T2r
  const FAi = T0i + T2i

  const FBr = T1r + T3i
  const FBi = T1i - T3r

  const FCr = T0r - T2r
  const FCi = T0i - T2i

  const FDr = T1r - T3i
  const FDi = T1i + T3r

  out[outOff] = FAr
  out[outOff + 1] = FAi
  out[outOff + 2] = FBr
  out[outOff + 3] = FBi
  out[outOff + 4] = FCr
  out[outOff + 5] = FCi
  out[outOff + 6] = FDr
  out[outOff + 7] = FDi
}

// Real input radix-4 implementation
FFT.prototype._realTransform4 = function _realTransform4() {
  let out = this._out
  let size = this._csize

  // Initial step (permute and transform)
  let width = this._width
  let step = 1 << width
  let len = (size / step) << 1

  let outOff
  let t
  let bitrev = this._bitrev
  if (len === 4) {
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t]
      this._singleRealTransform2(outOff, off >>> 1, step >>> 1)
    }
  } else {
    // len === 8
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t]
      this._singleRealTransform4(outOff, off >>> 1, step >>> 1)
    }
  }

  // Loop through steps in decreasing order
  let inv = this._inv ? -1 : 1
  let table = this.table
  for (step >>= 2; step >= 2; step >>= 2) {
    len = (size / step) << 1
    let halfLen = len >>> 1
    let quarterLen = halfLen >>> 1
    let hquarterLen = quarterLen >>> 1

    // Loop through offsets in the data
    for (outOff = 0; outOff < size; outOff += len) {
      for (let i = 0, k = 0; i <= hquarterLen; i += 2, k += step) {
        let A = outOff + i
        let B = A + quarterLen
        let C = B + quarterLen
        let D = C + quarterLen

        // Original values
        let Ar = out[A]
        let Ai = out[A + 1]
        let Br = out[B]
        let Bi = out[B + 1]
        let Cr = out[C]
        let Ci = out[C + 1]
        let Dr = out[D]
        let Di = out[D + 1]

        // Middle values
        let MAr = Ar
        let MAi = Ai

        let tableBr = table[k]
        let tableBi = inv * table[k + 1]
        let MBr = Br * tableBr - Bi * tableBi
        let MBi = Br * tableBi + Bi * tableBr

        let tableCr = table[2 * k]
        let tableCi = inv * table[2 * k + 1]
        let MCr = Cr * tableCr - Ci * tableCi
        let MCi = Cr * tableCi + Ci * tableCr

        let tableDr = table[3 * k]
        let tableDi = inv * table[3 * k + 1]
        let MDr = Dr * tableDr - Di * tableDi
        let MDi = Dr * tableDi + Di * tableDr

        // Pre-Final values
        let T0r = MAr + MCr
        let T0i = MAi + MCi
        let T1r = MAr - MCr
        let T1i = MAi - MCi
        let T2r = MBr + MDr
        let T2i = MBi + MDi
        let T3r = inv * (MBr - MDr)
        let T3i = inv * (MBi - MDi)

        // Final values
        let FAr = T0r + T2r
        let FAi = T0i + T2i

        let FBr = T1r + T3i
        let FBi = T1i - T3r

        out[A] = FAr
        out[A + 1] = FAi
        out[B] = FBr
        out[B + 1] = FBi

        // Output final middle point
        if (i === 0) {
          let FCr = T0r - T2r
          let FCi = T0i - T2i
          out[C] = FCr
          out[C + 1] = FCi
          continue
        }

        // Do not overwrite ourselves
        if (i === hquarterLen) { continue }

        // In the flipped case:
        // MAi = -MAi
        // MBr=-MBi, MBi=-MBr
        // MCr=-MCr
        // MDr=MDi, MDi=MDr
        let ST0r = T1r
        let ST0i = -T1i
        let ST1r = T0r
        let ST1i = -T0i
        let ST2r = -inv * T3i
        let ST2i = -inv * T3r
        let ST3r = -inv * T2i
        let ST3i = -inv * T2r

        let SFAr = ST0r + ST2r
        let SFAi = ST0i + ST2i

        let SFBr = ST1r + ST3i
        let SFBi = ST1i - ST3r

        let SA = outOff + quarterLen - i
        let SB = outOff + halfLen - i

        out[SA] = SFAr
        out[SA + 1] = SFAi
        out[SB] = SFBr
        out[SB + 1] = SFBi
      }
    }
  }
}

// radix-2 implementation
//
// NOTE: Only called for len=4
FFT.prototype._singleRealTransform2 = function _singleRealTransform2(outOff,
  off,
  step) {
  const out = this._out
  const data = this._data

  const evenR = data[off]
  const oddR = data[off + step]

  const leftR = evenR + oddR
  const rightR = evenR - oddR

  out[outOff] = leftR
  out[outOff + 1] = 0
  out[outOff + 2] = rightR
  out[outOff + 3] = 0
}

// radix-4
//
// NOTE: Only called for len=8
FFT.prototype._singleRealTransform4 = function _singleRealTransform4(outOff,
  off,
  step) {
  const out = this._out
  const data = this._data
  const inv = this._inv ? -1 : 1
  const step2 = step * 2
  const step3 = step * 3

  // Original values
  const Ar = data[off]
  const Br = data[off + step]
  const Cr = data[off + step2]
  const Dr = data[off + step3]

  // Pre-Final values
  const T0r = Ar + Cr
  const T1r = Ar - Cr
  const T2r = Br + Dr
  const T3r = inv * (Br - Dr)

  // Final values
  const FAr = T0r + T2r

  const FBr = T1r
  const FBi = -T3r

  const FCr = T0r - T2r

  const FDr = T1r
  const FDi = T3r

  out[outOff] = FAr
  out[outOff + 1] = 0
  out[outOff + 2] = FBr
  out[outOff + 3] = FBi
  out[outOff + 4] = FCr
  out[outOff + 5] = 0
  out[outOff + 6] = FDr
  out[outOff + 7] = FDi
}


const WEBAUDIO_BLOCK_SIZE = 128

/** Overlap-Add Node */
// eslint-disable-next-line no-undef
class OLAProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options)

    this.nbInputs = options.numberOfInputs
    this.nbOutputs = options.numberOfOutputs

    this.blockSize = options.processorOptions.blockSize
    // TODO for now, the only support hop size is the size of a web audio block
    this.hopSize = WEBAUDIO_BLOCK_SIZE

    this.nbOverlaps = this.blockSize / this.hopSize

    // pre-allocate input buffers (will be reallocated if needed)
    this.inputBuffers = new Array(this.nbInputs)
    this.inputBuffersHead = new Array(this.nbInputs)
    this.inputBuffersToSend = new Array(this.nbInputs)
    // default to 1 channel per input until we know more
    for (let i = 0; i < this.nbInputs; i++) {
      this.allocateInputChannels(i, 1)
    }
    // pre-allocate input buffers (will be reallocated if needed)
    this.outputBuffers = new Array(this.nbOutputs)
    this.outputBuffersToRetrieve = new Array(this.nbOutputs)
    // default to 1 channel per output until we know more
    for (let i = 0; i < this.nbOutputs; i++) {
      this.allocateOutputChannels(i, 1)
    }
  }

  /** Handles dynamic reallocation of input/output channels buffer
     (channel numbers may vary during lifecycle) **/
  reallocateChannelsIfNeeded(inputs, outputs) {
    for (let i = 0; i < this.nbInputs; i++) {
      let nbChannels = inputs[i].length
      if (nbChannels != this.inputBuffers[i].length) {
        this.allocateInputChannels(i, nbChannels)
      }
    }

    for (let i = 0; i < this.nbOutputs; i++) {
      let nbChannels = outputs[i].length
      if (nbChannels != this.outputBuffers[i].length) {
        this.allocateOutputChannels(i, nbChannels)
      }
    }
  }

  allocateInputChannels(inputIndex, nbChannels) {
    // allocate input buffers

    this.inputBuffers[inputIndex] = new Array(nbChannels)
    for (let i = 0; i < nbChannels; i++) {
      this.inputBuffers[inputIndex][i] = new Float32Array(this.blockSize + WEBAUDIO_BLOCK_SIZE)
      this.inputBuffers[inputIndex][i].fill(0)
    }

    // allocate input buffers to send and head pointers to copy from
    // (cannot directly send a pointer/subarray because input may be modified)
    this.inputBuffersHead[inputIndex] = new Array(nbChannels)
    this.inputBuffersToSend[inputIndex] = new Array(nbChannels)
    for (let i = 0; i < nbChannels; i++) {
      this.inputBuffersHead[inputIndex][i] = this.inputBuffers[inputIndex][i].subarray(0, this.blockSize)
      this.inputBuffersToSend[inputIndex][i] = new Float32Array(this.blockSize)
    }
  }

  allocateOutputChannels(outputIndex, nbChannels) {
    // allocate output buffers
    this.outputBuffers[outputIndex] = new Array(nbChannels)
    for (let i = 0; i < nbChannels; i++) {
      this.outputBuffers[outputIndex][i] = new Float32Array(this.blockSize)
      this.outputBuffers[outputIndex][i].fill(0)
    }

    // allocate output buffers to retrieve
    // (cannot send a pointer/subarray because new output has to be add to exising output)
    this.outputBuffersToRetrieve[outputIndex] = new Array(nbChannels)
    for (let i = 0; i < nbChannels; i++) {
      this.outputBuffersToRetrieve[outputIndex][i] = new Float32Array(this.blockSize)
      this.outputBuffersToRetrieve[outputIndex][i].fill(0)
    }
  }

  /** Read next web audio block to input buffers **/
  readInputs(inputs) {
    // when playback is paused, we may stop receiving new samples
    if (inputs[0].length && inputs[0][0].length == 0) {
      for (let i = 0; i < this.nbInputs; i++) {
        for (let j = 0; j < this.inputBuffers[i].length; j++) {
          this.inputBuffers[i][j].fill(0, this.blockSize)
        }
      }
      return
    }

    for (let i = 0; i < this.nbInputs; i++) {
      for (let j = 0; j < this.inputBuffers[i].length; j++) {
        let webAudioBlock = inputs[i][j]
        this.inputBuffers[i][j].set(webAudioBlock, this.blockSize)
      }
    }
  }

  /** Write next web audio block from output buffers **/
  writeOutputs(outputs) {
    for (let i = 0; i < this.nbInputs; i++) {
      for (let j = 0; j < this.inputBuffers[i].length; j++) {
        let webAudioBlock = this.outputBuffers[i][j].subarray(0, WEBAUDIO_BLOCK_SIZE)
        outputs[i][j].set(webAudioBlock)
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

  /** Shift left content of output buffers to receive new web audio block **/
  shiftOutputBuffers() {
    for (let i = 0; i < this.nbOutputs; i++) {
      for (let j = 0; j < this.outputBuffers[i].length; j++) {
        this.outputBuffers[i][j].copyWithin(0, WEBAUDIO_BLOCK_SIZE)
        this.outputBuffers[i][j].subarray(this.blockSize - WEBAUDIO_BLOCK_SIZE).fill(0)
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

  process(inputs, outputs, params) {
    this.reallocateChannelsIfNeeded(inputs, outputs)

    this.readInputs(inputs)
    this.shiftInputBuffers()
    this.prepareInputBuffersToSend()
    this.processOLA(this.inputBuffersToSend, this.outputBuffersToRetrieve, params)
    this.handleOutputBuffersToRetrieve()
    this.writeOutputs(outputs)
    this.shiftOutputBuffers()

    return true
  }

  processOLA(inputs, outputs, params) {
    console.assert(false, 'Not overriden')
  }
}

const BUFFERED_BLOCK_SIZE = 4096

function genHannWindow(length) {
  let win = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    win[i] = 0.8 * (1 - Math.cos(2 * Math.PI * i / length))
  }
  return win
}

class PhaseVocoderProcessor extends OLAProcessor {
  static get parameterDescriptors() {
    return [{
      name: 'pitchFactor',
      defaultValue: 1.0,
    }]
  }

  constructor(options) {
    options.processorOptions = {
      blockSize: BUFFERED_BLOCK_SIZE,
    }
    super(options)

    this.fftSize = this.blockSize
    this.timeCursor = 0

    this.hannWindow = genHannWindow(this.blockSize)

    // prepare FFT and pre-allocate buffers
    this.fft = new FFT(this.fftSize)
    this.freqComplexBuffer = this.fft.createComplexArray()
    this.freqComplexBufferShifted = this.fft.createComplexArray()
    this.timeComplexBuffer = this.fft.createComplexArray()
    this.magnitudes = new Float32Array(this.fftSize / 2 + 1)
    this.peakIndexes = new Int32Array(this.magnitudes.length)
    this.nbPeaks = 0
  }

  processOLA(inputs, outputs, parameters) {
    // no automation, take last value
    const pitchFactor = parameters.pitchFactor[parameters.pitchFactor.length - 1]

    for (let i = 0; i < this.nbInputs; i++) {
      for (let j = 0; j < inputs[i].length; j++) {
        // big assumption here: output is symetric to input
        let input = inputs[i][j]
        let output = outputs[i][j]

        this.applyHannWindow(input)

        this.fft.realTransform(this.freqComplexBuffer, input)

        this.computeMagnitudes()
        this.findPeaks()
        this.shiftPeaks(pitchFactor)

        this.fft.completeSpectrum(this.freqComplexBufferShifted)
        this.fft.inverseTransform(this.timeComplexBuffer, this.freqComplexBufferShifted)
        this.fft.fromComplexArray(this.timeComplexBuffer, output)

        this.applyHannWindow(output)
      }
    }

    this.timeCursor += this.hopSize
  }

  /** Apply Hann window in-place */
  applyHannWindow(input) {
    for (let i = 0; i < this.blockSize; i++) {
      input[i] = input[i] * this.hannWindow[i]
    }
  }

  /** Compute squared magnitudes for peak finding **/
  computeMagnitudes() {
    let i = 0; let j = 0
    while (i < this.magnitudes.length) {
      let real = this.freqComplexBuffer[j]
      let imag = this.freqComplexBuffer[j + 1]
      // no need to sqrt for peak finding
      this.magnitudes[i] = real ** 2 + imag ** 2
      i += 1
      j += 2
    }
  }

  /** Find peaks in spectrum magnitudes **/
  findPeaks() {
    this.nbPeaks = 0
    let i = 2
    let end = this.magnitudes.length - 2

    while (i < end) {
      let mag = this.magnitudes[i]

      if (this.magnitudes[i - 1] >= mag || this.magnitudes[i - 2] >= mag) {
        i++
        continue
      }
      if (this.magnitudes[i + 1] >= mag || this.magnitudes[i + 2] >= mag) {
        i++
        continue
      }

      this.peakIndexes[this.nbPeaks] = i
      this.nbPeaks++
      i += 2
    }
  }

  /** Shift peaks and regions of influence by pitchFactor into new specturm */
  shiftPeaks(pitchFactor) {
    // zero-fill new spectrum
    this.freqComplexBufferShifted.fill(0)

    for (let i = 0; i < this.nbPeaks; i++) {
      let peakIndex = this.peakIndexes[i]
      let peakIndexShifted = Math.round(peakIndex * pitchFactor)

      if (peakIndexShifted > this.magnitudes.length) {
        break
      }

      // find region of influence
      let startIndex = 0
      let endIndex = this.fftSize
      if (i > 0) {
        let peakIndexBefore = this.peakIndexes[i - 1]
        startIndex = peakIndex - Math.floor((peakIndex - peakIndexBefore) / 2)
      }
      if (i < this.nbPeaks - 1) {
        let peakIndexAfter = this.peakIndexes[i + 1]
        endIndex = peakIndex + Math.ceil((peakIndexAfter - peakIndex) / 2)
      }

      // shift whole region of influence around peak to shifted peak
      let startOffset = startIndex - peakIndex
      let endOffset = endIndex - peakIndex
      for (let j = startOffset; j < endOffset; j++) {
        let binIndex = peakIndex + j
        let binIndexShifted = peakIndexShifted + j

        if (binIndexShifted >= this.magnitudes.length) {
          break
        }

        // apply phase correction
        let omegaDelta = 2 * Math.PI * (binIndexShifted - binIndex) / this.fftSize
        let phaseShiftReal = Math.cos(omegaDelta * this.timeCursor)
        let phaseShiftImag = Math.sin(omegaDelta * this.timeCursor)

        let indexReal = binIndex * 2
        let indexImag = indexReal + 1
        let valueReal = this.freqComplexBuffer[indexReal]
        let valueImag = this.freqComplexBuffer[indexImag]

        let valueShiftedReal = valueReal * phaseShiftReal - valueImag * phaseShiftImag
        let valueShiftedImag = valueReal * phaseShiftImag + valueImag * phaseShiftReal

        let indexShiftedReal = binIndexShifted * 2
        let indexShiftedImag = indexShiftedReal + 1
        this.freqComplexBufferShifted[indexShiftedReal] += valueShiftedReal
        this.freqComplexBufferShifted[indexShiftedImag] += valueShiftedImag
      }
    }
  }
}

// eslint-disable-next-line no-undef
registerProcessor('phase-vocoder-processor', PhaseVocoderProcessor)

