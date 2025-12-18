import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { select } from '@inquirer/prompts';
import type { Bible } from '../types/bible.js';

/**
 * Default path to the bible directory
 */
const DEFAULT_BIBLE_DIR = join(process.cwd(), 'local', 'bible');

/**
 * Load all Bible files from the local/bible directory
 *
 * @param bibleDir - Optional custom bible directory path
 * @returns Array of Bible objects
 */
export async function loadAllBibles(
  bibleDir: string = DEFAULT_BIBLE_DIR
): Promise<Bible[]> {
  try {
    const files = await readdir(bibleDir);

    // Filter for JSON files only
    const jsonFiles = files.filter(
      file => file.endsWith('.json') && !file.startsWith('.')
    );

    if (jsonFiles.length === 0) {
      throw new Error(
        `No Bible files found in ${bibleDir}. Please create at least one Bible JSON file.`
      );
    }

    // Load and parse each Bible file
    const bibles: Bible[] = [];

    for (const file of jsonFiles) {
      try {
        const filePath = join(bibleDir, file);
        const content = await readFile(filePath, 'utf-8');
        const bible = JSON.parse(content) as Bible;

        // Validate required fields
        if (!bible.name || !bible.bio) {
          console.warn(
            `⚠️  Skipping ${file}: Missing required fields (name or bio)`
          );
          continue;
        }

        bibles.push(bible);
      } catch (error) {
        console.warn(`⚠️  Failed to load ${file}:`, error);
      }
    }

    if (bibles.length === 0) {
      throw new Error(
        'No valid Bible files found. Please check your JSON files for errors.'
      );
    }

    return bibles;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `Bible directory not found: ${bibleDir}\nPlease create the directory and add Bible JSON files.`
      );
    }
    throw error;
  }
}

/**
 * Load a specific Bible by name
 *
 * @param bibleName - The name of the Bible to load
 * @param bibleDir - Optional custom bible directory path
 * @returns The Bible object
 */
export async function loadBibleByName(
  bibleName: string,
  bibleDir: string = DEFAULT_BIBLE_DIR
): Promise<Bible> {
  const bibles = await loadAllBibles(bibleDir);
  const bible = bibles.find(b => b.name === bibleName);

  if (!bible) {
    throw new Error(
      `Bible with name "${bibleName}" not found. Available: ${bibles.map(b => b.name).join(', ')}`
    );
  }

  return bible;
}

/**
 * Interactive Bible selector using Inquirer
 *
 * @param bibleDir - Optional custom bible directory path
 * @returns Selected Bible object
 */
export async function selectBible(
  bibleDir: string = DEFAULT_BIBLE_DIR
): Promise<Bible> {
  const bibles = await loadAllBibles(bibleDir);

  if (bibles.length === 0) {
    throw new Error('No Bible files available to select from');
  }

  // Display all Bibles to the user
  console.log('\n📖 Available Personas (Bibles):\n');

  bibles.forEach((bible, index) => {
    console.log(`${index + 1}. ${bible.name}`);
    console.log(`   Bio:       ${bible.bio}`);
    console.log(`   Style:     ${bible.style}`);
    console.log(`   Interests: ${bible.interests.slice(0, 3).join(', ')}${bible.interests.length > 3 ? '...' : ''}`);
    console.log('');
  });

  // Create choices for the selection prompt
  const choices = bibles.map(bible => ({
    name: `${bible.name} - ${bible.style}`,
    value: bible.name,
    description: bible.bio,
  }));

  // Let user select a Bible using arrow keys
  const selectedBibleName = await select({
    message: 'Select a persona to embody:',
    choices: choices,
  });

  // Find and return the selected Bible
  const selectedBible = bibles.find(bible => bible.name === selectedBibleName);

  if (!selectedBible) {
    throw new Error('Selected Bible not found');
  }

  console.log(
    `\n✅ Selected persona: ${selectedBible.name} - "${selectedBible.bio}"\n`
  );

  return selectedBible;
}

/**
 * Convert Bible to a formatted string for the agent prompt
 *
 * @param bible - The Bible object to convert
 * @returns Formatted string for use in agent prompts
 */
export function bibleToPromptString(bible: Bible): string {
  const sections: string[] = [];

  sections.push(`=== PERSONA: ${bible.name} ===\n`);
  sections.push(`Bio: ${bible.bio}`);
  sections.push(`Style: ${bible.style}\n`);

  sections.push('INTERESTS:');
  bible.interests.forEach(interest => {
    sections.push(`  - ${interest}`);
  });
  sections.push('');

  if (bible.avoid && bible.avoid.length > 0) {
    sections.push('AVOID TOPICS:');
    bible.avoid.forEach(topic => {
      sections.push(`  - ${topic}`);
    });
    sections.push('');
  }

  if (bible.emojis && bible.emojis.length > 0) {
    sections.push(`Favorite emojis: ${bible.emojis.join(' ')}\n`);
  }

  sections.push('='.repeat(50));

  return sections.join('\n');
}
