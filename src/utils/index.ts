import { select, input, confirm } from '@inquirer/prompts';
import { DeviceInfo } from '../mobile';

// Export prompt formatting utilities
export {
  formatPromptWithDevice,
  formatMultiplePrompts,
  formatPromptWithDeviceSync,
  type DeviceEnvironment,
} from './prompt-formatter.js';

// Export Bible loading and selection utilities
export {
  loadAllBibles,
  selectBible,
  bibleToPromptString,
} from './bible-loader.js';

export async function selectDevices(
  devices: DeviceInfo[]
): Promise<DeviceInfo> {
  if (devices.length === 0) {
    throw new Error('No devices available to select from');
  }

  // Display all devices info to the user
  console.log('\n📱 Available Devices:\n');
  devices.forEach((device, index) => {
    console.log(`${index + 1}. Device Information:`);
    console.log(`   ID:       ${device.id}`);
    console.log(`   Name:     ${device.name}`);
    console.log(`   Platform: ${device.platform}`);
    console.log(`   Type:     ${device.type}`);
    console.log(`   Version:  ${device.version}`);
    console.log(`   State:    ${device.state}`);
    console.log('');
  });

  // Create choices for the selection prompt
  const choices = devices.map(device => ({
    name: `${device.name} (${device.platform} ${device.version}) - ${device.state}`,
    value: device.id,
    description: `ID: ${device.id} | Type: ${device.type}`,
  }));

  // Let user select a device using arrow keys
  const selectedDeviceId = await select({
    message: 'Select a device to connect:',
    choices: choices,
  });

  // Find and return the selected device
  const selectedDevice = devices.find(device => device.id === selectedDeviceId);

  if (!selectedDevice) {
    throw new Error('Selected device not found');
  }

  console.log(`\n✅ Selected device: ${selectedDevice.name} (${selectedDevice.id})\n`);

  return selectedDevice;
}

export async function getUserQuery(): Promise<string> {
  console.log('\n💬 Enter your query:\n');

  // First, ask if user wants to stop or continue
  const shouldStop = await confirm({
    message: 'Do you want to stop?',
    default: false,
  });

  if (shouldStop) {
    console.log('\n🛑 Stop command received\n');
    return '-1';
  }

  const query = await input({
    message: 'What would you like to do with the device?',
    validate: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Please enter a valid query';
      }
      if (value.trim().length < 3) {
        return 'Query must be at least 3 characters long';
      }
      return true;
    },
  });

  console.log(`\n📝 Query received: "${query}"\n`);

  return query.trim();
}