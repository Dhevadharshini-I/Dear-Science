import { useMemo } from 'react';

interface MarkdownProps {
  content: string;
}

/**
 * Minimal Markdown-to-JSX renderer supporting headings (h1–h4), bold, italic,
 * inline code, code blocks, unordered/ordered lists, blockquotes, and paragraphs.
 * Not a full Markdown parser — sufficient for AI study responses.
 */
export default function MarkdownRenderer({ content }: MarkdownProps) {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <div className="space-y-3 leading-relaxed">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'code'; lang: string; code: string }
  | { type: 'quote'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'paragraph'; text: string };

function parseBlocks(md: string): Block[] {
  const lines = md.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip blank lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: 'code', lang, code: codeLines.join('\n') });
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2] });
      i++;
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: 'quote', text: quoteLines.join(' ') });
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Paragraph — collect consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('> ') &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
  }

  return blocks;
}

function renderInline(text: string): React.ReactNode[] {
  // Handle bold, italic, and inline code
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const patterns: { regex: RegExp; render: (match: string) => React.ReactNode }[] = [
    { regex: /\*\*(.+?)\*\*/, render: (m) => <strong className="font-semibold text-gray-900">{m}</strong> },
    { regex: /\*(.+?)\*/, render: (m) => <em className="italic">{m}</em> },
    { regex: /`(.+?)`/, render: (m) => <code className="rounded bg-purple-50 px-1.5 py-0.5 font-mono text-sm text-purple-700">{m}</code> },
  ];

  while (remaining.length > 0) {
    let earliestIdx = remaining.length;
    let matchedPattern: { regex: RegExp; render: (match: string) => React.ReactNode } | null = null;
    let matchResult: RegExpMatchArray | null = null;

    for (const p of patterns) {
      const m = remaining.match(p.regex);
      if (m && m.index !== undefined && m.index < earliestIdx) {
        earliestIdx = m.index;
        matchedPattern = p;
        matchResult = m;
      }
    }

    if (matchedPattern && matchResult && matchResult.index !== undefined) {
      if (matchResult.index > 0) {
        tokens.push(remaining.slice(0, matchResult.index));
      }
      tokens.push(<span key={key++}>{matchedPattern.render(matchResult[1])}</span>);
      remaining = remaining.slice(matchResult.index + matchResult[0].length);
    } else {
      tokens.push(remaining);
      break;
    }
  }

  return tokens;
}

function renderBlock(block: Block, index: number): React.ReactNode {
  switch (block.type) {
    case 'heading': {
      const sizes = [
        'text-2xl font-bold text-gray-900 mt-5 mb-2',
        'text-xl font-bold text-gray-900 mt-4 mb-2',
        'text-lg font-semibold text-gray-800 mt-3 mb-1',
        'text-base font-semibold text-gray-800 mt-2 mb-1',
      ];
      const className = sizes[Math.min(block.level - 1, sizes.length - 1)];
      return <div key={index} className={className}>{renderInline(block.text)}</div>;
    }
    case 'code':
      return (
        <pre key={index} className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm">
          <code className="font-mono text-gray-100">{block.code}</code>
        </pre>
      );
    case 'quote':
      return (
        <blockquote key={index} className="border-l-4 border-purple-300 bg-purple-50/50 px-4 py-2 text-gray-700 italic">
          {renderInline(block.text)}
        </blockquote>
      );
    case 'ul':
      return (
        <ul key={index} className="space-y-1.5 pl-1">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-gray-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={index} className="space-y-1.5">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-gray-700">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                {j + 1}
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    case 'paragraph':
      return <p key={index} className="text-gray-700">{renderInline(block.text)}</p>;
    default:
      return null;
  }
}
