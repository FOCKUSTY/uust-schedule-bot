import { access, mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

export abstract class FileCache<Value> {
  private static readonly CACHE_DIR = join(process.cwd(), 'cache');
  private static readonly EXTENSION = '.cache';

  protected readonly filePath: string;
  protected data: Value;

  public constructor(section: string, initialData: Value, folder?: string) {
    const safeSection = this.sanitizeSectionName(section);
    const name = `${safeSection}${FileCache.EXTENSION}`;

    this.filePath = folder
      ? join(FileCache.CACHE_DIR, folder, name)
      : join(FileCache.CACHE_DIR, name);
      
    this.data = initialData;
  }

  public async load(): Promise<void> {
    try {
      await this.ensureDirectory();
      
      const content = await readFile(this.filePath, 'utf-8');
      this.data = JSON.parse(content) as Value;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return;
      }

      throw new Error(`Failed to load cache from "${this.filePath}": ${error}`);
    }
  }

  public async save(): Promise<void> {
    try {
      await this.ensureDirectory();
      const content = JSON.stringify(this.data, null, 2);
      await writeFile(this.filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save cache to "${this.filePath}": ${error}`);
    }
  }

  public async deleteFile(): Promise<void> {
    try {
      await unlink(this.filePath);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
        throw new Error(`Failed to delete cache file "${this.filePath}": ${error}`);
      }
    }
  }

  public async fileExists(): Promise<boolean> {
    try {
      await access(this.filePath);
      return true;
    } catch {
      return false;
    }
  }

  protected async ensureDirectory(): Promise<void> {
    try {
      await mkdir(FileCache.CACHE_DIR, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create cache directory "${FileCache.CACHE_DIR}": ${error}`);
    }
  }

  protected sanitizeSectionName(name: string): string {
    return name.replace(/[^a-zA-Z0-9-_]/g, '_');
  }

  protected isExpired(expiresAt?: string | number | Date): boolean {
    if (!expiresAt) {
      return false;
    }

    const expiryTimestamp = new Date(expiresAt).getTime();
    return Date.now() >= expiryTimestamp;
  }
}