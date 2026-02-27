export function stripFrontmatter(content: string): string {
  if (!content.startsWith("---")) {
    return content;
  }

  const lines = content.split(/\r?\n/);
  if (lines[0] !== "---") {
    return content;
  }

  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === "---") {
      return lines.slice(i + 1).join("\n").trimStart();
    }
  }

  return content;
}

export function parseFrontmatterTitle(content: string): string | null {
  if (!content.startsWith("---")) {
    return null;
  }

  const lines = content.split(/\r?\n/);
  if (lines[0] !== "---") {
    return null;
  }

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];

    if (line === "---") {
      break;
    }

    const match = line.match(/^title\s*:\s*(.+)$/i);
    if (match) {
      return match[1].trim().replace(/^['\"]|['\"]$/g, "") || null;
    }
  }

  return null;
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/[*_~>#-]/g, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getPreview(content: string, maxLength: number): string {
  const plain = stripMarkdown(stripFrontmatter(content));
  if (plain.length === 0) {
    // 内容被完全剥离（如纯代码块、Mermaid 图表等）
    const body = stripFrontmatter(content);
    if (/```mermaid/i.test(body)) {
      return "(图表笔记)";
    }
    if (/```/.test(body)) {
      return "(代码笔记)";
    }
    return "";
  }
  if (plain.length <= maxLength) {
    return plain;
  }

  return `${plain.slice(0, maxLength).trimEnd()}...`;
}

export function getNoteTitle(file: { basename: string }, content: string): string {
  const frontmatterTitle = parseFrontmatterTitle(content);
  if (!frontmatterTitle) {
    return file.basename;
  }

  const body = stripFrontmatter(content);
  const firstLine = body
    .split(/\r?\n/)
    .map((line) => stripMarkdown(line).trim())
    .find((line) => line.length > 0);

  if (firstLine && firstLine === frontmatterTitle) {
    return file.basename;
  }

  return frontmatterTitle;
}
