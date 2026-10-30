// Generates the extension icons (indigo tile with a white bookmark ribbon).
// Run with: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(here, '../public/icons')
const SIZES = [16, 32, 48, 128]

const BRAND = [79, 70, 229]
const RIBBON = [255, 255, 255]

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([length, body, crc])
}

function inRoundedSquare(x, y, radius) {
  const inset = 0.02
  const min = inset
  const max = 1 - inset
  if (x < min || x > max || y < min || y > max) return false
  const cx = Math.min(Math.max(x, min + radius), max - radius)
  const cy = Math.min(Math.max(y, min + radius), max - radius)
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2
}

function inRibbon(x, y) {
  const halfWidth = 0.17
  const top = 0.24
  const bottom = 0.78
  if (Math.abs(x - 0.5) > halfWidth || y < top || y > bottom) return false
  const notch = 0.18
  const notchTop = bottom - notch * (1 - Math.abs(x - 0.5) / halfWidth)
  return y <= notchTop
}

function render(size) {
  const samples = 3
  const pixels = Buffer.alloc(size * size * 4)
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let alpha = 0
      let ribbon = 0
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const x = (px + (sx + 0.5) / samples) / size
          const y = (py + (sy + 0.5) / samples) / size
          if (!inRoundedSquare(x, y, 0.22)) continue
          alpha += 1
          if (inRibbon(x, y)) ribbon += 1
        }
      }
      const total = samples * samples
      const offset = (py * size + px) * 4
      if (alpha === 0) {
        pixels.writeUInt32BE(0, offset)
        continue
      }
      const mix = ribbon / alpha
      pixels[offset] = Math.round(BRAND[0] * (1 - mix) + RIBBON[0] * mix)
      pixels[offset + 1] = Math.round(BRAND[1] * (1 - mix) + RIBBON[1] * mix)
      pixels[offset + 2] = Math.round(BRAND[2] * (1 - mix) + RIBBON[2] * mix)
      pixels[offset + 3] = Math.round((alpha / total) * 255)
    }
  }

  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(outDir, { recursive: true })
for (const size of SIZES) {
  const file = resolve(outDir, `icon-${size}.png`)
  writeFileSync(file, render(size))
  console.log(`wrote ${file}`)
}
