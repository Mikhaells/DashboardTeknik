import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

// Upload directory configuration
// Priority: UPLOAD_DIR env var > process.cwd()/public/uploads
const UPLOAD_BASE_PATH = process.env.UPLOAD_DIR 
  ? resolve(process.env.UPLOAD_DIR)
  : join(process.cwd(), 'public', 'uploads');

// Ensure base upload directory exists at module load time
if (!existsSync(UPLOAD_BASE_PATH)) {
  mkdir(UPLOAD_BASE_PATH, { recursive: true }).catch(err => {
    console.error(`[file-upload] Failed to create UPLOAD_BASE_PATH (${UPLOAD_BASE_PATH}):`, err);
  });
}

/**
 * Save uploaded file to local directory
 * @param file - File to save
 * @param laporanId - ID of the laporan (used for folder structure)
 * @param subfolder - Subfolder name (e.g. 'laporan-harian-teknisi', 'laporan-genset')
 * @returns Path to saved file (relative path for public access via /uploads/)
 */
export async function saveUploadedFile(file: File, laporanId: number, subfolder: string = 'laporan-harian-teknisi'): Promise<string> {
  try {
    // Create directory if not exists
    const laporanDir = join(UPLOAD_BASE_PATH, subfolder, laporanId.toString());
    await mkdir(laporanDir, { recursive: true });

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, '_');
    const filename = `${timestamp}_${originalName}`;
    
    // Full path where file will be saved
    const filePath = join(laporanDir, filename);

    // Convert file to buffer and write to disk
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Return relative path for public access
    const prefix = process.env.UPLOAD_DIR ? '/api/uploads' : '/uploads';
    const relativePath = `${prefix}/${subfolder}/${laporanId}/${filename}`;
    
    console.log(`[file-upload] Saved: ${filePath}`);
    return relativePath;
  } catch (error) {
    console.error(`[file-upload] Error saving file (subfolder: ${subfolder}, laporanId: ${laporanId}):`, error);
    throw new Error(`Gagal menyimpan file gambar: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save multiple files
 * @param files - Array of files to save
 * @param laporanId - ID of the laporan
 * @param subfolder - Subfolder name
 * @returns Array of paths to saved files
 */
export async function saveMultipleFiles(files: File[], laporanId: number, subfolder: string = 'laporan-harian-teknisi'): Promise<string[]> {
  try {
    const filePaths = await Promise.all(
      files.map(file => saveUploadedFile(file, laporanId, subfolder))
    );
    return filePaths;
  } catch (error) {
    console.error('[file-upload] Error saving multiple files:', error);
    throw error;
  }
}
