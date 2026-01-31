const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const CONTENT_DIR = path.join(process.cwd(), 'content');

function readJSON(filePath) {
  const full = path.join(CONTENT_DIR, filePath);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function readCollectionJson(folder) {
  const dir = path.join(CONTENT_DIR, folder);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    return data;
  });
}

function readMarkdownCollection(folder) {
  const dir = path.join(CONTENT_DIR, folder);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  return files.map(f => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const parsed = matter(raw);
    return {
      slug: f.replace(/\.md$/, ''),
      ...parsed.data,
      content: parsed.content
    };
  });
}

module.exports = {
  getHome: () => readJSON('home.json'),
  getSiteSettings: () => readJSON('siteSettings.json'),
  getServices: () => readCollectionJson('services'),
  getPackages: () => readCollectionJson('packages'),
  getTeam: () => readCollectionJson('team'),
  getWorks: () => readMarkdownCollection('works')
};