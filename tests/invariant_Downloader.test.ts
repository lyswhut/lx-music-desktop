import { Downloader } from 'src/common/utils/download/Downloader';
import * as path from 'path';

describe('Downloader path construction must stay within intended directory boundaries', () => {
  const basePath = '/safe/download/dir';
  
  const payloads = [
    // Exact exploit: path traversal
    { filePath: basePath, fileName: '../../../etc/passwd', description: 'path traversal' },
    // Boundary: absolute path override
    { filePath: basePath, fileName: '/absolute/override.txt', description: 'absolute path' },
    // Valid input
    { filePath: basePath, fileName: 'safe-file.txt', description: 'valid filename' },
    // Boundary: null byte injection (common in path handling)
    { filePath: basePath, fileName: 'normal.txt\0../../../evil', description: 'null byte injection' },
    // Directory traversal with encoded sequences
    { filePath: basePath, fileName: '..%2f..%2fwin.ini', description: 'URL encoded traversal' }
  ];

  test.each(payloads)('rejects adversarial input: $description', ({ filePath, fileName }) => {
    const downloader = new Downloader('http://example.com/file', filePath, fileName);
    
    // Security property: constructed path must be normalized AND remain under basePath
    const constructedPath = downloader.chunkInfo.path;
    const normalizedPath = path.normalize(constructedPath);
    
    // WHAT MUST ALWAYS BE TRUE: normalized path must start with the intended base directory
    // Using path.relative to check if traversal escapes basePath
    const relative = path.relative(basePath, normalizedPath);
    const isOutside = relative.startsWith('..') || path.isAbsolute(relative);
    
    expect(isOutside).toBe(false);
  });
});