/**
 * Workflows Example - MainGraph Usage
 *
 * This file demonstrates how to use the MainGraph orchestration system
 * to execute automated workflows across multiple mobile apps.
 *
 * Usage:
 * 1. Configure apps in config.ts (selectedApps, appConfigs)
 * 2. Create subgraph classes for each app in workflows/apps/
 * 3. Run this example to see the orchestration in action
 *
 * To run:
 * ```bash
 * npm run build
 * node dist/workflows/index.js
 * ```
 */

import 'dotenv/config';
import { MainGraph } from './main-graph.js';
import { selectedApps, bible } from './config.js';

/**
 * Main execution function
 * Demonstrates the complete workflow execution
 */
async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   Mobile App Automation Workflow System           ║');
    console.log('║   Powered by LangGraph                             ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    // Step 1: Create the MainGraph instance
    console.log('Step 1: Creating MainGraph...');
    const mainGraph = new MainGraph(selectedApps, bible);
    console.log(`  → Selected apps: ${selectedApps.join(', ')}`);
    console.log(`  → Bible persona: ${bible.name}\n`);

    // Step 2: Compile the graph
    console.log('Step 2: Compiling workflow graph...');
    const compiledGraph = await mainGraph.compile();
    console.log('  → Graph compiled successfully\n');

    // Step 3: Execute the workflow
    console.log('Step 3: Executing workflow...');
    const initialState = {
      apps: selectedApps,
      bible: bible,
    };

    const result = await compiledGraph.invoke(initialState);

    // Step 4: Display results
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║   Workflow Execution Complete                      ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log('Final State:');
    console.log('─────────────────────────────────────────────────────');
    console.log('Apps processed:', result.apps);
    console.log('Current app:', result.currentApp);
    console.log('\nResults:');
    for (const [appName, appResult] of Object.entries(result.results)) {
      console.log(`  ${appName}:`, JSON.stringify(appResult, null, 2));
    }
    console.log('\nMessages:');
    result.messages.forEach((msg: string, idx: number) => {
      console.log(`  ${idx + 1}. ${msg}`);
    });

    console.log('\n✓ Workflow execution completed successfully!');
  } catch (error) {
    console.error('\n✗ Workflow execution failed:');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Advanced Example: Custom Configuration
 *
 * This shows how to use MainGraph with custom configuration
 * instead of the default config.ts settings
 */
async function advancedExample() {
  // Custom app selection
  const customApps = ['tiktok']; // Only run TikTok workflow

  // Custom bible configuration
  const customBible = {
    name: 'Custom Automation Agent',
    bio: 'A specialized agent for TikTok automation',
  };

  // Create and run MainGraph with custom config
  const mainGraph = new MainGraph(customApps, customBible);
  const compiledGraph = await mainGraph.compile();

  const result = await compiledGraph.invoke({
    apps: customApps,
    bible: customBible,
  });

  console.log('Custom workflow result:', result);
}

/**
 * Extension Example: Adding a New App
 *
 * To add a new app (e.g., Instagram):
 *
 * 1. Add to config.ts:
 *    export const selectedApps = ['tiktok', 'twitter', 'instagram'];
 *    export const appConfigs = {
 *      ...
 *      instagram: {
 *        name: 'Instagram',
 *        packageName: 'com.instagram.android',
 *      },
 *    };
 *
 * 2. Create workflows/apps/instagram-subgraph.ts:
 *    import { SubgraphFactory } from '../subgraph-factory.js';
 *    export default class InstagramSubgraph extends SubgraphFactory {
 *      createSubgraph() { ... }
 *      addWorkflows(graph) { ... }
 *    }
 *
 * 3. Run the workflow - MainGraph will automatically include it!
 */

// Run the main example
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export for use in other modules
export { main, advancedExample };
