/**
 * Topic Clarifier — production flow uses:
 * - POST /api/agents/topic-clarifier/chat (streaming dialogue)
 * - POST /api/agents/topic-clarifier/finalize (structured NicheDefinition)
 *
 * For LangGraph tests and offline graphs, use `runTopicClarifierStub` from `./topic-clarifier.stub`.
 */
export { runTopicClarifierStub } from "./topic-clarifier.stub";
export {
  TOPIC_CLARIFIER_CHAT_SYSTEM,
  TOPIC_CLARIFIER_FINALIZE_SYSTEM,
} from "./topic-clarifier-prompts";
