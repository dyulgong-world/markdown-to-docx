import React, { useState, useCallback } from 'react';
import { ViewMode } from './types';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Toolbar from './components/Toolbar';
import { generateDocx } from './services/docxService';

const DEFAULT_MARKDOWN = `# Comprehensive Markdown Test

## Text Formatting
This text is **bold**, this is *italic*, and this is ~~strikethrough~~.
You can also use \`inline code\` for technical terms.

## Headings
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

## Lists
### Unordered List
- Item 1
- Item 2
  - Nested Item 2.1
  - Nested Item 2.2
- Item 3

### Ordered List
1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

### Task List
- [x] Completed task
- [ ] Pending task
- [ ] Another pending task

## Block Elements
> This is a blockquote. It works well for citations or emphasizing specific content.
>
> It can also span multiple paragraphs.

## Tables
| Feature | Support | Notes |
| :--- | :---: | ---: |
| Tables | Yes | Auto-sized |
| Alignment | Yes | Left/Center/Right |
| Formatting | **Bold** | *Italic* works too |

## Code Blocks
\`\`\`typescript
const greeting = "Hello World";
console.log(greeting);
function add(a: number, b: number) {
  return a + b;
}
\`\`\`

## Horizontal Rules
---

## Links and Images
[Google Search](https://google.com)

![Placeholder Image](https://via.placeholder.com/600x200?text=Markdown+Image+Test)

*Note: Image rendering depends on network access.*
`;

function App() {
  const [markdown, setMarkdown] = useState<string>(DEFAULT_MARKDOWN);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.SPLIT);

  // Layout Logic
  const showEditor = viewMode === ViewMode.SPLIT || viewMode === ViewMode.EDITOR;
  const showPreview = viewMode === ViewMode.SPLIT || viewMode === ViewMode.PREVIEW;
  
  const getGridCols = () => {
    if (viewMode === ViewMode.SPLIT) return 'grid-cols-2';
    return 'grid-cols-1';
  };

  const handleDownload = useCallback(async () => {
    try {
      await generateDocx(markdown, "my-draft.docx");
    } catch (error) {
      console.error("Download failed", error);
      alert("Failed to generate document.");
    }
  }, [markdown]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Toolbar 
        viewMode={viewMode}
        setViewMode={setViewMode}
        onDownload={handleDownload}
        hasContent={markdown.length > 0}
      />

      <main className={`flex-1 grid ${getGridCols()} overflow-hidden`}>
        {showEditor && (
          <div className="h-full overflow-hidden">
            <Editor 
              value={markdown} 
              onChange={setMarkdown} 
              visible={true}
            />
          </div>
        )}
        
        {showPreview && (
          <div className="h-full overflow-hidden">
            <Preview 
              content={markdown} 
              visible={true} 
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;