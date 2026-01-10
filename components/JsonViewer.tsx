import React, { useState } from 'react';

interface Props {
  data: any;
  name?: string;
  depth?: number;
  initiallyOpen?: boolean;
}

export const JsonViewer: React.FC<Props> = ({ data, name, depth = 0, initiallyOpen }) => {
  // Logic: If initiallyOpen is strictly defined (true/false), use it. 
  // Otherwise, default to auto-collapse after depth 1 (root and level 1 open).
  const [isOpen, setIsOpen] = useState(
    initiallyOpen !== undefined ? initiallyOpen : depth < 2
  );

  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);
  const isEmpty = isObject && Object.keys(data).length === 0;

  const toggle = () => setIsOpen(!isOpen);

  if (!isObject) {
    let valueClass = 'text-green-600 dark:text-green-400'; // String
    if (typeof data === 'number') valueClass = 'text-blue-600 dark:text-blue-400';
    if (typeof data === 'boolean') valueClass = 'text-purple-600 dark:text-purple-400';
    if (data === null) valueClass = 'text-gray-500';

    return (
      <div className="font-mono text-xs leading-5 hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 -ml-1 transition-colors">
        {name && <span className="text-gray-700 dark:text-slate-300 mr-1">"{name}":</span>}
        <span className={valueClass}>
            {typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
      </div>
    );
  }

  return (
    <div className="font-mono text-xs leading-5">
      <div className="flex items-center hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 -ml-1 transition-colors">
        {/* Toggle Button */}
        {!isEmpty && (
            <button 
                onClick={toggle} 
                className="mr-1 w-4 h-4 flex items-center justify-center text-gray-500 hover:text-black dark:text-slate-500 dark:hover:text-white transition-colors"
            >
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>›</span>
            </button>
        )}
        {isEmpty && <span className="w-4 mr-1"></span>}

        {/* Key Name */}
        {name && <span className="text-gray-700 dark:text-slate-300 mr-1">"{name}":</span>}

        {/* Bracket Start */}
        <span className="text-gray-500">{isArray ? '[' : '{'}</span>
        
        {/* Condensed view if closed */}
        {!isOpen && !isEmpty && (
            <span className="text-gray-400 mx-1 italic cursor-pointer select-none" onClick={toggle}>
                ... {isArray ? data.length : Object.keys(data).length} items ...
            </span>
        )}

        {/* Bracket End (inline if closed) */}
        {!isOpen && <span className="text-gray-500">{isArray ? ']' : '}'}</span>}
      </div>

      {/* Children */}
      {isOpen && !isEmpty && (
        <div className="pl-4 border-l border-gray-200 dark:border-slate-800 ml-2.5">
          {Object.entries(data).map(([key, val], idx) => (
            <JsonViewer 
                key={idx} 
                data={val} 
                name={isArray ? undefined : key} 
                depth={depth + 1} 
                initiallyOpen={initiallyOpen} // Propagate the force state
            />
          ))}
        </div>
      )}

      {/* Bracket End (new line if open) */}
      {isOpen && <div className="text-gray-500 pl-2 hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 -ml-1">{isArray ? ']' : '}'}</div>}
    </div>
  );
};