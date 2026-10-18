import prism from 'prismjs';
import { prismLanguageDependencies, resolvePrismLanguage } from './prism-languages';

prism.manual = true;
const pending = new Map<string, Promise<boolean>>();
let queue: Promise<unknown> = Promise.resolve();

export function loadPrismLanguage(value: string): Promise<boolean> {
  const language = resolvePrismLanguage(value);
  if (language === 'none') return Promise.resolve(false);
  if (pending.has(language)) return pending.get(language)!;
  // Prism grammars mutate shared state; load dependency chains in order.
  const request = queue.then(async () => {
    for (const id of prismLanguageDependencies(language)) {
      if (prism.languages[id]) continue;
      await import(
        /* webpackInclude: /prism-[\w-]+\.js$/ */
        `prismjs/components/prism-${id}.js`
      );
    }
    return !!prism.languages[language];
  });
  pending.set(language, request);
  queue = request.catch(() => undefined);
  void request.catch(() => pending.delete(language));
  return request;
}

export function highlightPrismElement(element: HTMLElement) {
  prism.highlightElement(element);
}
