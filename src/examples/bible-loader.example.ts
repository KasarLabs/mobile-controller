// /**
//  * Example usage of Bible loading and selection
//  *
//  * This file demonstrates how to:
//  * 1. Load and select a Bible interactively
//  * 2. Convert it to a prompt string
//  * 3. Combine it with device info to create a complete agent prompt
//  */

// import {
//   selectBible,
//   loadAllBibles,
//   loadBibleById,
//   bibleToPromptString,
//   formatPromptWithDevice,
//   type DeviceEnvironment,
// } from '../utils/index.js';
// import {
//   DEEPAGENTS_SYSTEM_PROMPT,
//   TWITTER_TASK_SUBAGENT_PROMPT,
// } from '../prompts/agents/index.js';
// import type { Bible } from '../types/index.js';

// /**
//  * Example 1: Interactive Bible selection
//  */
// export async function exampleInteractiveBibleSelection() {
//   console.log('=== Example 1: Interactive Bible Selection ===\n');

//   try {
//     // This will show an interactive prompt to select a Bible
//     const bible = await selectBible();

//     console.log('Selected Bible:');
//     console.log(`- ID: ${bible.id}`);
//     console.log(`- Name: ${bible.name}`);
//     console.log(`- Version: ${bible.version}`);
//     console.log(`- Profession: ${bible.persona.profession}`);

//     return bible;
//   } catch (error) {
//     console.error('Error selecting Bible:', error);
//     throw error;
//   }
// }

// /**
//  * Example 2: Load all Bibles programmatically
//  */
// export async function exampleLoadAllBibles() {
//   console.log('=== Example 2: Load All Bibles ===\n');

//   const bibles = await loadAllBibles();

//   console.log(`Found ${bibles.length} Bible(s):\n`);

//   bibles.forEach(bible => {
//     console.log(`📖 ${bible.name} (${bible.id})`);
//     console.log(`   Version: ${bible.version}`);
//     console.log(`   Description: ${bible.description}`);
//     console.log('');
//   });

//   return bibles;
// }

// /**
//  * Example 3: Load a specific Bible by ID
//  */
// export async function exampleLoadBibleById() {
//   console.log('=== Example 3: Load Bible by ID ===\n');

//   const bible = await loadBibleById('alex-chen-dev');

//   console.log(`Loaded: ${bible.name}`);
//   console.log(`Bio: ${bible.persona.bio}`);

//   return bible;
// }

// /**
//  * Example 4: Convert Bible to prompt string
//  */
// export async function exampleBibleToPromptString() {
//   console.log('=== Example 4: Convert Bible to Prompt String ===\n');

//   const bible = await loadBibleById('alex-chen-dev');
//   const promptString = bibleToPromptString(bible);

//   console.log('Generated Prompt String:');
//   console.log('-'.repeat(50));
//   console.log(promptString);
//   console.log('-'.repeat(50));

//   return promptString;
// }

// /**
//  * Example 5: Complete workflow - Device + Bible -> Formatted Prompt
//  */
// export async function exampleCompleteWorkflow() {
//   console.log('=== Example 5: Complete Workflow ===\n');

//   // Step 1: Load Bible
//   const bible = await loadBibleById('alex-chen-dev');
//   console.log(`✅ Loaded Bible: ${bible.name}\n`);

//   // Step 2: Create device info (normally from MCP)
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
//   console.log(`✅ Device Info: ${deviceInfo.name}\n`);

//   // Step 3: Convert Bible to string
//   const bibleString = bibleToPromptString(bible);

//   // Step 4: Format the main agent prompt with device info and bible
//   const formattedMainPrompt = await formatPromptWithDevice(
//     DEEPAGENTS_SYSTEM_PROMPT,
//     deviceInfo,
//     {
//       bible: bibleString,
//       userName: bible.persona.fullName,
//       twitterHandle: bible.platforms?.twitter?.handle || '@user',
//     }
//   );

//   // Step 5: Format the subagent prompt
//   const formattedSubagentPrompt = await formatPromptWithDevice(
//     TWITTER_TASK_SUBAGENT_PROMPT,
//     deviceInfo
//   );

//   console.log('✅ Generated Prompts:\n');
//   console.log(`Main Agent Prompt: ${formattedMainPrompt.length} characters`);
//   console.log(
//     `Subagent Prompt: ${formattedSubagentPrompt.length} characters\n`
//   );

//   console.log('Preview (first 500 chars of main prompt):');
//   console.log('-'.repeat(50));
//   console.log(formattedMainPrompt.substring(0, 500) + '...');
//   console.log('-'.repeat(50));

//   return {
//     bible,
//     deviceInfo,
//     mainPrompt: formattedMainPrompt,
//     subagentPrompt: formattedSubagentPrompt,
//   };
// }

// /**
//  * Example 6: Full agent initialization flow (as you'd use in main.ts)
//  */
// export async function exampleFullAgentInit() {
//   console.log('=== Example 6: Full Agent Initialization Flow ===\n');

//   try {
//     // Step 1: Interactive Bible selection
//     console.log('📖 Step 1: Select your persona...\n');
//     const bible = await selectBible();

//     // Step 2: Get device info (mock - in real usage this comes from MCP)
//     console.log('\n📱 Step 2: Device information...\n');
//     const deviceInfo: DeviceEnvironment = {
//       id: 'device-001',
//       name: 'Test Device',
//       platform: 'Android',
//       type: 'emulator',
//       version: '13.0',
//       state: 'device',
//       screenWidth: 1080,
//       screenHeight: 2340,
//     };
//     console.log(
//       `Using device: ${deviceInfo.name} (${deviceInfo.platform} ${deviceInfo.version})\n`
//     );

//     // Step 3: Prepare prompts
//     console.log('⚙️  Step 3: Preparing agent prompts...\n');

//     const bibleString = bibleToPromptString(bible);

//     const mainPrompt = await formatPromptWithDevice(
//       DEEPAGENTS_SYSTEM_PROMPT,
//       deviceInfo,
//       {
//         bible: bibleString,
//       }
//     );

//     const subagentPrompt = await formatPromptWithDevice(
//       TWITTER_TASK_SUBAGENT_PROMPT,
//       deviceInfo
//     );

//     console.log('✅ Agent prompts ready!\n');

//     // Step 4: Create agent (pseudo-code)
//     console.log('🤖 Step 4: Creating DeepAgent...\n');
//     /*
//     const agent = createDeepAgent({
//       model: 'claude-sonnet-4-5-20250929',
//       systemPrompt: mainPrompt,
//       tools: [...],
//       subagents: [
//         {
//           name: 'twitter-task',
//           description: 'Execute Twitter actions',
//           systemPrompt: subagentPrompt,
//           tools: [...],
//         },
//       ],
//     });
//     */

//     console.log('✅ DeepAgent created and ready to run!\n');
//     console.log(
//       `Persona: ${bible.name} will be embodied on ${deviceInfo.name}\n`
//     );

//     return {
//       bible,
//       deviceInfo,
//       prompts: {
//         main: mainPrompt,
//         subagent: subagentPrompt,
//       },
//     };
//   } catch (error) {
//     console.error('❌ Error during agent initialization:', error);
//     throw error;
//   }
// }

// // Run examples if this file is executed directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   (async () => {
//     const exampleToRun = process.argv[2] || 'all';

//     switch (exampleToRun) {
//       case '1':
//         await exampleInteractiveBibleSelection();
//         break;
//       case '2':
//         await exampleLoadAllBibles();
//         break;
//       case '3':
//         await exampleLoadBibleById();
//         break;
//       case '4':
//         await exampleBibleToPromptString();
//         break;
//       case '5':
//         await exampleCompleteWorkflow();
//         break;
//       case '6':
//         await exampleFullAgentInit();
//         break;
//       case 'all':
//         console.log('Running all examples...\n\n');
//         await exampleLoadAllBibles();
//         console.log('\n\n');
//         await exampleLoadBibleById();
//         console.log('\n\n');
//         await exampleBibleToPromptString();
//         console.log('\n\n');
//         await exampleCompleteWorkflow();
//         break;
//       default:
//         console.log('Usage: tsx bible-loader.example.ts [1-6|all]');
//     }
//   })();
// }
