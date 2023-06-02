// https://github.com/indutny/fft.js


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

export default FFT
