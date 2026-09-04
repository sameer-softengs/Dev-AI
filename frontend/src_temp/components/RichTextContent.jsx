function cleanInlineMarkdown(value = '') {
  return String(value)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function classifyLine(line) {
  const trimmed = line.trim();

  if (!trimmed) {
    return { type: 'empty' };
  }

  if (/^#{1,4}\s+/.test(trimmed)) {
    return {
      type: 'heading',
      level: trimmed.match(/^#+/)[0].length,
      text: cleanInlineMarkdown(trimmed.replace(/^#{1,4}\s+/, ''))
    };
  }

  if (/^(-|\*|•)\s+/.test(trimmed)) {
    return {
      type: 'bullet',
      text: cleanInlineMarkdown(trimmed.replace(/^(-|\*|•)\s+/, ''))
    };
  }

  if (/^\d+\.\s+/.test(trimmed)) {
    return {
      type: 'number',
      text: cleanInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ''))
    };
  }

  if (/^[A-Za-z][A-Za-z\s]{1,40}:$/.test(trimmed)) {
    return {
      type: 'heading',
      level: 4,
      text: cleanInlineMarkdown(trimmed.slice(0, -1))
    };
  }

  return {
    type: 'paragraph',
    text: cleanInlineMarkdown(trimmed)
  };
}

function RichTextContent({ content }) {
  const lines = String(content || '').split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const current = classifyLine(lines[index]);

    if (current.type === 'empty') {
      index += 1;
      continue;
    }

    if (current.type === 'bullet' || current.type === 'number') {
      const listType = current.type === 'bullet' ? 'ul' : 'ol';
      const items = [];

      while (index < lines.length) {
        const item = classifyLine(lines[index]);
        if (item.type !== current.type) {
          break;
        }
        items.push(item.text);
        index += 1;
      }

      blocks.push({ type: listType, items });
      continue;
    }

    if (current.type === 'heading') {
      blocks.push(current);
      index += 1;
      continue;
    }

    const paragraphLines = [current.text];
    index += 1;

    while (index < lines.length) {
      const next = classifyLine(lines[index]);
      if (next.type !== 'paragraph') {
        break;
      }
      paragraphLines.push(next.text);
      index += 1;
    }

    blocks.push({
      type: 'paragraph',
      text: paragraphLines.join(' ')
    });
  }

  return (
    <div className="rich-text">
      {blocks.map((block, blockIndex) => {
        if (block.type === 'heading') {
          if (block.level <= 2) {
            return <h3 key={`${block.text}-${blockIndex}`}>{block.text}</h3>;
          }
          return <h4 key={`${block.text}-${blockIndex}`}>{block.text}</h4>;
        }

        if (block.type === 'ul') {
          return (
            <ul key={`list-${blockIndex}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={`list-${blockIndex}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{item}</li>
              ))}
            </ol>
          );
        }

        return <p key={`${block.text}-${blockIndex}`}>{block.text}</p>;
      })}
    </div>
  );
}

export default RichTextContent;
