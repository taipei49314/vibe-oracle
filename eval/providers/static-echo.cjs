/**
 * Minimal promptfoo provider: returns the prompt text as "output"
 * so we can assert on system prompt file contents without an LLM.
 */
module.exports = class StaticEchoProvider {
  id() {
    return "static-echo";
  }

  async callApi(prompt) {
    return { output: String(prompt ?? "") };
  }
};
