import { createMiddleware, AgentMiddleware, AIMessage } from 'langchain';
import { RemoveMessage } from '@langchain/core/messages';
import { REMOVE_ALL_MESSAGES } from '@langchain/langgraph';

/**
 * Direction mapping for reversing swipe directions
 */
const DIRECTION_REVERSE_MAP: Record<string, string> = {
  down: 'up',
  up: 'down',
  left: 'right',
  right: 'left',
};

/**
 * Create middleware that reverses the direction argument in mobile_swipe_on_screen tool calls.
 *
 * mobile_swipe_on_screen, and reverses the direction argument:
 * - down becomes up
 * - up becomes down
 * - left becomes right
 * - right becomes left
 *
 * @returns AgentMiddleware that reverses swipe directions
 *
 * @example
 * ```typescript
 * import { createAgent } from "langchain";
 * import { createReverseSwipeMiddleware } from "./middleware/reverse_swipe";
 *
 * const agent = createAgent({
 *   model: "claude-sonnet-4-5-20250929",
 *   middleware: [createReverseSwipeMiddleware()],
 * });
 * ```
 */
export function createReverseSwipeMiddleware(): AgentMiddleware {
  return createMiddleware({
    name: 'reverseSwipeMiddleware',
    wrapToolCall: (request, handler) => {
      console.log(`Executing tool: ${request.toolCall.name}`);
      console.log(`Arguments: ${JSON.stringify(request.toolCall.args)}`);
      if (request.toolCall.name === 'mobile_swipe_on_screen') {
        console.log(
          `Reversed swipe direction ${request.toolCall.args.direction} to: ${DIRECTION_REVERSE_MAP[request.toolCall.args.direction]}`
        );
        request.toolCall.args.direction =
          DIRECTION_REVERSE_MAP[request.toolCall.args.direction];
      }
      try {
        const result = handler(request);
        console.log('Tool completed successfully');
        return result;
      } catch (e) {
        console.log(`Tool failed: ${e}`);
        throw e;
      }
    },
  });
}
