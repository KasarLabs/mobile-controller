import { PromptTemplate } from '@langchain/core/prompts';
import type { DeviceInfo } from '../mobile/index.js';

/**
 * Device environment data for prompt formatting
 */
export interface DeviceEnvironment extends DeviceInfo {
  screenWidth?: number;
  screenHeight?: number;
}

/**
 * Format a prompt template with device information and optional additional values
 *
 * @param promptTemplate - The prompt string with {variable} placeholders
 * @param deviceInfo - Device information to inject into the prompt
 * @param authorizedApps - List of authorized applications on the device
 * @param additionalValues - Optional additional values to inject (e.g., bible, userName, etc.)
 * @returns Formatted prompt string with all variables replaced
 *
 * @example
 * ```typescript
 * const formatted = await formatPromptWithDevice(
 *   DEEPAGENTS_SYSTEM_PROMPT,
 *   {
 *     id: 'device-123',
 *     name: 'iPhone 15',
 *     platform: 'iOS',
 *     type: 'mobile',
 *     version: '17.2',
 *     state: 'ready',
 *     screenWidth: 1170,
 *     screenHeight: 2532
 *   },
 *   {
 *     bible: 'User persona description...',
 *     userName: 'JohnDoe'
 *   }
 * );
 * ```
 */
export async function formatPromptWithDevice(
  promptTemplate: string,
  deviceInfo: DeviceEnvironment,
  authorizedApps : string[],
  additionalValues: Record<string, any> = {}
): Promise<string> {
  // Extract all variable names from the template
  const variableMatches = promptTemplate.match(/\{([^}]+)\}/g);

  if (!variableMatches) {
    // No variables to replace, return as is
    return promptTemplate;
  }

  // Extract unique variable names (without braces)
  const inputVariables = Array.from(
    new Set(variableMatches.map(match => match.slice(1, -1)))
  );

  // Create the LangChain PromptTemplate
  const prompt = new PromptTemplate({
    template: promptTemplate,
    inputVariables,
  });

  // Combine device info with additional values
  const values = {
    // Device info fields
    id: deviceInfo.id,
    name: deviceInfo.name,
    platform: deviceInfo.platform,
    type: deviceInfo.type,
    version: deviceInfo.version,
    state: deviceInfo.state,
    screenWidth: deviceInfo.screenWidth ?? 'unknown',
    screenHeight: deviceInfo.screenHeight ?? 'unknown',
    authorizedApps: authorizedApps.join(', '),
    // Additional values (can override device info if needed)
    ...additionalValues,
  };

  // Format the prompt
  const formattedPrompt = await prompt.format(values);

  return formattedPrompt;
}

/**
 * Format multiple prompts at once with the same device information
 *
 * @param prompts - Object with prompt names as keys and prompt templates as values
 * @param deviceInfo - Device information to inject
 * @param additionalValues - Optional additional values to inject
 * @returns Object with same keys but formatted prompt values
 *
 * @example
 * ```typescript
 * const formatted = await formatMultiplePrompts(
 *   {
 *     main: DEEPAGENTS_SYSTEM_PROMPT,
 *     subagent: TWITTER_TASK_SUBAGENT_PROMPT
 *   },
 *   deviceInfo,
 *   { bible: '...' }
 * );
 * // Access formatted.main and formatted.subagent
 * ```
 */
export async function formatMultiplePrompts(
  prompts: Record<string, string>,
  deviceInfo: DeviceEnvironment,
  authorizedApps : string[],
  additionalValues: Record<string, any> = {}
): Promise<Record<string, string>> {
  const formattedPrompts: Record<string, string> = {};

  for (const [key, template] of Object.entries(prompts)) {
    formattedPrompts[key] = await formatPromptWithDevice(
      template,
      deviceInfo,
      authorizedApps,
      additionalValues
    );
  }

  return formattedPrompts;
}

/**
 * Synchronous version of formatPromptWithDevice for cases where async is not needed
 * Uses simple string replacement instead of LangChain
 *
 * @param promptTemplate - The prompt string with {variable} placeholders
 * @param deviceInfo - Device information to inject
 * @param additionalValues - Optional additional values to inject
 * @returns Formatted prompt string
 */
export function formatPromptWithDeviceSync(
  promptTemplate: string,
  deviceInfo: DeviceEnvironment,
  additionalValues: Record<string, any> = {}
): string {
  const values = {
    id: deviceInfo.id,
    name: deviceInfo.name,
    platform: deviceInfo.platform,
    type: deviceInfo.type,
    version: deviceInfo.version,
    state: deviceInfo.state,
    screenWidth: deviceInfo.screenWidth ?? 'unknown',
    screenHeight: deviceInfo.screenHeight ?? 'unknown',
    ...additionalValues,
  };

  let formatted = promptTemplate;

  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    formatted = formatted.replace(regex, String(value));
  }

  return formatted;
}
