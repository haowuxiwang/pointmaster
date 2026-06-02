const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Convert JFIF/JPEG to ICO for Windows
async function convertToIco() {
  const inputPath = path.join(__dirname, '..', '6f663a10-6b15-45a0-887b-9b22eb7bce6d.jfif');
  const outputDir = path.join(__dirname, '..', 'build');
  const outputPath = path.join(outputDir, 'icon.ico');

  // Ensure build directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // ICO sizes
  const sizes = [16, 32, 48, 256];

  try {
    // Generate PNG buffers for each size
    const pngBuffers = await Promise.all(
      sizes.map(size =>
        sharp(inputPath)
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer()
      )
    );

    // Use sharp to create the ICO file
    // Note: sharp doesn't directly support ICO output, so we'll create PNGs
    // and use the largest one as icon.png for Linux, and we'll need to use
    // a different approach for ICO

    // For now, let's create the PNG files and then use a simple ICO writer
    await sharp(inputPath)
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, 'icon.png'));

    console.log('Created icon.png (256x256)');

    // Create a simple ICO file using the PNG data
    // ICO format: header + directory entries + image data
    const iconDir = createIcoDirectory(pngBuffers, sizes);
    fs.writeFileSync(outputPath, iconDir);
    console.log(`Created icon.ico at: ${outputPath}`);

  } catch (error) {
    console.error('Error converting icon:', error);
    process.exit(1);
  }
}

function createIcoDirectory(pngBuffers, sizes) {
  // ICO Header: 6 bytes
  // - Reserved: 2 bytes (0)
  // - Type: 2 bytes (1 = ICO)
  // - Count: 2 bytes (number of images)

  // Directory Entry: 16 bytes each
  // - Width: 1 byte (0 = 256)
  // - Height: 1 byte (0 = 256)
  // - Color count: 1 byte (0)
  // - Reserved: 1 byte (0)
  // - Color planes: 2 bytes (1)
  // - Bits per pixel: 2 bytes (32)
  // - Image size: 4 bytes
  // - Image offset: 4 bytes

  const headerSize = 6;
  const entrySize = 16;
  const headerAndEntries = headerSize + (entrySize * pngBuffers.length);

  // Calculate total size
  let totalSize = headerAndEntries;
  for (const buf of pngBuffers) {
    totalSize += buf.length;
  }

  const buffer = Buffer.alloc(totalSize);
  let offset = 0;

  // Write header
  buffer.writeUInt16LE(0, offset); offset += 2; // Reserved
  buffer.writeUInt16LE(1, offset); offset += 2; // Type: ICO
  buffer.writeUInt16LE(pngBuffers.length, offset); offset += 2; // Count

  // Write directory entries
  let imageOffset = headerAndEntries;
  for (let i = 0; i < pngBuffers.length; i++) {
    const size = sizes[i];
    buffer.writeUInt8(size === 256 ? 0 : size, offset); offset += 1; // Width
    buffer.writeUInt8(size === 256 ? 0 : size, offset); offset += 1; // Height
    buffer.writeUInt8(0, offset); offset += 1; // Color count
    buffer.writeUInt8(0, offset); offset += 1; // Reserved
    buffer.writeUInt16LE(1, offset); offset += 2; // Color planes
    buffer.writeUInt16LE(32, offset); offset += 2; // Bits per pixel
    buffer.writeUInt32LE(pngBuffers[i].length, offset); offset += 4; // Image size
    buffer.writeUInt32LE(imageOffset, offset); offset += 4; // Image offset
    imageOffset += pngBuffers[i].length;
  }

  // Write image data
  for (const buf of pngBuffers) {
    buf.copy(buffer, offset);
    offset += buf.length;
  }

  return buffer;
}

convertToIco();