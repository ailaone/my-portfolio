import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mime from 'mime'; // You might need to install 'mime' or write a simple helper

// Helper for mime types if package not installed
function getMimeType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const project = searchParams.get('project');
  const type = searchParams.get('type'); // 'image' | 'model'
  const file = searchParams.get('file');

  if (!project || !type || !file) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  // Security: Basic Path Traversal Prevention
  if (project.includes('..') || type.includes('..') || file.includes('..')) {
    return new NextResponse('Invalid path', { status: 403 });
  }

  // Map 'image' -> 'images', 'model' -> '3d' (or whatever your folder structure is)
  const folderMap: Record<string, string> = {
    'image': 'images',
    'model': '3d',
    'text': 'text' // in case we want to serve md files directly later
  };

  const subfolder = folderMap[type];
  if (!subfolder) {
    return new NextResponse('Invalid type', { status: 400 });
  }

  const filePath = path.join((process as any).cwd(), 'content', 'projects', project, subfolder, file);

  if (!fs.existsSync(filePath)) {
    return new NextResponse('File not found', { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const contentType = getMimeType(file);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}