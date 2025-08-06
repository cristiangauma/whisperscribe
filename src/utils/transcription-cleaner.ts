/**
 * Transcription cleaning utilities to handle AI hallucinations and repetitive patterns
 */

/**
 * Detects and cleans repetitive patterns in transcription text using dynamic n-gram analysis
 * 
 * @param text - The transcription text to clean
 * @param maxRepetitions - Maximum allowed repetitions before considering it hallucination (default: 3)
 * @returns Cleaned transcription text
 */
export function cleanRepetitiveText(text: string, maxRepetitions: number = 3): string {
	if (!text || text.trim().length === 0) {
		return text;
	}

	// Split into words and clean up
	const words = text.trim().split(/\s+/);
	const cleanedWords: string[] = [];
	
	// Use dynamic n-gram analysis to detect ANY repetitive pattern
	let i = 0;
	while (i < words.length) {
		let bestMatch = findLongestRepetitivePattern(words, i, maxRepetitions);
		
		if (bestMatch.patternLength > 0 && bestMatch.repetitions > maxRepetitions) {
			// Found a repetitive pattern that exceeds the threshold
			const pattern = words.slice(i, i + bestMatch.patternLength);
			
			// Add the pattern only maxRepetitions times
			for (let rep = 0; rep < maxRepetitions; rep++) {
				cleanedWords.push(...pattern);
			}
			
			// Add marker for truncated content
			cleanedWords.push('[repetitive pattern truncated]');
			
			// Skip all the repetitions
			i += bestMatch.patternLength * bestMatch.repetitions;
		} else {
			// No excessive repetition found, add the word normally
			cleanedWords.push(words[i]);
			i++;
		}
	}
	
	return cleanedWords.join(' ');
}

/**
 * Finds the longest repetitive pattern starting at a given position using dynamic n-gram analysis
 * 
 * @param words - Array of words
 * @param startIndex - Starting position to check
 * @param maxRepetitions - Maximum allowed repetitions
 * @returns Object with pattern length and number of repetitions
 */
function findLongestRepetitivePattern(words: string[], startIndex: number, maxRepetitions: number): {
	patternLength: number;
	repetitions: number;
} {
	let bestPattern = { patternLength: 0, repetitions: 0 };
	
	// Check for patterns of different lengths (1 to 10 words)
	for (let patternLen = 1; patternLen <= Math.min(10, words.length - startIndex); patternLen++) {
		const pattern = words.slice(startIndex, startIndex + patternLen);
		const patternStr = pattern.map(w => w.toLowerCase()).join(' ');
		
		// Count how many times this pattern repeats consecutively
		let repetitions = 1;
		let pos = startIndex + patternLen;
		
		while (pos + patternLen <= words.length) {
			const nextPattern = words.slice(pos, pos + patternLen);
			const nextPatternStr = nextPattern.map(w => w.toLowerCase()).join(' ');
			
			if (nextPatternStr === patternStr) {
				repetitions++;
				pos += patternLen;
			} else {
				break;
			}
		}
		
		// If this pattern has more repetitions than our current best, update
		if (repetitions > bestPattern.repetitions || 
		   (repetitions === bestPattern.repetitions && patternLen > bestPattern.patternLength)) {
			bestPattern = { patternLength: patternLen, repetitions };
		}
	}
	
	return bestPattern;
}

/**
 * Cleans repetitive phrases in text
 * 
 * @param text - The text to clean
 * @param maxRepetitions - Maximum allowed phrase repetitions
 * @returns Cleaned text
 */
function cleanPhrasalRepetitions(text: string, maxRepetitions: number): string {
	// Look for patterns of 2-5 word phrases that repeat
	for (let phraseLength = 2; phraseLength <= 5; phraseLength++) {
		text = cleanRepeatedPhrases(text, phraseLength, maxRepetitions);
	}
	return text;
}

/**
 * Cleans repeated phrases of a specific length
 * 
 * @param text - The text to clean
 * @param phraseLength - Length of phrases to look for
 * @param maxRepetitions - Maximum allowed repetitions
 * @returns Cleaned text
 */
function cleanRepeatedPhrases(text: string, phraseLength: number, maxRepetitions: number): string {
	const words = text.split(/\s+/);
	const cleanedWords: string[] = [];
	
	let i = 0;
	while (i < words.length) {
		if (i + phraseLength > words.length) {
			// Not enough words left for a full phrase
			cleanedWords.push(...words.slice(i));
			break;
		}
		
		const currentPhrase = words.slice(i, i + phraseLength);
		const currentPhraseStr = currentPhrase.join(' ').toLowerCase();
		
		// Count how many times this phrase repeats
		let repetitionCount = 1;
		let j = i + phraseLength;
		
		while (j + phraseLength <= words.length) {
			const nextPhrase = words.slice(j, j + phraseLength);
			const nextPhraseStr = nextPhrase.join(' ').toLowerCase();
			
			if (nextPhraseStr === currentPhraseStr) {
				repetitionCount++;
				j += phraseLength;
			} else {
				break;
			}
		}
		
		if (repetitionCount > maxRepetitions) {
			// Add the phrase only maxRepetitions times
			for (let k = 0; k < maxRepetitions; k++) {
				cleanedWords.push(...currentPhrase);
			}
			cleanedWords.push('[repetitive phrase truncated]');
			i = j; // Skip all repetitions
		} else {
			// Add just the first instance of the phrase
			cleanedWords.push(...currentPhrase);
			i += phraseLength;
		}
	}
	
	return cleanedWords.join(' ');
}

/**
 * Detects if text contains excessive repetitive patterns using advanced n-gram analysis
 * 
 * @param text - The text to analyze
 * @param threshold - Ratio threshold (0-1) of repetitive content to consider problematic
 * @returns True if text appears to contain hallucinated repetitive content
 */
export function detectHallucination(text: string, threshold: number = 0.3): boolean {
	if (!text || text.trim().length === 0) {
		return false;
	}
	
	const words = text.trim().split(/\s+/);
	if (words.length < 10) {
		return false; // Too short to analyze
	}
	
	// Method 1: Check unique word ratio
	const uniqueWords = new Set(words.map(w => w.toLowerCase()));
	const uniqueRatio = uniqueWords.size / words.length;
	
	if (uniqueRatio < threshold) {
		return true;
	}
	
	// Method 2: Dynamic pattern detection using sliding window
	const repetitiveScore = calculateRepetitiveScore(words);
	if (repetitiveScore > 0.5) { // If more than 50% of text is repetitive patterns
		return true;
	}
	
	// Method 3: Check for excessive consecutive repetitions of any pattern
	const maxPatternRepetitions = findMaxConsecutivePatternRepetitions(words);
	if (maxPatternRepetitions > 8) { // If any pattern repeats more than 8 times consecutively
		return true;
	}
	
	return false;
}

/**
 * Calculates a repetitive score based on how much of the text consists of repeated patterns
 * 
 * @param words - Array of words to analyze
 * @returns Score between 0 and 1, where higher values indicate more repetition
 */
function calculateRepetitiveScore(words: string[]): number {
	let totalWords = words.length;
	let repetitiveWords = 0;
	
	// Use sliding window to detect patterns of various lengths
	let i = 0;
	while (i < words.length) {
		const pattern = findLongestRepetitivePattern(words, i, 2); // Allow minimum 2 repetitions
		
		if (pattern.repetitions > 2) {
			// Count all words in the repetitive pattern as repetitive
			repetitiveWords += pattern.patternLength * pattern.repetitions;
			i += pattern.patternLength * pattern.repetitions;
		} else {
			i++;
		}
	}
	
	return repetitiveWords / totalWords;
}

/**
 * Finds the maximum number of consecutive repetitions for any pattern in the text
 * 
 * @param words - Array of words to analyze
 * @returns Maximum number of consecutive pattern repetitions found
 */
function findMaxConsecutivePatternRepetitions(words: string[]): number {
	let maxRepetitions = 0;
	
	// Check patterns of different lengths
	for (let i = 0; i < words.length; i++) {
		for (let patternLen = 1; patternLen <= Math.min(5, words.length - i); patternLen++) {
			const pattern = findLongestRepetitivePattern(words, i, 1);
			if (pattern.repetitions > maxRepetitions) {
				maxRepetitions = pattern.repetitions;
			}
		}
	}
	
	return maxRepetitions;
}

/**
 * Comprehensive transcription cleaning that combines all techniques
 * 
 * @param text - The raw transcription text
 * @returns Object containing cleaned text and whether hallucination was detected
 */
export function cleanTranscription(text: string): { cleanedText: string; hadHallucination: boolean } {
	if (!text || text.trim().length === 0) {
		return { cleanedText: text, hadHallucination: false };
	}
	
	const hadHallucination = detectHallucination(text);
	const cleanedText = cleanRepetitiveText(text, 3);
	
	return {
		cleanedText,
		hadHallucination
	};
}