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
  AlignmentType,
  ExternalHyperlink,
  ImageRun,
  LevelFormat,
  convertInchesToTwip
} from "docx";
import saveAs from "file-saver";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { DocxStyleConfig, DEFAULT_STYLE_CONFIG } from "../types";

// --- HELPERS ---
const getColor = (hex: string) => hex.replace('#', '');

/**
 * Fetch image blob from URL.
 * Note: Browser CORS policies often block direct fetching of external images.
 * This is a best-effort implementation.
 */
const fetchImageBlob = async (url: string): Promise<ArrayBuffer | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch (e) {
    console.warn(`Failed to fetch image: ${url}`, e);
    return null;
  }
};

interface TextStyle {
  bold?: boolean;
  italics?: boolean;
  strike?: boolean;
}

interface StyleOverrides {
  color?: string;
  font?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shading?: any;
}

// --- AST TRANSFORMER ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformInline = (
  node: any, 
  config: DocxStyleConfig, 
  imageMap: Map<string, ArrayBuffer>, 
  style: TextStyle = {},
  overrides: StyleOverrides = {}
): (TextRun | ExternalHyperlink | ImageRun)[] => {
  
  // Default values fall back to config body if no override provided
  const effectiveFont = overrides.font || config.font.body;
  const effectiveColor = overrides.color || getColor(config.typography.body);

  switch (node.type) {
    case 'text':
      return [new TextRun({ 
        text: node.value, 
        font: effectiveFont,
        color: effectiveColor,
        bold: style.bold,
        italics: style.italics,
        strike: style.strike,
        shading: overrides.shading
      })];
    
    case 'emphasis': // Italic
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return node.children.flatMap((child: any) => 
        transformInline(child, config, imageMap, { ...style, italics: true }, overrides)
      );

    case 'strong': // Bold
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return node.children.flatMap((child: any) => 
        transformInline(child, config, imageMap, { ...style, bold: true }, overrides)
      );

    case 'delete': // Strikethrough
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return node.children.flatMap((child: any) => 
        transformInline(child, config, imageMap, { ...style, strike: true }, overrides)
      );

    case 'inlineCode':
      return [new TextRun({
        text: node.value,
        font: config.font.code,
        size: config.sizes.code * 2, // docx uses half-points
        color: getColor(config.inlineCode.color), 
        shading: { fill: getColor(config.inlineCode.background), type: ShadingType.CLEAR, color: "auto" } 
      })];

    case 'link':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Links should have specific color, usually blue.
      const linkOverrides = { ...overrides, color: getColor(config.typography.link) };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const linkChildren = node.children.flatMap((child: any) => 
        transformInline(child, config, imageMap, style, linkOverrides)
      );
      return [new ExternalHyperlink({
        children: linkChildren,
        link: node.url
      })];

    case 'image':
      const buffer = imageMap.get(node.url);
      if (buffer) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [new ImageRun({
          data: buffer,
          transformation: {
            width: 400, // standard width
            height: 300 // placeholder height, real implementation would read aspect ratio
          }
        } as any)];
      } else {
        // Fallback if image fails to load
        return [new TextRun({
          text: `[Image: ${node.alt || 'No Alt'}]`,
          color: "64748B",
          italics: true,
          font: effectiveFont
        })];
      }

    default:
      console.warn('Unknown inline node type:', node.type);
      return [new TextRun({ text: "" })];
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformBlock = (node: any, config: DocxStyleConfig, imageMap: Map<string, ArrayBuffer>, listContext?: { level: number, ordered: boolean }): (Paragraph | Table)[] => {
  switch (node.type) {
    case 'heading':
      const level = Math.min(Math.max(node.depth, 1), 6);
      
      // Determine specific styles for headings
      let headingColor = getColor(config.typography.body);
      if (level === 1) headingColor = getColor(config.typography.heading1);
      else if (level === 2) headingColor = getColor(config.typography.heading2);
      else if (level === 3) headingColor = getColor(config.typography.heading3);
      else if (level === 4) headingColor = getColor(config.typography.heading4);
      else if (level === 5) headingColor = getColor(config.typography.heading5);
      else if (level === 6) headingColor = getColor(config.typography.heading6);
      
      const headingFont = config.font.heading;

      return [new Paragraph({
        heading: Object.values(HeadingLevel)[level - 1],
        children: node.children.flatMap((child: any) => 
          transformInline(child, config, imageMap, {}, { color: headingColor, font: headingFont })
        ),
        spacing: { before: 240, after: 120 },
        border: level === 1 || level === 2 ? {
            bottom: { style: BorderStyle.SINGLE, size: 4, space: 1, color: "E2E8F0" }
        } : undefined
      })];

    case 'paragraph':
      return [new Paragraph({
        children: node.children.flatMap((child: any) => transformInline(child, config, imageMap)),
        spacing: { after: 200 }
      })];

    case 'blockquote':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return node.children.flatMap((child: any) => {
          // If child is paragraph, we want its text to use blockquote text color
          if (child.type === 'paragraph') {
             const children = child.children.flatMap((c: any) => 
                transformInline(c, config, imageMap, {}, { color: getColor(config.blockquote.textColor) })
             );
             return new Paragraph({
                 children: children,
                 indent: { left: 400 },
                 border: { left: { style: BorderStyle.SINGLE, size: 24, color: getColor(config.blockquote.border) } },
                 shading: { fill: getColor(config.blockquote.background), type: ShadingType.CLEAR },
                 spacing: { after: 120 }
             });
          }
          // For other blocks nested in blockquote (like lists), it's complex. 
          // We'll fallback to standard transform for non-paragraph direct children for now.
          return transformBlock(child, config, imageMap);
      });

    case 'code':
      // Block code
      return [new Paragraph({
        children: [new TextRun({
          text: node.value,
          font: config.font.code,
          size: config.sizes.code * 2, // docx uses half-points
          color: getColor(config.codeBlock.text)
        })],
        shading: { fill: getColor(config.codeBlock.background), type: ShadingType.CLEAR },
        border: {
          top: { style: BorderStyle.SINGLE, size: 1, color: getColor(config.codeBlock.background) },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: getColor(config.codeBlock.background) },
          left: { style: BorderStyle.SINGLE, size: 1, color: getColor(config.codeBlock.background) },
          right: { style: BorderStyle.SINGLE, size: 1, color: getColor(config.codeBlock.background) },
        },
        indent: { left: 200, right: 200 },
        spacing: { before: 200, after: 200 }
      })];

    case 'thematicBreak': // Horizontal Rule
      return [new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: getColor(config.thematicBreak.color) } },
        spacing: { before: 240, after: 240 }
      })];

    case 'list':
      const isOrdered = node.ordered;
      // Flatten list items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return node.children.flatMap((listItem: any) => {
        const currentLevel = listContext ? listContext.level + 1 : 0;
        
        // Handle Checked/Unchecked Task Lists (gfm)
        const checked = listItem.checked; // null, true, or false
        let prefix: TextRun | null = null;
        if (checked === true) prefix = new TextRun({ text: "☑ ", font: "Segoe UI Symbol" });
        if (checked === false) prefix = new TextRun({ text: "☐ ", font: "Segoe UI Symbol" });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return listItem.children.flatMap((itemChild: any, idx: number) => {
           if (itemChild.type === 'list') {
             return transformBlock(itemChild, config, imageMap, { level: currentLevel, ordered: itemChild.ordered });
           }

           // Check if first child is a paragraph to apply list styling directly
           if (idx === 0 && itemChild.type === 'paragraph') {
               // Manually transform the paragraph contents to apply numbering
               const children = itemChild.children.flatMap((child: any) => transformInline(child, config, imageMap));
               
               if (prefix) {
                   children.unshift(prefix);
               }

               if (checked === null) {
                   // Standard list item
                   return new Paragraph({
                       children: children,
                       numbering: {
                           reference: isOrdered ? "default-numbered" : "default-bullet",
                           level: currentLevel
                       },
                       spacing: { after: 120 }
                   });
               } else {
                   // Checklist item (no numbering, just indentation + checkbox)
                   return new Paragraph({
                       children: children,
                       indent: { left: convertInchesToTwip((currentLevel + 1) * 0.25) },
                       spacing: { after: 120 }
                   });
               }
           }
           
           // Fallback for non-paragraph first items or subsequent items
           return transformBlock(itemChild, config, imageMap);
        });
      });

    case 'table':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = node.children.map((row: any, rowIndex: number) => {
        const isHeader = rowIndex === 0;
        
        // Prepare overrides for header cells
        const overrides: StyleOverrides = isHeader 
          ? { color: getColor(config.table.headerText) }
          : {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cells = row.children.map((cell: any) => {
           // Pass overrides to children
           const cellContent = cell.children.flatMap((c: any) => 
             transformInline(c, config, imageMap, {}, overrides)
           );
           
           return new TableCell({
             children: [new Paragraph({ 
               children: cellContent,
               alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT
             })],
             shading: isHeader ? { fill: getColor(config.table.headerBackground), type: ShadingType.CLEAR, color: "auto" } : undefined,
             verticalAlign: "center",
             margins: { top: 100, bottom: 100, left: 100, right: 100 },
             borders: {
               top: { style: BorderStyle.SINGLE, size: 1, color: getColor(config.table.borderColor) },
               bottom: { style: BorderStyle.SINGLE, size: 1, color: getColor(config.table.borderColor) },
               left: { style: BorderStyle.SINGLE, size: 1, color: getColor(config.table.borderColor) },
               right: { style: BorderStyle.SINGLE, size: 1, color: getColor(config.table.borderColor) },
             }
           });
        });
        return new TableRow({ children: cells });
      });

      return [new Table({
        rows: rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })];

    default:
      return [];
  }
};


export const generateDocx = async (
  markdown: string, 
  filename: string = "document.docx",
  config: DocxStyleConfig = DEFAULT_STYLE_CONFIG
) => {
  // 1. Parse Markdown to AST
  const processor = unified().use(remarkParse).use(remarkGfm);
  const ast = processor.parse(markdown);

  // 2. Pre-fetch all images
  const imageMap = new Map<string, ArrayBuffer>();
  const imageUrls: string[] = [];
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const findImages = (node: any) => {
    if (node.type === 'image') imageUrls.push(node.url);
    if (node.children) node.children.forEach(findImages);
  };
  findImages(ast);

  await Promise.all(imageUrls.map(async (url) => {
    const blob = await fetchImageBlob(url);
    if (blob) imageMap.set(url, blob);
  }));

  // 3. Transform AST to Docx Nodes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docChildren = ast.children.flatMap((node: any) => transformBlock(node, config, imageMap));

  // 4. Create Document
  const listMarkerColor = getColor(config.list.markerColor);
  const listFont = config.font.body;

  const doc = new Document({
    creator: "Markdown to Docx Pro",
    title: filename,
    numbering: {
      config: [
        {
          reference: "default-bullet",
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { run: { color: listMarkerColor, font: listFont }, paragraph: { indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.125) } } } },
            { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { run: { color: listMarkerColor, font: listFont }, paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.125) } } } },
            { level: 2, format: LevelFormat.BULLET, text: "\u25AA", alignment: AlignmentType.LEFT, style: { run: { color: listMarkerColor, font: listFont }, paragraph: { indent: { left: convertInchesToTwip(0.75), hanging: convertInchesToTwip(0.125) } } } },
          ],
        },
        {
          reference: "default-numbered",
          levels: [
             { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { run: { color: listMarkerColor, font: listFont }, paragraph: { indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.125) } } } },
             { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT, style: { run: { color: listMarkerColor, font: listFont }, paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.125) } } } },
          ]
        }
      ]
    },
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: { size: config.sizes.body * 2, font: config.font.body, color: getColor(config.typography.body) },
          paragraph: { spacing: { line: 276 } },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          run: { size: config.sizes.heading1 * 2, bold: true, color: getColor(config.typography.heading1), font: config.font.heading },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          run: { size: config.sizes.heading2 * 2, bold: true, color: getColor(config.typography.heading2), font: config.font.heading },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          run: { size: config.sizes.heading3 * 2, bold: true, color: getColor(config.typography.heading3), font: config.font.heading },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        {
          id: "Heading4",
          name: "Heading 4",
          run: { size: config.sizes.heading4 * 2, bold: true, color: getColor(config.typography.heading4), font: config.font.heading },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        {
          id: "Heading5",
          name: "Heading 5",
          run: { size: config.sizes.heading5 * 2, bold: true, color: getColor(config.typography.heading5), font: config.font.heading },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        {
          id: "Heading6",
          name: "Heading 6",
          run: { size: config.sizes.heading6 * 2, bold: true, color: getColor(config.typography.heading6), font: config.font.heading },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
      ],
    },
    sections: [{ children: docChildren }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
};