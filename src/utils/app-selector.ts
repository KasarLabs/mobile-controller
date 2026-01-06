import { checkbox } from '@inquirer/prompts';

/**
 * Available social media apps configuration
 */
export interface AppConfig {
  name: string;
  identifier: string;
  description: string;
}

/**
 * Predefined list of available apps
 */
export const AVAILABLE_APPS: AppConfig[] = [
  {
    name: 'Twitter',
    identifier: 'com.twitter.android',
    description: 'Engage with tweets, replies, likes, and retweets',
  },
  {
    name: 'Instagram',
    identifier: 'com.instagram.android',
    description: 'Interact with posts, stories, reels, and DMs',
  },
  {
    name: 'TikTok',
    identifier: 'com.zhiliaoapp.musically',
    description: 'Like, comment, and share short-form videos',
  },
  {
    name: 'YouTube',
    identifier: 'com.google.android.youtube',
    description: 'Comment, like, subscribe, and save videos',
  },
  {
    name: 'Facebook',
    identifier: 'com.facebook.katana',
    description: 'Like, comment, share posts, and interact with friends',
  },
];

/**
 * Interactive app selector using Inquirer checkbox
 *
 * @returns Array of selected AppConfig objects
 */
export async function selectApps(): Promise<AppConfig[]> {
  console.log('\n📱 Available Social Media Apps:\n');

  AVAILABLE_APPS.forEach((app, index) => {
    console.log(`${index + 1}. ${app.name}`);
    console.log(`   Package:     ${app.identifier}`);
    console.log(`   Features:    ${app.description}`);
    console.log('');
  });

  // Create choices for the checkbox prompt
  const choices = AVAILABLE_APPS.map(app => ({
    name: `${app.name} - ${app.description}`,
    value: app.name,
    checked: false, // None selected by default
  }));

  // Let user select multiple apps using checkboxes
  const selectedAppNames = await checkbox({
    message:
      'Select the apps you want to use (use space to select, enter to confirm):',
    choices: choices,
    required: true, // At least one app must be selected
  });

  // Find and return the selected apps
  const selectedApps = AVAILABLE_APPS.filter(app =>
    selectedAppNames.includes(app.name)
  );

  if (selectedApps.length === 0) {
    throw new Error('No apps selected. Please select at least one app.');
  }

  console.log('\n✅ Selected apps:');
  selectedApps.forEach(app => {
    console.log(`   - ${app.name} (${app.identifier})`);
  });
  console.log('');

  return selectedApps;
}

/**
 * Get app configuration by name
 *
 * @param appName - The name of the app
 * @returns AppConfig object or undefined
 */
export function getAppByName(appName: string): AppConfig | undefined {
  return AVAILABLE_APPS.find(app => app.name === appName);
}
