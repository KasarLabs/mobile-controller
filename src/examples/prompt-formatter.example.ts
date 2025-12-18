// /**
//  * Example usage of prompt formatting utilities
//  *
//  * This file demonstrates how to use the formatPromptWithDevice function
//  * to inject device information into agent prompts.
//  */

// import {
//   DEEPAGENTS_SYSTEM_PROMPT,
//   TWITTER_TASK_SUBAGENT_PROMPT,
// } from '../prompts/agents/index.js';
// import {
//   formatPromptWithDevice,
//   formatMultiplePrompts,
//   type DeviceEnvironment,
// } from '../utils/prompt-formatter.js';

// /**
//  * Example 1: Format a single prompt with device info
//  */
// export async function exampleSinglePrompt() {
//   const deviceInfo: DeviceEnvironment = {
//     id: 'emulator-5554',
//     name: 'Pixel 6 Pro',
//     platform: 'Android',
//     type: 'emulator',
//     version: '13.0',
//     state: 'device',
//     screenWidth: 1440,
//     screenHeight: 3120,
//   };

//   const formattedPrompt = await formatPromptWithDevice(
//     DEEPAGENTS_SYSTEM_PROMPT,
//     deviceInfo
//   );

//   console.log('Formatted DeepAgent Prompt:');
//   console.log(formattedPrompt);
//   console.log('\n---\n');

//   return formattedPrompt;
// }

// /**
//  * Example 2: Format with device info AND additional values (like bible)
//  */
// export async function exampleWithBible() {
//   const deviceInfo: DeviceEnvironment = {
//     id: 'iPhone-15-Pro',
//     name: 'iPhone 15 Pro',
//     platform: 'iOS',
//     type: 'physical',
//     version: '17.2',
//     state: 'ready',
//     screenWidth: 1179,
//     screenHeight: 2556,
//   };

//   const userBible = `
// You are Alex Chen, a 28-year-old software engineer and tech enthusiast based in San Francisco.

// Personality:
// - Witty and slightly sarcastic
// - Passionate about open source and developer tools
// - Care deeply about Web3, AI, and decentralization
// - Use tech jargon naturally but not excessively
// - Occasionally use emojis (🔥, 💯, 🚀, 🤔)
// - Write in lowercase often, casual and conversational

// Interests:
// - Building dev tools and infrastructure
// - Following latest in AI/ML research
// - Crypto/blockchain tech (especially Ethereum, Starknet)
// - Indie hacking and bootstrapped startups
// - Coffee culture (pour-over enthusiast)

// Typical behavior:
// - Tweet 3-5 times a day, mostly tech-related
// - Retweet interesting technical threads
// - Reply to dev discussions with insights or questions
// - Share thoughts on new tools/frameworks
// - Occasional personal tweets about coffee or SF life
// - Rarely uses hashtags, prefers natural conversation
// `;

//   const formattedPrompt = await formatPromptWithDevice(
//     DEEPAGENTS_SYSTEM_PROMPT,
//     deviceInfo,
//     {
//       bible: userBible,
//       userName: 'alexchen',
//       twitterHandle: '@alexchen_dev',
//     }
//   );

//   console.log('Formatted Prompt with Bible:');
//   console.log(formattedPrompt.substring(0, 500) + '...');

//   return formattedPrompt;
// }

// /**
//  * Example 3: Format multiple prompts at once (main + subagent)
//  */
// export async function exampleMultiplePrompts() {
//   const deviceInfo: DeviceEnvironment = {
//     id: 'Galaxy-S23',
//     name: 'Samsung Galaxy S23',
//     platform: 'Android',
//     type: 'physical',
//     version: '14.0',
//     state: 'ready',
//     screenWidth: 1080,
//     screenHeight: 2340,
//   };

//   const formatted = await formatMultiplePrompts(
//     {
//       mainAgent: DEEPAGENTS_SYSTEM_PROMPT,
//       twitterTaskAgent: TWITTER_TASK_SUBAGENT_PROMPT,
//     },
//     deviceInfo,
//     {
//       bible: 'Your persona description here...',
//     }
//   );

//   console.log('Main Agent Prompt ready:', formatted.mainAgent.length, 'chars');
//   console.log(
//     'Twitter Task Agent Prompt ready:',
//     formatted.twitterTaskAgent.length,
//     'chars'
//   );

//   return formatted;
// }

// /**
//  * Example 4: Use in agent creation
//  */
// export async function exampleAgentCreation() {
//   const deviceInfo: DeviceEnvironment = {
//     id: 'test-device',
//     name: 'Test Phone',
//     platform: 'iOS',
//     type: 'simulator',
//     version: '17.0',
//     state: 'booted',
//     screenWidth: 1170,
//     screenHeight: 2532,
//   };

//   // Format the prompt
//   const systemPrompt = await formatPromptWithDevice(
//     DEEPAGENTS_SYSTEM_PROMPT,
//     deviceInfo,
//     {
//       bible: 'Your character description...',
//     }
//   );

//   // Now you can use this with createDeepAgent
//   /*
//   const agent = createDeepAgent({
//     model: 'claude-sonnet-4-5-20250929',
//     systemPrompt: systemPrompt,  // ✅ Formatted with device info
//     tools: [...],
//     subagents: [...],
//   });
//   */

//   console.log('System prompt ready for agent creation!');
//   return systemPrompt;
// }

// // Run examples if this file is executed directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   (async () => {
//     console.log('=== Example 1: Single Prompt ===\n');
//     await exampleSinglePrompt();

//     console.log('\n=== Example 2: With Bible ===\n');
//     await exampleWithBible();

//     console.log('\n=== Example 3: Multiple Prompts ===\n');
//     await exampleMultiplePrompts();

//     console.log('\n=== Example 4: Agent Creation ===\n');
//     await exampleAgentCreation();
//   })();
// }
