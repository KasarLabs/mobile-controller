import dotenv from 'dotenv';
dotenv.config();

import { TikTokFypLikerWorkflow } from './tiktok-fyp-liker.js';
import { MobileControler } from '../../mobile/index.js';
import mcpsIngester from '../../ingesters/mcps/mcps.ingester.js';
import { selectDevices } from '../../utils/index.js';
import { number } from '@inquirer/prompts';

/**
 * Example usage of the TikTok FYP Liker workflow
 */
async function main() {
  console.log('\n🎬 TikTok FYP Liker Workflow\n');
  console.log('This workflow will:');
  console.log('  1. Connect to your Android device');
  console.log('  2. Open TikTok app');
  console.log('  3. Navigate to For You Page');
  console.log('  4. Like videos automatically');
  console.log('  5. Skip LIVE streams');
  console.log('  6. Return to home screen when done\n');

  // Initialize MCP tools
  console.log('📦 Initializing mobile tools...');
  await mcpsIngester.init();
  const tools = mcpsIngester.getTools();

  // Create mobile controller
  const mobileController = new MobileControler(tools);

  // Get available devices
  console.log('🔍 Scanning for devices...');
  const devices = await mobileController.getDevices();

  if (devices.length === 0) {
    console.error('❌ No devices found. Please connect a device and try again.');
    process.exit(1);
  }

  // Let user select device using TUI
  const selectedDevice =
    devices.length === 1 ? devices[0] : await selectDevices(devices);

  // Get screen size
  const screenSize = await mobileController.getDevicesScreenSize(
    selectedDevice.id
  );
  console.log(
    `📐 Screen size detected: ${screenSize.width}x${screenSize.height}`
  );

  // Ask user how many videos to like
  const likesCount = await number({
    message: 'How many videos would you like to like?',
    default: 10,
    min: 1,
    max: 100,
    validate: value => {
      if (!value || value < 1) return 'Please enter a number >= 1';
      if (value > 100) return 'Maximum 100 videos per session';
      return true;
    },
  });

  // Create workflow instance
  const workflow = new TikTokFypLikerWorkflow(mobileController, tools);

  // Configure workflow
  const config = {
    deviceId: selectedDevice.id,
    likesCount: likesCount!,
  };

  console.log('\n🚀 Starting workflow...');
  console.log(`📱 Device: ${selectedDevice.name} (${selectedDevice.id})`);
  console.log(`❤️  Videos to like: ${config.likesCount}\n`);

  try {
    const result = await workflow.run(config);

    console.log('\n📊 Workflow Result:');
    console.log('  - Success:', result.success);
    console.log('  - Error:', result.error?.message || 'none');
    console.log(
      '  - Agent Output:',
      typeof result.agentOutput === 'string'
        ? result.agentOutput.substring(0, 200)
        : JSON.stringify(result.agentOutput)?.substring(0, 200)
    );

    if (result.error) {
      console.error('\n❌ Workflow failed with error:', result.error.message);
      console.error('\n💡 Tip: Check that TikTok is installed and accessible');
    } else if (result.success) {
      console.log('\n✅ Workflow completed successfully!');
      console.log(`❤️  Liked ${config.likesCount} videos on TikTok FYP`);
    } else {
      console.log('\n⚠️  Workflow completed but task was not fully finished');
      console.log(
        '\n🔍 Debug - Full state:',
        JSON.stringify(result, null, 2)
      );
    }
  } catch (error) {
    console.error('\n💥 Failed to run workflow:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
