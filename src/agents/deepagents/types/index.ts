import { z } from 'zod';
import { Annotation } from '@langchain/langgraph';
import { DeviceInfo } from '../../../mobile';
import { AppMobileTrace } from '../middleware/AppMobileTrace.js';

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
  appMobileTrace: z.instanceof(AppMobileTrace).optional(),
  currentScreenWindow: z.string().optional(),
  authorizedApps: z
    .array(
      z.object({
        name: z.string(),
        identifier: z.string(),
      })
    )
    .optional(),
  appTimeline: z
    .array(
      z.object({
        name: z.string(),
        last_used: z.date().optional(),
        current_session_start: z.date().optional(),
      })
    )
    .optional(),
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
  appMobileTrace: Annotation<AppMobileTrace>({
    reducer: (prev, next) => next ?? prev,
  }),
  currentScreenWindow: Annotation<string>({
    reducer: (prev, next) => next ?? prev,
  }),
  authorizedApps: Annotation<{ name: string; identifier: string }[]>({
    reducer: (prev, next) => next ?? prev,
  }),
  appTimeline: Annotation<
    { name: string; last_used?: Date; current_session_start?: Date }[]
  >({
    reducer: (prev, next) => next ?? prev,
  }),
});
