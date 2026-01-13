import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Execute an ADB command on the specified device
 */
export async function adbCommand(
  deviceId: string,
  command: string
): Promise<string> {
  const fullCommand = `adb -s ${deviceId} shell ${command}`;
  console.log(`[ADB] Executing: ${fullCommand}`);
  const { stdout, stderr } = await execAsync(fullCommand);
  if (stderr && !stderr.includes('Warning')) {
    console.warn(`[ADB] Warning: ${stderr}`);
  }
  return stdout.trim();
}

/**
 * Execute a local shell command
 */
export async function shellCommand(command: string): Promise<string> {
  console.log(`[SHELL] Executing: ${command}`);
  const { stdout } = await execAsync(command);
  return stdout.trim();
}

/**
 * Read device ID from agent's credentials file
 */
export async function readDeviceId(agentName: string): Promise<string> {
  const envPath = path.join(process.cwd(), '.env.phone');

  let content: string;
  content = await fs.readFile(envPath, 'utf-8');

  const match = content.match(/^DEVICE_ID=(.+)$/m);
  if (!match) {
    throw new Error(`Could not find DEVICE_ID in ${envPath}`);
  }
  return match[1].trim();
}

/**
 * Get screen size from device
 */
export async function getScreenSize(
  deviceId: string
): Promise<{ width: number; height: number }> {
  const output = await adbCommand(deviceId, 'wm size');
  const match = output.match(/(\d+)x(\d+)/);
  if (!match) {
    throw new Error(`Could not parse screen dimensions from: ${output}`);
  }
  return {
    width: parseInt(match[1]),
    height: parseInt(match[2]),
  };
}

/**
 * Calculate safe tap zone (central 40-60% of screen)
 */
export function calculateTapZone(
  screenWidth: number,
  screenHeight: number
): {
  tapMinX: number;
  tapMaxX: number;
  tapMinY: number;
  tapMaxY: number;
} {
  return {
    tapMinX: Math.floor(screenWidth * 0.4),
    tapMaxX: Math.floor(screenWidth * 0.6),
    tapMinY: Math.floor(screenHeight * 0.4),
    tapMaxY: Math.floor(screenHeight * 0.6),
  };
}

/**
 * Generate random coordinates within tap zone
 */
export function getRandomTapCoords(
  tapMinX: number,
  tapMaxX: number,
  tapMinY: number,
  tapMaxY: number
): { x: number; y: number } {
  return {
    x: Math.floor(Math.random() * (tapMaxX - tapMinX + 1)) + tapMinX,
    y: Math.floor(Math.random() * (tapMaxY - tapMinY + 1)) + tapMinY,
  };
}

/**
 * Kill TikTok app
 */
export async function killTikTok(deviceId: string): Promise<void> {
  await adbCommand(deviceId, 'am force-stop com.zhiliaoapp.musically');
  console.log('[TikTok] App killed');
}

/**
 * Open TikTok app
 */
export async function openTikTok(deviceId: string): Promise<void> {
  await adbCommand(
    deviceId,
    'monkey -p com.zhiliaoapp.musically -c android.intent.category.LAUNCHER 1'
  );
  console.log('[TikTok] App opened');
}

/**
 * Double tap to like a video
 */
export async function doubleTapToLike(
  deviceId: string,
  x: number,
  y: number
): Promise<void> {
  await adbCommand(deviceId, `input tap ${x} ${y}`);
  await sleep(100);
  await adbCommand(deviceId, `input tap ${x} ${y}`);
  console.log(`[TikTok] Double tapped at ${x},${y}`);
}

/**
 * Swipe up to next video
 */
export async function swipeUp(
  deviceId: string,
  screenWidth: number,
  screenHeight: number
): Promise<void> {
  const startX = Math.floor(screenWidth / 2);
  const startY = Math.floor(screenHeight * 0.75);
  const endY = Math.floor(screenHeight * 0.25);
  await adbCommand(
    deviceId,
    `input swipe ${startX} ${startY} ${startX} ${endY} 300`
  );
  console.log('[TikTok] Swiped up');
}

/**
 * Press home button
 */
export async function pressHome(deviceId: string): Promise<void> {
  await adbCommand(deviceId, 'input keyevent KEYCODE_HOME');
  console.log('[TikTok] Pressed home');
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get UI elements using UI Automator dump
 */
export async function listUIElements(deviceId: string): Promise<string> {
  try {
    await adbCommand(deviceId, 'uiautomator dump /sdcard/ui_dump.xml');
    const xmlContent = await adbCommand(deviceId, 'cat /sdcard/ui_dump.xml');
    return xmlContent;
  } catch (error) {
    return 'Error: Could not retrieve UI elements';
  }
}
