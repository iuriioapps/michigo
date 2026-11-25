/**
 * An error that Michigo raises itself. Its message is a code such as
 * `anki.closed`, never a sentence: the app's catalog holds the text, and the
 * log may record the code because it cannot hold the learner's content.
 */
export class MichigoError extends Error {
  override readonly name = "MichigoError";

  // oxlint-disable-next-line no-useless-constructor -- it narrows the message to a code.
  constructor(code: `${string}.${string}`, options?: ErrorOptions) {
    super(code, options);
  }
}
