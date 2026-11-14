import { useState } from "react";
import type { RepositoryFile } from "../../api/repoChallenges";

interface Tree { name: string; path: string; children: Tree[]; file?: RepositoryFile }
function tree(files: RepositoryFile[]): Tree[] {
  const roots: Tree[] = [];
  for (const file of files) {
    let children = roots;
    const parts = file.path.split("/");
    parts.forEach((name, index) => {
      const path = parts.slice(0, index + 1).join("/");
      let node = children.find(item => item.name === name);
      if (!node) { node = { name, path, children: [] }; children.push(node); }
      if (index === parts.length - 1) node.file = file;
      children = node.children;
    });
  }
  return roots;
}

export function RepositoryFileIcon({ path }: { path: string }) {
  const name = path.endsWith(".py") ? "file_type_python.svg" : /\.(md|markdown)$/i.test(path) ? "file_type_markdown.svg" : "default_file.svg";
  return <img src={`${import.meta.env.BASE_URL}icons/vscode/${name}`} alt="" aria-hidden="true" className="size-4 shrink-0" />;
}

function Chevron({ open }: { open: boolean }) {
  return <svg aria-hidden="true" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={`shrink-0 transition-transform motion-reduce:transition-none ${open ? "rotate-90" : ""}`}><path d="m6 3 5 5-5 5" /></svg>;
}

export default function RepositoryExplorer({ files, contents, active, onOpen, rootName = "repository" }: { files: RepositoryFile[]; contents: Record<string, string>; active: string | null; onOpen: (path: string) => void; rootName?: string }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (path: string) => setCollapsed(previous => { const next = new Set(previous); if (next.has(path)) next.delete(path); else next.add(path); return next; });
  const folderIcon = (open: boolean) => <img src={`${import.meta.env.BASE_URL}icons/vscode/${open ? "default_folder_opened.svg" : "default_folder.svg"}`} alt="" aria-hidden="true" className="size-4 shrink-0" />;
  const render = (nodes: Tree[]) => nodes.map(node => {
    const file = node.file;
    const modified = file && !file.readOnly && contents[file.path] !== file.content;
    const open = !collapsed.has(node.path);
    return <li key={node.path} className="relative before:absolute before:left-0 before:top-[18px] before:w-3 before:border-t before:border-[var(--repo-line)]">
      {!file ? <><button type="button" aria-expanded={open} className="flex min-h-9 w-full items-center gap-1.5 py-2 pl-3 pr-2 text-left text-xs text-[var(--repo-muted)] hover:bg-[#3054ed]/10" onClick={() => toggle(node.path)}><Chevron open={open} />{folderIcon(open)}<span className="truncate">{node.name}</span></button>{open && <ul className="ml-5 border-l border-[var(--repo-line)]">{render(node.children)}</ul>}</> :
        <button data-repository-file={file.path} type="button" aria-current={active === file.path ? "true" : undefined} title={`${file.path}${file.readOnly ? " (read-only)" : modified ? " (modified)" : ""}`} onClick={() => onOpen(file.path)} className={`flex min-h-9 w-full items-center gap-2 border-y border-transparent py-2 pl-4 pr-3 text-left text-xs transition-colors ${active === file.path ? "bg-[#3054ed]/15 shadow-[inset_2px_0_0_#3054ed] text-[var(--text-main)]" : "text-[var(--repo-muted)] hover:bg-[#3054ed]/10"}`}>
          <RepositoryFileIcon path={file.path} /><span className="min-w-0 flex-1 truncate">{node.name}</span>
          {file.readOnly ? <svg aria-label="Read only" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0 opacity-60"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg> : modified ? <span aria-label="Modified" className="size-1.5 shrink-0 rounded-full bg-[#e5ba43]" /> : null}
        </button>}
    </li>;
  });
  const rootOpen = !collapsed.has("");
  return <nav aria-label="Repository files" className="pb-3"><button type="button" aria-expanded={rootOpen} onClick={() => toggle("")} title={rootName} className="flex min-h-10 w-full items-center gap-1.5 px-3 text-left text-[11px] font-semibold text-[var(--text-main)] hover:bg-[#3054ed]/10"><Chevron open={rootOpen} />{folderIcon(rootOpen)}<span className="truncate">{rootName}</span></button>{rootOpen && <ul className="ml-[18px] border-l border-[var(--repo-line)]">{render(tree(files))}</ul>}</nav>;
}
