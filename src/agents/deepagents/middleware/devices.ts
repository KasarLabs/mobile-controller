import { createMiddleware } from 'langchain';
import { MobileControler } from '../../../mobile';
import { contextMobileSchema } from '../types/index.js';
import { PromptTemplate } from '@langchain/core/prompts';
import { ENVIRONMENT_PROMPT_INFO } from '../../../prompts/agents/deepagents.prompt.js';
import { AppMobileTrace } from './AppMobileTrace.js';

export const deviceCheckMiddleware = (mobileController: MobileControler) => {
  return createMiddleware({
    name: 'deviceCheckMiddleware',
    beforeModel: async state => {
      const devices = await waitForDevices(mobileController);
      if (devices.length === 0) {
        throw new Error('No devices available after 5 minutes timeout');
      }
      return state;
    },
  });
};

async function waitForDevices(
  mobileController: MobileControler
): Promise<any[]> {
  const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  const CHECK_INTERVAL_MS = 10 * 1000; // 10 seconds

  // Create a timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Timeout: No devices found after 5 minutes'));
    }, TIMEOUT_MS);
  });

  // Create a polling promise
  const pollingPromise = new Promise<any[]>(async (resolve, reject) => {
    console.log('🔍 Waiting for devices to become available...');

    while (true) {
      try {
        const devices = await mobileController.getDevices();

        if (devices.length > 0) {
          console.log(`✅ Found ${devices.length} device(s)`);
          resolve(devices);
          return;
        }

        console.log('⏳ No devices found, checking again in 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL_MS));
      } catch (error) {
        console.error('❌ Error checking for devices:', error);
        reject(error);
        return;
      }
    }
  });

  // Race between timeout and polling
  try {
    return await Promise.race([pollingPromise, timeoutPromise]);
  } catch (error) {
    console.error('Failed to find devices:', error);
    return [];
  }
}

/**
 * Middleware to enhance system prompt with device context
 * Uses AppMobileTrace class instance to dynamically update and format device/app information
 */
export function devicePromptMiddleware(): ReturnType<typeof createMiddleware> {
  return createMiddleware({
    name: 'devicePromptMiddleware',
    contextSchema: contextMobileSchema,
    wrapModelCall: async (request, handler) => {
      // Access context from runtime
      const { deviceInfo, bibleData, appMobileTrace } = request.runtime.context;

      if (!deviceInfo || !bibleData) {
        console.warn('⚠️ Missing context data in devicePromptMiddleware');
        return handler(request);
      }

      // Check if appMobileTrace exists and update its state
      if (appMobileTrace && appMobileTrace instanceof AppMobileTrace) {
        await appMobileTrace.updateState();
      }

      // Create prompt template
      const prompt = new PromptTemplate({
        template: ENVIRONMENT_PROMPT_INFO,
        inputVariables: [
          'id',
          'name',
          'platform',
          'type',
          'version',
          'state',
          'screenWidth',
          'screenHeight',
          'authorizedApps',
          'bible',
          'currentWindow',
          'appTimeline',
        ],
      });

      // Format the prompt with context values
      console.log('📋 Formatting prompt with appMobileTrace');

      const currentWindow = appMobileTrace?.getCurrentScreenWindow() || 'No screen data available';
      const formattedTimeline = appMobileTrace?.getFormattedAppTimeline() || 'No app usage data available yet.';

      const formattedPrompt = await prompt.format({
        id: deviceInfo.id,
        name: deviceInfo.name,
        platform: deviceInfo.platform,
        type: deviceInfo.type,
        version: deviceInfo.version,
        state: deviceInfo.state,
        screenWidth: deviceInfo.screenWidth?.toString() || 'unknown',
        screenHeight: deviceInfo.screenHeight?.toString() || 'unknown',
        authorizedApps: 'X, Twitter', // TODO: Make this configurable
        bible: bibleData,
        currentWindow: currentWindow,
        appTimeline: formattedTimeline,
      });

      console.log('✅ Formatted prompt length:', formattedPrompt.length);
      console.log('📝 Original systemMessage type:', typeof request.systemMessage);

      const newSystemMessage = request.systemMessage.concat(formattedPrompt);
      return handler({
        ...request,
        systemMessage: newSystemMessage,
      });
    },
  });
}
