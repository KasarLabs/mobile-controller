export interface VectorStoreConfig {
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: string;
  POSTGRES_TABLE_NAME: string;
}

export enum DocumentSource {
  TWITTER_GUIDELINES = 'twitter_guidelines',
}

export type BookChunk = {
  name: string;
  title: string;
  chunkNumber: number;
  contentHash: string;
  uniqueId: string;
  sourceLink: string;
  source: DocumentSource;
};
