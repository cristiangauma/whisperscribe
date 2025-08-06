/**
 * Formatting utilities for tags and data conversion
 */

/**
 * Format tags for use in Obsidian, converting to lowercase and replacing spaces/special chars
 * Preserves Unicode characters including accented letters (á, é, í, ó, ú, ñ, etc.)
 * 
 * @param tags - Array of raw tag strings
 * @returns Array of formatted Obsidian-compatible tags
 */
export function formatTagsAsObsidianTags(tags: string[]): string[] {
	return tags.map(tag => {
		// Convert to lowercase and replace spaces/problematic punctuation with hyphens
		return tag.toLowerCase()
			// Remove problematic punctuation but preserve Unicode letters, numbers, and allowed symbols
			.replace(/[.&@$%^*+=<>?!|\\"`';{}[\]()~]/g, '') // Remove specific problematic punctuation
			.replace(/\s+/g, '-') // Replace spaces with hyphens
			.replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
			.replace(/^-|-$/g, '') // Remove leading/trailing hyphens
			.trim();
	}).filter(tag => tag.length > 0); // Remove empty tags
}

/**
 * Convert ArrayBuffer to base64 string
 * 
 * @param buffer - ArrayBuffer to convert
 * @returns Base64 encoded string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
	let binary = '';
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Get MIME type for a given file extension
 * 
 * @param extension - File extension (without dot)
 * @returns MIME type string
 */
export function getMimeType(extension: string): string {
	const mimeTypes: Record<string, string> = {
		'mp3': 'audio/mpeg',
		'wav': 'audio/wav',
		'ogg': 'audio/ogg',
		'm4a': 'audio/mp4'
	};
	return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}