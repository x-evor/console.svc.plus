import { marked } from "marked";

interface DocArticleProps {
  content: string;
}

export default async function DocArticle({ content }: DocArticleProps) {
  // Convert markdown to HTML
  const htmlContent = await marked(content);

  return (
    <article
      className="public-doc-prose"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
