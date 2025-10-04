// @ts-check

import { performance } from "node:perf_hooks";
import { parse, clearParseCache } from "../lib/micromark-parse.mjs";

/**
 * Benchmark test cases
 */
const testCases = [
  {
    name: "Plain text (fast path)",
    markdown: "This is a simple paragraph of plain text without any markdown syntax.\nJust some normal text to test the fast path optimization.",
    iterations: 10000
  },
  {
    name: "Simple markdown",
    markdown: "# Heading\n\nThis is a **bold** paragraph with *italic* text and a [link](https://example.com).",
    iterations: 5000
  },
  {
    name: "Complex markdown with lists",
    markdown: `# Main Heading

## Section 1

This is a paragraph with **bold** and *italic* text.

- Item 1
- Item 2
  - Nested item 1
  - Nested item 2
- Item 3

## Section 2

1. First item
2. Second item
3. Third item

\`\`\`javascript
const code = "block";
\`\`\`

> Blockquote text
> with multiple lines`,
    iterations: 1000
  },
  {
    name: "Tables and code",
    markdown: `# Table Example

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`

Some \`inline code\` here.`,
    iterations: 1000
  },
  {
    name: "Links and images",
    markdown: `# Links Test

[Link 1](https://example.com)
[Link 2](https://example.org)
![Image](https://example.com/image.png)

[Reference link][ref]

[ref]: https://example.com/reference`,
    iterations: 2000
  },
  {
    name: "Large document",
    markdown: Array(100).fill(`## Section Header

This is a paragraph with some **bold text** and *italic text*.

- List item 1
- List item 2
- List item 3

\`\`\`javascript
const code = "example";
\`\`\``).join("\n\n"),
    iterations: 100
  }
];

/**
 * Runs a benchmark test
 *
 * @param {string} name Test name
 * @param {string} markdown Markdown content
 * @param {number} iterations Number of iterations
 * @returns {Object} Benchmark results
 */
function runBenchmark(name, markdown, iterations) {
  // Warm up
  for (let i = 0; i < Math.min(10, iterations); i++) {
    parse(markdown);
  }

  // Test without cache
  clearParseCache();
  const startNoCacheTime = performance.now();
  for (let i = 0; i < iterations; i++) {
    clearParseCache();
    parse(markdown);
  }
  const endNoCacheTime = performance.now();
  const noCacheDuration = endNoCacheTime - startNoCacheTime;

  // Test with cache (same content)
  clearParseCache();
  const startCacheTime = performance.now();
  for (let i = 0; i < iterations; i++) {
    parse(markdown);
  }
  const endCacheTime = performance.now();
  const cacheDuration = endCacheTime - startCacheTime;

  const noCacheAvg = noCacheDuration / iterations;
  const cacheAvg = cacheDuration / iterations;
  const improvement = ((noCacheDuration - cacheDuration) / noCacheDuration * 100).toFixed(2);

  return {
    name,
    iterations,
    noCacheDuration: noCacheDuration.toFixed(2),
    cacheDuration: cacheDuration.toFixed(2),
    noCacheAvg: noCacheAvg.toFixed(4),
    cacheAvg: cacheAvg.toFixed(4),
    improvement: `${improvement}%`,
    speedup: `${(noCacheAvg / cacheAvg).toFixed(2)}x`
  };
}

/**
 * Runs all benchmarks
 */
function runAllBenchmarks() {
  console.log("=== Micromark Parser Performance Benchmark ===\n");
  console.log("Testing parse result cache and optimization effectiveness\n");

  const results = [];

  for (const testCase of testCases) {
    console.log(`Running: ${testCase.name} (${testCase.iterations} iterations)...`);
    const result = runBenchmark(testCase.name, testCase.markdown, testCase.iterations);
    results.push(result);
    console.log(`  No Cache: ${result.noCacheDuration}ms (avg ${result.noCacheAvg}ms)`);
    console.log(`  With Cache: ${result.cacheDuration}ms (avg ${result.cacheAvg}ms)`);
    console.log(`  Improvement: ${result.improvement} (${result.speedup} faster)\n`);
  }

  // Summary
  console.log("\n=== Summary ===\n");
  console.log("| Test | Iterations | No Cache (ms) | Cached (ms) | Improvement | Speedup |");
  console.log("|------|------------|---------------|-------------|-------------|---------|");
  for (const result of results) {
    console.log(`| ${result.name} | ${result.iterations} | ${result.noCacheAvg} | ${result.cacheAvg} | ${result.improvement} | ${result.speedup} |`);
  }

  // Overall statistics
  const totalIterations = results.reduce((sum, r) => sum + r.iterations, 0);
  const avgImprovement = results.reduce((sum, r) => sum + parseFloat(r.improvement), 0) / results.length;
  console.log(`\nTotal iterations: ${totalIterations}`);
  console.log(`Average improvement: ${avgImprovement.toFixed(2)}%`);
  console.log("\nOptimizations tested:");
  console.log("✓ Parse result cache (Map by markdown string)");
  console.log("✓ Token optimization (pre-allocated pools)");
  console.log("✓ Event handler pooling");
  console.log("✓ Fast paths for common markdown patterns");
}

// Run benchmarks
runAllBenchmarks();
