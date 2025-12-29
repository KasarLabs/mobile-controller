import { DocumentSource } from '../types';
import type { BookConfig, BookPageDto } from '../utils/types';
import { logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MarkdownIngester } from './MarkdownIngester';
import { processDocFiles } from '../utils/fileUtils';

/**
 * Ingester for Twitter Guidelines documentation
 *
 * This ingester processes local markdown files containing Twitter usage guidelines
 * and best practices. Unlike other ingesters, this reads from a local directory
 * instead of downloading from a remote repository.
 */
export class TwitterGuidelineIngester extends MarkdownIngester {
  private static readonly BASE_URL = 'https://twitter.com/guidelines';
  private static readonly LOCAL_DOCS_PATH = 'local/docs/twitter';

  constructor() {
    const config: BookConfig = {
      repoName: 'twitter-guidelines',
      repoOwner: 'local',
      fileExtensions: ['.md', '.mdx'],
      chunkSize: 4096,
      chunkOverlap: 512,
      baseUrl: TwitterGuidelineIngester.BASE_URL,
      urlSuffix: '',
      useUrlMapping: false, // We don't have specific URLs for local docs
    };
    super(config, DocumentSource.TWITTER_GUIDELINES);
  }

  /**
   * Get the directory path for extracting files
   * For local files, this returns the local docs directory
   *
   * @returns string - Path to the local docs directory
   */
  protected getExtractDir(): string {
    return path.resolve(
      process.cwd(),
      TwitterGuidelineIngester.LOCAL_DOCS_PATH
    );
  }

  /**
   * Process local Twitter guideline markdown files
   * Overrides the default download behavior to read from local directory
   *
   * @returns Promise<BookPageDto[]> - Array of book pages
   */
  protected override async downloadAndExtractDocs(): Promise<BookPageDto[]> {
    const docsDir = this.getExtractDir();

    logger.info(`Processing local Twitter guidelines from ${docsDir}`);

    // Check if directory exists
    try {
      await fs.access(docsDir);
    } catch (error) {
      throw new Error(
        `Local Twitter guidelines directory not found: ${docsDir}. Please create it and add markdown files.`
      );
    }

    // Process all markdown files from the local directory
    const pages = await processDocFiles(this.config, docsDir);

    if (pages.length === 0) {
      logger.warn(
        `No markdown files found in ${docsDir}. Please add .md or .mdx files.`
      );
    }

    logger.info(
      `Processed ${pages.length} documentation pages from Twitter Guidelines`
    );

    return pages;
  }

  /**
   * Clean up is not needed for local files
   * Override to prevent deletion of local documentation
   */
  protected override async cleanupDownloadedFiles(): Promise<void> {
    logger.info('Skipping cleanup for local Twitter guidelines files');
  }
}
