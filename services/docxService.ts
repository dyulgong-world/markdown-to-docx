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
  ShadingType,
  AlignmentType
} from "docx";
import saveAs from "file-saver";

/**
 * Enhanced Markdown to Docx parser with Styled Components.
 * Matches the Preview visual style (Tailwind Typography).
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
          font: "Consolas", // Monospace font
          size: 20, // 10pt
          color: "F8FAFC" // Light Text (Slate 50)
        })],
        shading: {
          type: ShadingType.CLEAR,
          fill: "1E293B", // Dark Background (Slate 800)
        },
        border: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "1E293B" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "1E293B" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "1E293B" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "1E293B" },
        },
        spacing: { before: 200, after: 200 },
        indent: { left: 200, right: 200, firstLine: 0 } // Indent for block effect
      }));
    }
    codeBuffer = [];
    inCodeBlock = false;
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      // Filter out the delimiter row (e.g. |---|---|)
      const validRows = tableRows.filter(row => {
        const stripped = row.replace(/[|\-:\s]/g, '');
        return stripped.length > 0;
      });

      if (validRows.length > 0) {
        const rows = validRows.map((rowStr, rowIndex) => {
          const isHeader = rowIndex === 0; // Assume first row is header
          const cellsRaw = rowStr.split('|');
          
          const cells = cellsRaw.filter((c, i) => {
             if (i === 0 && c.trim() === '') return false;
             if (i === cellsRaw.length - 1 && c.trim() === '') return false;
             return true;
          }).map(c => c.trim());

          return new TableRow({
            children: cells.map(cellText => new TableCell({
              children: [new Paragraph({ 
                children: [new TextRun({ 
                  text: cellText,
                  bold: isHeader, // Bold for header
                  color: isHeader ? "1E293B" : "334155" // Darker text for header
                })],
                alignment: AlignmentType.LEFT
              })],
              width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
              shading: isHeader ? {
                fill: "F1F5F9", // Light Gray Header Background (Slate 100)
                type: ShadingType.CLEAR,
                color: "auto" 
              } : undefined,
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
          // Spacing property removed as it's not supported in ITableOptions in this version of docx
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
    const line = lines[i];
    const trimmed = line.trim();

    // 1. CODE BLOCKS (```)
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        if (inTable) flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // 2. TABLES
    if (trimmed.startsWith('|')) {
      if (!inTable) inTable = true;
      tableRows.push(trimmed);
      continue;
    } else {
      if (inTable) flushTable();
    }

    // 3. REGULAR CONTENT
    if (!trimmed) {
      docChildren.push(new Paragraph({ text: "" }));
      continue;
    }

    // Heading 1-3
    if (line.startsWith('# ')) {
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: line.replace('# ', ''), color: "0F172A" })], // Slate 900
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      }));
    } else if (line.startsWith('## ')) {
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: line.replace('## ', ''), color: "1E293B" })], // Slate 800
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      }));
    } else if (line.startsWith('### ')) {
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: line.replace('### ', ''), color: "334155" })], // Slate 700
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
        children: [new TextRun({ text: trimmed.replace('> ', ''), italics: true, color: "475569" })],
        indent: { left: 400 }, // Slight indent
        border: {
           left: { style: BorderStyle.SINGLE, size: 24, color: "3B82F6" } // Blue Left Border
        },
        shading: {
            fill: "EFF6FF", // Light Blue Background
            type: ShadingType.CLEAR,
        },
        spacing: { before: 120, after: 120 }
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

  // Cleanup
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
          run: { size: 24, font: "Calibri", color: "334155" }, // Slate 700
          paragraph: { spacing: { line: 276 } },
        },
      ],
    },
    sections: [{ children: docChildren }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
};