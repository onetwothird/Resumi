import sanitizeHtml from "sanitize-html";

/**
 * Allowlist for resume rich text.
 *
 * Every value produced by the editor's document.execCommand toolbar
 * (bold/italic/underline/strike-through) plus the text nodes the user types
 * survive this unchanged. Anything else is dropped:
 *
 *   - <script>, <style>, <iframe>, <object>, <embed>  -> removed with content
 *   - <img>, <video>, <svg>, <form>                  -> removed
 *   - <a href="javascript:...">                      -> unwrapped to plain text
 *   - event handlers (onerror=, onload=, ...)         -> stripped
 *   - inline styles outside the colour/size allowlist -> stripped
 *
 * `disallowedTagsMode: "discard"` keeps the inner text of unwrapped tags
 * (so a link renders as its label) while nonTextTags drops the contents of
 * script-like elements entirely.
 */
const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "b", "strong",
    "i", "em",
    "u",
    "s", "strike", "del",
    "br",
    "p", "div", "span",
    "ul", "ol", "li",
  ],
  allowedAttributes: {
    "*": ["style"],
  },
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-fA-F]{3,8}$/],
      "background-color": [/^#[0-9a-fA-F]{3,8}$/],
      "text-align": [/^(left|right|center|justify)$/],
      "font-size": [/^\d{1,3}(\.\d{1,2})?(px|pt|em|%)$/],
      "text-decoration": [/^(underline|line-through)$/],
      "font-weight": [/^(normal|bold|[1-9]00)$/],
      "font-style": [/^(normal|italic)$/],
    },
  },
  disallowedTagsMode: "discard",
  // Keep <script>/<style>/<noscript>/<textarea> contents from being re-emitted.
  nonTextTags: ["style", "script", "textarea", "option", "noscript", "title"],
};

/**
 * Sanitize a single rich-text field destined for the database.
 *
 * Every field that eventually reaches `dangerouslySetInnerHTML` in
 * components/features/resume/templates/renderer.tsx MUST pass through here
 * on the way in. React escaping does not apply to that sink, so sanitizing
 * at the write boundary is the only thing standing between a stored
 * `<img onerror=...>` and execution in the resume editor.
 *
 * @param maxLength hard cap applied before parsing, so an oversized payload
 *                  cannot be used to burn CPU in the sanitizer.
 * @returns the cleaned HTML, or null when there is nothing to store.
 */
export function sanitizeRichText(
  value: unknown,
  maxLength = 20_000
): string | null {
  if (typeof value !== "string") return null;

  const clipped = value.slice(0, maxLength);
  if (!clipped.trim()) return null;

  const cleaned = sanitizeHtml(clipped, RICH_TEXT_OPTIONS).trim();
  return cleaned.length > 0 ? cleaned : null;
}
