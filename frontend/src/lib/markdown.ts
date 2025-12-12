/**
 * Parse inline markdown and convert to HTML
 * Supports: **bold**, *italic*, `code`, ~~strikethrough~~
 */

// Escape HTML special characters to prevent XSS
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Parse inline markdown to HTML
export function parseInlineMarkdown(text: string): string {
    if (!text) return '';

    let result = escapeHtml(text);

    // Bold: **text** or __text__
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_ (but not inside **)
    result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    result = result.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');

    // Inline code: `code`
    result = result.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Strikethrough: ~~text~~
    result = result.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Links: [text](url)
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-link">$1</a>');

    return result;
}

// Convert HTML back to markdown (for editing)
export function htmlToMarkdown(html: string): string {
    if (!html) return '';

    let result = html;

    // Remove any HTML tags and extract text
    const tempDiv = typeof document !== 'undefined' ? document.createElement('div') : null;
    if (tempDiv) {
        tempDiv.innerHTML = html;
        result = tempDiv.textContent || tempDiv.innerText || '';
    }

    return result;
}

// Check if text contains markdown syntax
export function hasMarkdownSyntax(text: string): boolean {
    if (!text) return false;

    const patterns = [
        /\*\*.+?\*\*/,       // Bold
        /\*.+?\*/,           // Italic
        /`.+?`/,             // Code
        /~~.+?~~/,           // Strikethrough
        /\[.+?\]\(.+?\)/,    // Links
    ];

    return patterns.some(pattern => pattern.test(text));
}
