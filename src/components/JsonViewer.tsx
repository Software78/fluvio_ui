import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface JsonViewerProps {
  data: Record<string, unknown> | null | undefined;
}

interface JsonToken {
  text: string;
  type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'structural' | 'whitespace';
}

/**
 * Tokenizes a JSON string into grammatical elements for syntax highlighting.
 */
function tokenizeJson(jsonStr: string): JsonToken[] {
  const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"\s*:)|("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")|(-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)|(true|false)|(null)|([\{\}\[\]:,])/g;

  const tokens: JsonToken[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(jsonStr)) !== null) {
    const textBefore = jsonStr.substring(lastIndex, match.index);
    if (textBefore) {
      tokens.push({ text: textBefore, type: 'whitespace' });
    }

    const value = match[0];
    if (value.endsWith(':')) {
      tokens.push({ text: value.slice(0, -1), type: 'key' });
      tokens.push({ text: ':', type: 'structural' });
    } else if (value.startsWith('"')) {
      tokens.push({ text: value, type: 'string' });
    } else if (/^-?\d/.test(value)) {
      tokens.push({ text: value, type: 'number' });
    } else if (value === 'true' || value === 'false') {
      tokens.push({ text: value, type: 'boolean' });
    } else if (value === 'null') {
      tokens.push({ text: value, type: 'null' });
    } else {
      tokens.push({ text: value, type: 'structural' });
    }

    lastIndex = regex.lastIndex;
  }

  const textAfter = jsonStr.substring(lastIndex);
  if (textAfter) {
    tokens.push({ text: textAfter, type: 'whitespace' });
  }

  return tokens;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);
  
  if (!data) {
    return <span className="text-textMuted font-mono">{"{}"}</span>;
  }

  const rawJson = JSON.stringify(data, null, 2);
  const tokens = tokenizeJson(rawJson);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTokenStyle = (type: JsonToken['type']) => {
    switch (type) {
      case 'key':
        return 'text-textPrimary font-semibold';
      case 'string':
        return 'text-accent'; // green
      case 'number':
      case 'boolean':
      case 'null':
        return 'text-[#f59e0b]'; // amber
      case 'structural':
        return 'text-textMuted';
      default:
        return 'text-textPrimary';
    }
  };

  return (
    <div className="relative group bg-[#0e0e10] border border-darkBorder rounded-[4px] p-4 text-xs font-mono overflow-auto max-h-[300px]">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-darkSurface/80 border border-darkBorder rounded-[4px] text-textMuted hover:text-textPrimary transition-all duration-150 hover:bg-darkSurface"
        title="Copy to clipboard"
      >
        {copied ? (
          <span className="flex items-center gap-1 text-[10px] text-accent font-mono">
            <Check size={12} /> COPIED
          </span>
        ) : (
          <Copy size={12} />
        )}
      </button>
      
      <pre className="leading-relaxed whitespace-pre-wrap break-all">
        <code>
          {tokens.map((token, idx) => (
            <span key={idx} className={getTokenStyle(token.type)}>
              {token.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
};
