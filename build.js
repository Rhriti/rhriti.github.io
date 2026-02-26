#!/usr/bin/env node
/**
 * Build script for rhriti.github.io
 * - Scans blogs/*.md -> writes blogs/manifest.json (list of files, newest first by mtime)
 * - Scans projects/*.md (YAML front matter + markdown body) -> writes projects/projects.json
 * Run: node build.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);

// --- Blogs: generate manifest.json (sorted by date, latest first) ---
function parseBlogDate(filePath, content) {
  const raw = content.replace(/^\uFEFF/, '').trim();
  // 1) YAML front matter: date: YYYY-MM-DD or date: "YYYY-MM-DD"
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    const dateLine = fmMatch[1].split(/\r?\n/).find(l => /^\s*date:\s*/i.test(l));
    if (dateLine) {
      const d = dateLine.replace(/^\s*date:\s*['"]?([^'"\s]+)['"]?/i, '$1').trim();
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) return parsed.getTime();
    }
  }
  // 2) Inline "Date-DD/MM/YYYY" or "Date-DD/MM/YY" in first 500 chars
  const inlineMatch = raw.match(/Date[-:\s]*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/i);
  if (inlineMatch) {
    const [, day, month, year] = inlineMatch;
    const y = year.length === 2 ? 2000 + parseInt(year, 10) : parseInt(year, 10);
    const parsed = new Date(y, parseInt(month, 10) - 1, parseInt(day, 10));
    if (!isNaN(parsed.getTime())) return parsed.getTime();
  }
  // 3) Fallback: file mtime
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch (_) {
    return 0;
  }
}

const blogsDir = path.join(ROOT, 'blogs');
if (fs.existsSync(blogsDir)) {
  const blogFiles = fs.readdirSync(blogsDir).filter(f => f.endsWith('.md'));
  const withDates = blogFiles.map(f => {
    const filePath = path.join(blogsDir, f);
    const content = fs.readFileSync(filePath, 'utf8');
    return { name: f, dateMs: parseBlogDate(filePath, content) };
  });
  withDates.sort((a, b) => b.dateMs - a.dateMs); // latest first
  const files = withDates.map(x => x.name);
  fs.writeFileSync(
    path.join(blogsDir, 'manifest.json'),
    JSON.stringify({ files }, null, 2)
  );
  console.log('blogs/manifest.json written, files:', files.length, '(by date, latest first)');
}

// --- Projects: parse .md with front matter -> projects.json ---
function parseFrontMatter(content) {
  content = content.replace(/^\uFEFF/, '').trim();
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  match[1].split(/\r?\n/).forEach(line => {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) meta[m[1].toLowerCase()] = m[2].trim().replace(/^['"]|['"]$/g, '');
  });
  return { meta, body: match[2].trim() };
}

const projectsDir = path.join(ROOT, 'projects');
const projectsOutPath = path.join(ROOT, 'projects', 'projects.json');
if (fs.existsSync(projectsDir)) {
  const projectFiles = fs.readdirSync(projectsDir).filter(f => f.endsWith('.md'));
  const projects = projectFiles.map(f => {
    const raw = fs.readFileSync(path.join(projectsDir, f), 'utf8');
    const { meta, body } = parseFrontMatter(raw);
    return {
      title: meta.title || f.replace('.md', ''),
      link: meta.link || '',
      image: meta.image || null,
      embed: meta.embed || null,
      order: meta.order != null ? parseInt(meta.order, 10) : 999,
      bodyMarkdown: body
    };
  }).sort((a, b) => a.order - b.order);
  projects.forEach(p => delete p.order);
  fs.writeFileSync(projectsOutPath, JSON.stringify(projects, null, 2));
  console.log('projects/projects.json written, projects:', projects.length);
}
