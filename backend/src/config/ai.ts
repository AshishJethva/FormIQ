/**
 * Groq model configuration.
 * Groq retires models periodically (e.g. llama-3.3-70b-versatile), so the
 * names live here and can be overridden via env without a code change.
 */
export const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
export const GROQ_FAST_MODEL = process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b';

/** gpt-oss models spend completion tokens on reasoning; keep it low for JSON tasks. */
export const GROQ_REASONING_EFFORT = 'low' as const;
