/**
 * Bible Type Definitions
 *
 * A "Bible" contains a simplified persona definition for a DeepAgent,
 * defining how the agent should behave and what topics to focus on.
 */

export interface Bible {
  /** Display name for this persona */
  name: string;

  /** Brief bio or description */
  bio: string;

  /** Communication style (e.g., "casual, lowercase, tech-focused") */
  style: string;

  /** Topics and interests */
  interests: string[];

  /** Topics to avoid */
  avoid: string[];

  /** Favorite emojis to use */
  emojis?: string[];
}
