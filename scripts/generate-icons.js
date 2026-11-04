import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height, drawPixelFn) {
  // RGBA buffer with filter byte per row
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixelFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        const bit = (crc ^ byte) & 1;
        crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
        byte >>>= 1;
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Melon icon pixel drawer
function drawWatermelon(x, y, w, h, isMaskable = false) {
  // Normalize to 32x32 grid
  const padding = isMaskable ? 0.2 : 0.05;
  const safeW = w * (1 - padding * 2);
  const safeH = h * (1 - padding * 2);
  const relX = (x - w * padding) / safeW;
  const relY = (y - h * padding) / safeH;

  const bgR = 19, bgG = 30, bgB = 19; // #131e13
  if (relX < 0 || relX >= 1 || relY < 0 || relY >= 1) {
    return [bgR, bgG, bgB, 255];
  }

  const gx = Math.floor(relX * 32);
  const gy = Math.floor(relY * 32);

  // Outer circle / arc for melon slice
  const dx = gx - 16;
  const dy = gy - 16;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 14) {
    return [bgR, bgG, bgB, 255];
  }

  // Dark green rind
  if (dist > 12) {
    return [27, 77, 36, 255]; // #1b4d24
  }
  // Pale green inner rind
  if (dist > 10.5) {
    return [120, 177, 89, 255]; // #78b159
  }

  // Seeds
  const seedPositions = [
    [12, 14], [20, 14], [16, 18], [11, 21], [21, 21], [16, 25]
  ];
  for (const [sx, sy] of seedPositions) {
    if (Math.abs(gx - sx) <= 0.8 && Math.abs(gy - sy) <= 0.8) {
      return [25, 25, 25, 255];
    }
  }

  // Red flesh
  return [216, 58, 58, 255]; // #d83a3a
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPng(192, 192, (x, y, w, h) => drawWatermelon(x, y, w, h, false)));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPng(512, 512, (x, y, w, h) => drawWatermelon(x, y, w, h, false)));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPng(512, 512, (x, y, w, h) => drawWatermelon(x, y, w, h, true)));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => drawWatermelon(x, y, w, h, false)));
fs.writeFileSync(path.join(outDir, 'favicon.ico'), createPng(32, 32, (x, y, w, h) => drawWatermelon(x, y, w, h, false)));

console.log('PWA icon assets generated successfully.');
