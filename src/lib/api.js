/**
 * Streams a chat response from the Euler backend.
 *
 * @param {Array<{role: string, content: string}>} messages  - Conversation history
 * @param {(token: string) => void} onToken                  - Called for each streamed token
 * @param {(fullText: string) => void} onComplete             - Called when stream finishes
 * @param {(error: string) => void} onError                   - Called on error
 * @returns {() => void} abort function to cancel the stream
 */
export function streamChat(messages, { onToken, onComplete, onError, accessToken, chatId }) {
  console.log('[CHAT] Generation started');
  const controller = new AbortController();

  (async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages, chatId }),
        signal: controller.signal,
      });

      if (!res.ok) {
        // Log raw error server-side details client-side (dev only)
        const errText = await res.text().catch(() => '');
        console.error('[api] Chat request failed:', res.status, errText.slice(0, 200));
        onError?.('Something went wrong. Please try again.');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let metadata = null;

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
            onComplete?.(fullText, metadata);
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              onError?.(parsed.error);
              return;
            }
            if (parsed.chatId && parsed.title) {
              metadata = { chatId: parsed.chatId, title: parsed.title };
              continue;
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
      onComplete?.(fullText, metadata);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[CHAT] Stream aborted');
        console.log('[CHAT] Generation cancelled successfully');
      } else {
        console.error('[api] Stream error:', err);
        onError?.('Something went wrong. Please try again.');
      }
    }
  })();

  return () => controller.abort();
}
