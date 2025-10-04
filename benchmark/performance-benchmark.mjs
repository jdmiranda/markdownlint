// @ts-check

/**
 * Performance benchmark for markdownlint optimizations
 * Measures ops/sec for common markdown files
 */

import { readFile } from "node:fs/promises";
import { lint } from "../lib/exports-promise.mjs";
import { getCacheStats } from "../lib/performance-cache.mjs";

// Sample markdown content of varying complexity
const samples = {
  small: `# Heading

This is a simple markdown file with basic content.

- List item 1
- List item 2
- List item 3

Some **bold** and *italic* text.
`,

  medium: `# Project Documentation

## Overview

This is a medium-sized markdown document with various elements.

### Features

- Feature 1 with some description
- Feature 2 with **bold** text
- Feature 3 with [links](https://example.com)

### Code Examples

\`\`\`javascript
function example() {
  console.log("Hello, world!");
  return true;
}
\`\`\`

### Tables

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |

## Additional Sections

Multiple paragraphs with various formatting options.
Including *emphasis*, **strong**, and \`inline code\`.

> Blockquotes are also supported
> across multiple lines

1. Ordered lists
2. With multiple items
3. And nested content
   - Nested bullet
   - Another nested item

## Conclusion

This document tests various markdown features.
`.repeat(3),

  large: `# Large Document

## Table of Contents

- [Section 1](#section-1)
- [Section 2](#section-2)
- [Section 3](#section-3)

`.repeat(2) + `
## Section Content

This section contains extensive content to test performance with larger files.

### Subsection A

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Multiple paragraphs with various **formatting** and *styles*.

\`\`\`python
def example_function(param):
    """Docstring example"""
    result = param * 2
    return result

class ExampleClass:
    def __init__(self):
        self.value = 0

    def method(self):
        return self.value
\`\`\`

### Subsection B

More content with:

- Bullet points
- Multiple items
- Nested structures
  - Level 2
  - More items
    - Level 3

### Subsection C

Tables and data:

| Header 1 | Header 2 | Header 3 | Header 4 |
|----------|----------|----------|----------|
| Data 1   | Data 2   | Data 3   | Data 4   |
| Data 5   | Data 6   | Data 7   | Data 8   |
| Data 9   | Data 10  | Data 11  | Data 12  |

> Blockquotes with multiple lines
> to test quote handling performance
> across various scenarios

[Link text](https://example.com/path/to/resource)
![Image alt](https://example.com/image.png)

`.repeat(10)
};

/**
 * Benchmark a function execution
 * @param {Function} fn Function to benchmark
 * @param {number} duration Duration in milliseconds
 * @returns {Promise<Object>} Benchmark results
 */
async function benchmark(fn, duration = 5000) {
  const startTime = Date.now();
  let iterations = 0;
  let errors = 0;

  while (Date.now() - startTime < duration) {
    try {
      await fn();
      iterations++;
    } catch (error) {
      errors++;
    }
  }

  const actualDuration = Date.now() - startTime;
  const opsPerSecond = (iterations / actualDuration) * 1000;
  const avgTimeMs = actualDuration / iterations;

  return {
    iterations,
    duration: actualDuration,
    opsPerSecond: Math.round(opsPerSecond * 100) / 100,
    avgTimeMs: Math.round(avgTimeMs * 100) / 100,
    errors
  };
}

/**
 * Run benchmark for a specific sample
 * @param {string} name Sample name
 * @param {string} content Markdown content
 * @returns {Promise<void>}
 */
async function runBenchmark(name, content) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Benchmarking: ${name.toUpperCase()}`);
  console.log(`Content size: ${content.length} bytes`);
  console.log(`${"=".repeat(60)}`);

  const config = {
    default: true,
    "line-length": { line_length: 120 }
  };

  // First run (cold cache)
  console.log("\nCold cache (first run):");
  const coldResult = await benchmark(async () => {
    await lint({
      strings: { [name]: content },
      config
    });
  }, 2000);

  console.log(`  Operations: ${coldResult.iterations}`);
  console.log(`  Ops/sec: ${coldResult.opsPerSecond}`);
  console.log(`  Avg time: ${coldResult.avgTimeMs}ms`);

  // Warm cache run
  console.log("\nWarm cache (repeated runs):");
  const warmResult = await benchmark(async () => {
    await lint({
      strings: { [name]: content },
      config
    });
  }, 5000);

  console.log(`  Operations: ${warmResult.iterations}`);
  console.log(`  Ops/sec: ${warmResult.opsPerSecond}`);
  console.log(`  Avg time: ${warmResult.avgTimeMs}ms`);

  const improvement = ((warmResult.opsPerSecond - coldResult.opsPerSecond) / coldResult.opsPerSecond * 100);
  console.log(`  Cache improvement: ${Math.round(improvement * 100) / 100}%`);

  // Show cache stats
  const stats = getCacheStats();
  console.log("\nCache statistics:");
  console.log(`  Rule result cache: ${stats.ruleResultCacheSize} entries`);
  console.log(`  AST parse cache: ${stats.astParseCacheSize} entries`);
  console.log(`  Regex cache: ${stats.regexCacheSize} entries`);
  console.log(`  Object pool: ${stats.resultObjectPoolSize} objects`);
}

/**
 * Main benchmark runner
 */
async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("MARKDOWNLINT PERFORMANCE BENCHMARK");
  console.log("Testing rule cache and AST memoization optimizations");
  console.log("=".repeat(60));

  // Run benchmarks for each sample size
  for (const [name, content] of Object.entries(samples)) {
    await runBenchmark(name, content);
  }

  console.log("\n" + "=".repeat(60));
  console.log("BENCHMARK COMPLETE");
  console.log("=".repeat(60) + "\n");
}

// Run the benchmark
main().catch((error) => {
  console.error("Benchmark failed:", error);
  process.exit(1);
});
