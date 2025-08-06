import { generateGenericSummaryAndTags } from '../../utils/fallback';

describe('fallback', () => {
  describe('generateGenericSummaryAndTags', () => {
    it('should generate summary from long text', () => {
      const longText = `This is a comprehensive discussion about artificial intelligence and machine learning. 
        We explore various aspects of neural networks, deep learning architectures, and their applications 
        in modern technology. The conversation covers supervised learning, unsupervised learning, and 
        reinforcement learning paradigms. We also discuss the ethical implications of AI systems and 
        their impact on society. Additionally, we examine current trends in natural language processing 
        and computer vision technologies.`;

      const result = generateGenericSummaryAndTags(longText, 'medium');
      
      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeGreaterThan(50);
      expect(result.summary.length).toBeLessThan(longText.length);
      expect(result.tags).toBeTruthy();
      expect(result.tags.length).toBeGreaterThan(0);
      expect(result.tags.length).toBeLessThanOrEqual(5);
    });

    it('should generate short summary when requested', () => {
      const text = `Artificial intelligence is transforming how we interact with technology. 
        Machine learning algorithms are becoming more sophisticated. Deep learning has enabled 
        breakthrough advances in computer vision and natural language processing.`;

      const result = generateGenericSummaryAndTags(text, 'short');
      
      // Short summary should be roughly 2 sentences
      const sentences = result.summary.split(/[.!?]+/).filter(s => s.trim());
      expect(sentences.length).toBeLessThanOrEqual(3);
      expect(sentences.length).toBeGreaterThanOrEqual(1);
    });

    it('should generate bullet points when requested', () => {
      const text = `The presentation covered several key topics. First, we discussed cloud computing 
        and its benefits. Second, we explored microservices architecture. Third, we examined 
        containerization with Docker. Fourth, we looked at orchestration with Kubernetes. 
        Finally, we reviewed best practices for deployment.`;

      const result = generateGenericSummaryAndTags(text, 'bullet');
      
      expect(result.summary).toContain('•');
      const bullets = result.summary.split('•').filter(b => b.trim());
      expect(bullets.length).toBeLessThanOrEqual(5);
      expect(bullets.length).toBeGreaterThan(0);
    });

    it('should extract meaningful tags from technical content', () => {
      const text = `This tutorial covers React hooks, including useState, useEffect, and useContext. 
        We'll build a responsive web application using TypeScript and implement Redux for state management. 
        The project uses Next.js for server-side rendering and Material-UI for styling.`;

      const result = generateGenericSummaryAndTags(text, 'medium');
      
      expect(result.tags).toBeTruthy();
      // Should extract some technical terms
      const tagString = result.tags.join(' ').toLowerCase();
      expect(
        tagString.includes('react') || 
        tagString.includes('typescript') || 
        tagString.includes('hooks') ||
        tagString.includes('redux')
      ).toBe(true);
    });

    it('should handle empty text gracefully', () => {
      const result = generateGenericSummaryAndTags('', 'medium');
      
      expect(result.summary).toBe('No content provided for summarization.');
      expect(result.tags).toBeUndefined(); // Tags not generated for empty content
    });

    it('should handle very short text', () => {
      const shortText = 'Hello world.';
      const result = generateGenericSummaryAndTags(shortText, 'medium');
      
      expect(result.summary).toBe('Hello world.'); // The period and trim behavior
      expect(result.tags).toEqual(['hello', 'world']); // Short words still get extracted as tags
    });

    it('should limit tags to maximum 5', () => {
      const text = `Python JavaScript TypeScript Java C++ Rust Go Swift Kotlin Ruby 
        PHP Scala Haskell Clojure Erlang Elixir OCaml F# Scheme Lisp Prolog 
        MATLAB R Julia Perl Lua Dart Flutter React Angular Vue Svelte`;

      const result = generateGenericSummaryAndTags(text, 'medium');
      
      expect(result.tags.length).toBeLessThanOrEqual(5);
    });

    it('should filter out common words from tags', () => {
      const text = `The quick brown fox jumps over the lazy dog. This is a simple 
        sentence with common words and articles that should not become tags.`;

      const result = generateGenericSummaryAndTags(text, 'medium');
      
      const commonWords = ['the', 'is', 'a', 'and', 'that', 'with', 'over', 'this'];
      result.tags.forEach(tag => {
        expect(commonWords).not.toContain(tag.toLowerCase());
      });
    });

    it('should handle text with special characters', () => {
      const text = `Email: test@example.com, Website: https://example.com. 
        Price: $99.99. Discount: 50% off! #hashtag @mention`;

      const result = generateGenericSummaryAndTags(text, 'medium');
      
      expect(result.summary).toBeTruthy();
      expect(result.tags).toBeTruthy();
      // Should not crash on special characters
    });

    it('should generate appropriate long summary', () => {
      const text = Array(10).fill(`This is a paragraph about technology and innovation. 
        It discusses various aspects of modern computing.`).join(' ');

      const result = generateGenericSummaryAndTags(text, 'long');
      
      expect(result.summary.length).toBeGreaterThan(200);
      expect(result.summary.split(/[.!?]+/).length).toBeGreaterThan(5);
    });
  });
});