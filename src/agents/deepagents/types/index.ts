import { z } from 'zod';
import { Annotation } from '@langchain/langgraph';
import { DeviceInfo } from '../../../mobile';

/**
 * Zod schema for DeviceInfo
 */
export const DeviceInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  platform: z.string(),
  type: z.string(),
  version: z.string(),
  state: z.string(),
  screenWidth: z.number().optional(),
  screenHeight: z.number().optional(),
});

export const contextMobileSchema = z.object({
  deviceInfo: DeviceInfoSchema,
  bibleData: z.string(),
  currentScreenWindow: z.string().optional(),
});

export type DeviceContextType = z.infer<typeof DeviceInfoSchema>;
/**
 * Mobile Context Annotation Schema
 * This defines the context that will be available during agent execution
 */
export const MobileContextAnnotation = Annotation.Root({
  deviceInfo: Annotation<DeviceInfo>({
    reducer: (prev, next) => next ?? prev,
  }),
  bibleData: Annotation<string>({
    reducer: (prev, next) => next ?? prev,
  }),
  currentScreenWindow: Annotation<string>({
    reducer: (prev, next) => next ?? prev,
  }),
});