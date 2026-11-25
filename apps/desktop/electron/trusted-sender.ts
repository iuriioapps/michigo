/**
 * Returns a check that accepts only events from the app's own page at
 * `rendererUrl`, so a frame of any other page cannot reach main.
 */
export function trustedSender(
  rendererUrl: string,
): (event: { readonly senderFrame?: { readonly url: string } | null }) => boolean {
  // Normalized, so a dev server URL without a trailing slash still matches.
  const trustedUrl = new URL(rendererUrl).href;

  return (event) => {
    const url = URL.parse(event.senderFrame?.url ?? "");

    if (url === null) {
      return false;
    }
    // Hash routing changes only the fragment; the page itself must match.
    url.hash = "";

    return url.href === trustedUrl;
  };
}
