import { DocumentSource } from '../types';
import { BaseIngester } from './BaseIngester';
import { TwitterGuidelineIngester } from '../ingesters/TwitterGuidelineIngester';

/**
 * Factory class for creating ingesters
 *
 * This class is responsible for creating the appropriate ingester based on the source.
 * It follows the Factory pattern to encapsulate the creation logic and make it easier
 * to add new ingesters in the future.
 */
export class IngesterFactory {
  /**
   * Create an ingester for the specified source
   *
   * @param source - The document source identifier
   * @returns An instance of the appropriate ingester
   * @throws Error if the source is not supported
   */
  public static createIngester(source: DocumentSource): BaseIngester {
    switch (source) {
      case DocumentSource.TWITTER_GUIDELINES:
        return new TwitterGuidelineIngester();
      default:
        throw new Error(`Unsupported source: ${source}`);
    }
  }

  /**
   * Get all available ingester sources
   *
   * @returns Array of available document sources
   */
  public static getAvailableSources(): DocumentSource[] {
    const sources = Object.values(DocumentSource);
    return sources;
  }
}
