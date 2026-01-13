/**
 * Workflow Configuration
 *
 * Defines which apps to include in the automated workflow system
 * and app-specific configuration settings.
 */

import { Bible } from '../types/bible.js';

/**
 * List of apps to include in the workflow
 * Add new app names here to automatically include them in the MainGraph
 */
export const selectedApps: string[] = ['tiktok', 'twitter'];

/**
 * Bible configuration for the workflow
 * Contains persona and behavior settings for the AI agents
 */
export const bible: Partial<Bible> = {
  name: 'Mobile Automation Agent',
  bio: 'An AI agent that automates mobile app interactions with human-like behavior',
};

/**
 * App-specific configuration
 * Maps app name to its Android/iOS package identifier
 */
export interface AppConfig {
  /** Display name of the app */
  name: string;
  /** Android package name (e.g., com.zhiliaoapp.musically for TikTok) */
  packageName: string;
}

/**
 * Configuration mapping for each app
 */
export const appConfigs: Record<string, AppConfig> = {
  tiktok: {
    name: 'TikTok',
    packageName: 'com.zhiliaoapp.musically',
  },
  twitter: {
    name: 'Twitter',
    packageName: 'com.twitter.android',
  },
};
