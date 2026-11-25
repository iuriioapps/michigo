/**
 * The `at …` lines of a V8 stack. The stack opens with `name: message`, and
 * the message can span several lines, one of which can look like a frame.
 * Pure, because the renderer entry uses it too.
 */
export function stackFrames(error: Error): string[] {
  const header = Math.max(1, error.message.split("\n").length);

  return (error.stack ?? "")
    .split("\n")
    .slice(header)
    .filter((line) => /^\s+at /.test(line));
}
