/**
 * Streams a chat response from the Euler backend.
 *
 * @param {Array<{role: string, content: string}>} messages  - Conversation history
 * @param {(token: string) => void} onToken                  - Called for each streamed token
 * @param {(fullText: string) => void} onComplete             - Called when stream finishes
 * @param {(error: string) => void} onError                   - Called on error
 * @returns {() => void} abort function to cancel the stream
 */
export function streamChat(messages, { onToken, onComplete, onError }) {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        onError?.(`Server error: ${res.status} — ${errText}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            onComplete?.(fullText);
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              onError?.(parsed.error);
              return;
            }
            if (parsed.content) {
              fullText += parsed.content;
              onToken?.(parsed.content);
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }

      // Stream ended without [DONE] — still call onComplete
      onComplete?.(fullText);
    } catch (err) {
      if (err.name !== 'AbortError') {
        onError?.(err.message || 'Network error');
      }
    }
  })();

  return () => controller.abort();
}
