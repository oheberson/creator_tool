/**
 * Read a plain text stream from a fetch Response (Vercel AI SDK `toTextStreamResponse()`).
 */
export async function readTextStream(
  body: ReadableStream<Uint8Array> | null,
  onDelta?: (accumulated: string) => void
): Promise<string> {
  if (!body) return "";
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let result = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
      onDelta?.(result);
    }
    result += decoder.decode();
    onDelta?.(result);
  } finally {
    reader.releaseLock();
  }
  return result;
}
