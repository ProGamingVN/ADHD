# Graph Report - .  (2026-07-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 146 nodes · 299 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `65bf0365`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- normalizeForMatch
- chat-engine.js
- ai2/chat-widget.js
- text-utils.js
- content-extractor.js
- pipeline.js
- small-talk.js
- script.js
- ui/chat-widget.js
- build.js
- ai/chat-widget.js

## God Nodes (most connected - your core abstractions)
1. `normalizeForMatch()` - 21 edges
2. `tokenize()` - 11 edges
3. `stripTags()` - 10 edges
4. `extractSubDocuments()` - 9 edges
5. `stripDiacritics()` - 9 edges
6. `slugify()` - 8 edges
7. `ChatEngine` - 7 edges
8. `extractContent()` - 7 edges
9. `generateKeywordsForNode()` - 7 edges
10. `buildGraphNodes()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `looksLikeFollowUp()` --calls--> `normalizeForMatch()`  [EXTRACTED]
  ai2/core/chat/chat-engine.js → ai2/core/generators/_utils/text-utils.js
- `detectSmallTalk()` --calls--> `normalizeForMatch()`  [EXTRACTED]
  ai2/core/chat/small-talk.js → ai2/core/generators/_utils/text-utils.js
- `slugify()` --calls--> `stripDiacritics()`  [EXTRACTED]
  ai2/core/extractor/content-extractor.js → ai2/core/generators/_utils/text-utils.js
- `runPipeline()` --calls--> `extractContent()`  [EXTRACTED]
  ai2/pipeline.js → ai2/core/extractor/content-extractor.js
- `generateAliasesForNode()` --calls--> `stripDiacritics()`  [EXTRACTED]
  ai2/core/generators/alias-generator.js → ai2/core/generators/_utils/text-utils.js

## Import Cycles
- None detected.

## Communities (11 total, 2 thin omitted)

### Community 0 - "normalizeForMatch"
Cohesion: 0.18
Nodes (17): ALIAS_DICTIONARY, generateAliases(), generateAliasesForNode(), ADHD_ENTITY_DICTIONARY, generateEntities(), generateEntitiesForNode(), generateIntents(), generateIntentsForNode() (+9 more)

### Community 1 - "chat-engine.js"
Cohesion: 0.16
Nodes (12): calculateSimilarity(), composeAnswer(), escapeHtml(), extractFirstSentences(), SPECIFIC_CATEGORIES, ChatEngine, FOLLOWUP_HINTS, looksLikeFollowUp() (+4 more)

### Community 2 - "ai2/chat-widget.js"
Cohesion: 0.19
Nodes (18): askAI(), askSuggested(), buildNavButtons(), buildSuggestions(), copyAnswer(), DATA_URL, escapeAttr(), escapeHtml() (+10 more)

### Community 3 - "text-utils.js"
Cohesion: 0.22
Nodes (15): generateKeywords(), generateKeywordsForNode(), generateQuestions(), generateQuestionsForNode(), generateBigrams(), STOPWORDS, STOPWORDS_EN, STOPWORDS_VI (+7 more)

### Community 4 - "content-extractor.js"
Cohesion: 0.31
Nodes (16): DEFAULT_INDEX_PATH, __dirname, extractAccordionItems(), extractCauseCards(), extractConsequenceItems(), extractContent(), extractHeadingText(), extractHospitalCards() (+8 more)

### Community 5 - "pipeline.js"
Cohesion: 0.29
Nodes (8): chunkContent(), computeChildCategory(), cleanContent(), isNoise(), buildRelationships(), __dirname, OUTPUT_PATH, runPipeline()

### Community 6 - "small-talk.js"
Cohesion: 0.22
Nodes (9): APOLOGY_PATTERNS, CAPABILITY_PATTERNS, detectSmallTalk(), FAREWELL_PATTERNS, GREETING_PATTERNS, HELP_PATTERNS, IDENTITY_PATTERNS, matchesAny() (+1 more)

### Community 7 - "script.js"
Cohesion: 0.27
Nodes (4): measurePanelHeight(), moveIndicator(), setTabsPanelsHeight(), switchTab()

### Community 8 - "ui/chat-widget.js"
Cohesion: 0.53
Nodes (4): el(), mountChatWidget(), pickInitialSuggestions(), readStoredTheme()

## Knowledge Gaps
- **18 isolated node(s):** `DATA_URL`, `SECTION_LABELS`, `SPECIFIC_CATEGORIES`, `GREETING_PATTERNS`, `FAREWELL_PATTERNS` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalizeForMatch()` connect `normalizeForMatch` to `chat-engine.js`, `text-utils.js`, `small-talk.js`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Why does `ChatEngine` connect `chat-engine.js` to `ai2/chat-widget.js`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `stripDiacritics()` connect `text-utils.js` to `normalizeForMatch`, `content-extractor.js`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `DATA_URL`, `SECTION_LABELS`, `SPECIFIC_CATEGORIES` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._