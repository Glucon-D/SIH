import ReactMarkdown from "react-markdown";

const MarkdownRenderer = ({ content, className = "" }) => {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="ml-2">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-bold text-green-700 dark:text-green-300">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-blue-600 dark:text-blue-400">{children}</em>,
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mb-1 mt-2 first:mt-0">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-xs font-semibold mb-1 mt-2 first:mt-0">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-medium mb-1 mt-2 first:mt-0">
              {children}
            </h6>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            ) : (
              <code className="block bg-gray-100 dark:bg-gray-600 p-2 rounded text-xs font-mono overflow-x-auto">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-100 dark:bg-gray-600 p-2 rounded text-xs font-mono overflow-x-auto my-2">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 my-2 italic">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr className="border-gray-300 dark:border-gray-600 my-3" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
