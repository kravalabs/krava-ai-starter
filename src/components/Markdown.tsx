import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  children: string;
  /** Force darker text (e.g. inside light user bubbles). */
  variant?: "default" | "onLight";
};

export function Markdown({ children, variant = "default" }: Props) {
  const onLight = variant === "onLight";
  return (
    <div
      className={
        "prose prose-sm max-w-none break-words " +
        (onLight
          ? "text-current prose-headings:text-current prose-strong:text-current prose-a:text-current prose-li:marker:text-current"
          : "prose-invert text-current prose-headings:text-foreground prose-strong:text-foreground prose-li:marker:text-muted-foreground prose-a:text-primary hover:prose-a:opacity-90")
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _n, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-2 break-all"
            />
          ),
          code: ({ className, children, ...props }) => (
            <code
              className={
                (className ?? "") +
                " rounded bg-secondary/60 px-1 py-0.5 text-[0.85em]"
              }
              {...props}
            >
              {children}
            </code>
          ),
          ul: ({ node: _n, ...props }) => (
            <ul {...props} className="list-disc pl-5 space-y-1 my-2" />
          ),
          ol: ({ node: _n, ...props }) => (
            <ol {...props} className="list-decimal pl-5 space-y-1 my-2" />
          ),
          h1: ({ node: _n, ...props }) => (
            <h3 {...props} className="text-base font-semibold mt-3 mb-1" />
          ),
          h2: ({ node: _n, ...props }) => (
            <h3 {...props} className="text-base font-semibold mt-3 mb-1" />
          ),
          h3: ({ node: _n, ...props }) => (
            <h4 {...props} className="text-sm font-semibold mt-3 mb-1" />
          ),
          p: ({ node: _n, ...props }) => (
            <p {...props} className="my-1.5 leading-relaxed" />
          ),
          hr: () => <hr className="my-3 border-border/60" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}