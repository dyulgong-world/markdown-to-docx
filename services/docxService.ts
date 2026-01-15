import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle,
  ShadingType
} from "docx";
import saveAs from "file-saver";

/**
 * Enhanced Markdown to Docx parser.
 * Supports: Headings, Lists, Blockquotes, Code Blocks, and Tables.
 */
export const generateDocx = async (markdown: string, filename: string = "document.docx") => {
  const lines = markdown.split('\n');
  const docChildren: (Paragraph | Table)[] = [];

  // STATE MACHINE
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  
  let inTable = false;
  let tableRows: string[] = [];

  // --- HELPERS ---

  const flushCodeBlock = () => {
    if (codeBuffer.length > 0) {
      docChildren.push(new Paragraph({
        children: [new TextRun({
          text: codeBuffer.join('\n'),
          font: "Courier New",
          size: 20 // 10pt
        })],
        shading: {
          type: ShadingType.CLEAR,
          fill: "F3F4F6", // Light Gray background
        },
        border: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
        },
        spacing: { before: 200, after: 200 },
        indent: { left: 200, right: 200 }
      }));
    }
    codeBuffer = [];
    inCodeBlock = false;
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      // Filter out the delimiter row (e.g. |---|---|)
      const validRows = tableRows.filter(row => {
        // Simple check: if row contains only |, -, : and spaces, it's likely a delimiter
        const stripped = row.replace(/[|\-:\s]/g, '');
        return stripped.length > 0;
      });

      if (validRows.length > 0) {
        const rows = validRows.map(rowStr => {
          // Parse cells: split by pipe, trim whitespace
          // Note: This matches standard GFM tables which start/end with |
          const cellsRaw = rowStr.split('|');
          
          // Remove first/last empty elements if they exist (standard |cell| format)
          const cells = cellsRaw.filter((c, i) => {
             if (i === 0 && c.trim() === '') return false;
             if (i === cellsRaw.length - 1 && c.trim() === '') return false;
             return true;
          }).map(c => c.trim());

          return new TableRow({
            children: cells.map(cellText => new TableCell({
              children: [new Paragraph({ text: cellText })],
              width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
              },
              margins: {
                top: 100, bottom: 100, left: 100, right: 100
              }
            }))
          });
        });

        docChildren.push(new Table({
          rows: rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          spacing: { before: 240, after: 240 }
        }));
      }
    }
    tableRows = [];
    inTable = false;
  };
  
  const parseInline = (text: string): TextRun[] => {
     // Naive bold parser: **text**
     const parts = text.split(/(\*\*.*?\*\*)/g);
     return parts.map(part => {
       if (part.startsWith('**') && part.endsWith('**')) {
         return new TextRun({ text: part.slice(2, -2), bold: true });
       }
       return new TextRun({ text: part });
     });
  };

  // --- PARSING LOOP ---

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]; // Keep indentation for code blocks
    const trimmed = line.trim();

    // 1. CODE BLOCKS (```)
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        flushCodeBlock();
      } else {
        // Start of code block
        if (inTable) flushTable(); // Close table if open
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // 2. TABLES
    // Heuristic: Line starts with | and usually ends with |
    if (trimmed.startsWith('|')) {
      if (!inTable) inTable = true;
      tableRows.push(trimmed);
      continue;
    } else {
      if (inTable) flushTable();
    }

    // 3. REGULAR CONTENT
    if (!trimmed) {
      // Empty line
      docChildren.push(new Paragraph({ text: "" }));
      continue;
    }

    // Heading 1-3
    if (line.startsWith('# ')) {
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: line.replace('# ', '') })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      }));
    } else if (line.startsWith('## ')) {
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: line.replace('## ', '') })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      }));
    } else if (line.startsWith('### ')) {
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: line.replace('### ', '') })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }));
    } 
    // Lists
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
       docChildren.push(new Paragraph({
        children: parseInline(trimmed.replace(/^[\-\*]\s+/, '')),
        bullet: { level: 0 }
      }));
    }
    // Blockquote
    else if (trimmed.startsWith('> ')) {
       docChildren.push(new Paragraph({
        children: [new TextRun({ text: trimmed.replace('> ', ''), italics: true })],
        indent: { left: 720 },
        style: "Quote",
      }));
    }
    // Normal Paragraph
    else {
      docChildren.push(new Paragraph({
        children: parseInline(line),
        spacing: { after: 120 }
      }));
    }
  }

  // Cleanup remaining buffers
  if (inCodeBlock) flushCodeBlock();
  if (inTable) flushTable();

  // Create Document
  const doc = new Document({
    creator: "Markdown to Docx Pro",
    title: filename,
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: { size: 24, font: "Calibri" },
          paragraph: { spacing: { line: 276 } },
        },
        {
          id: "Quote",
          name: "Quote",
          basedOn: "Normal",
          next: "Normal",
          run: { italics: true, color: "555555" }
        }
      ],
    },
    sections: [{ children: docChildren }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
};