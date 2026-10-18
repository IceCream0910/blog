import components from 'prismjs/components.json';
import getLoader from 'prismjs/dependencies';

type LanguageEntry = { title?: string; alias?: string | string[]; aliasTitles?: Record<string, string> };
const languages = components.languages as Record<string, LanguageEntry>;
const key = (value: string) => value.trim().toLowerCase().replace(/[ _]+/g, '-');
const aliases = new Map<string, string>();
for (const [id, entry] of Object.entries(languages)) {
  if (id === 'meta') continue;
  for (const name of [id, entry.title, ...[entry.alias || []].flat(), ...Object.values(entry.aliasTitles || {})]) {
    if (name) aliases.set(key(name), id);
  }
}
for (const [name, id] of Object.entries({ assembly: 'nasm', shell: 'bash', 'shell-script': 'bash', 'objective-c': 'objectivec', objc: 'objectivec', 'c++': 'cpp', 'c#': 'csharp', 'f#': 'fsharp', 'vb.net': 'vbnet', 'html/xml': 'markup' })) aliases.set(name, id);

export const prismLanguageCount = Object.keys(languages).length - 1;
export function resolvePrismLanguage(value: string) {
  return aliases.get(key(value)) || 'none';
}
export function prismLanguageDependencies(id: string): string[] {
  if (!Object.prototype.hasOwnProperty.call(languages, id) || id === 'meta') return [];
  return getLoader(components, [id]).getIds();
}
