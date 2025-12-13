import dynamic from 'next/dynamic'
import { loadPrismComponentsWithRetry } from '../utils/load-prism-components';

const Code = dynamic(() =>
    import('../packages/notionx/third-party/code').then(async m => {
        // add / remove any prism syntaxes here
        await loadPrismComponentsWithRetry([
            () => import('prismjs/components/prism-markup-templating.js'),
            () => import('prismjs/components/prism-markup.js'),
            () => import('prismjs/components/prism-bash.js'),
            () => import('prismjs/components/prism-c.js'),
            () => import('prismjs/components/prism-cpp.js'),
            () => import('prismjs/components/prism-csharp.js'),
            () => import('prismjs/components/prism-docker.js'),
            () => import('prismjs/components/prism-java.js'),
            () => import('prismjs/components/prism-js-templates.js'),
            () => import('prismjs/components/prism-coffeescript.js'),
            () => import('prismjs/components/prism-diff.js'),
            () => import('prismjs/components/prism-git.js'),
            () => import('prismjs/components/prism-go.js'),
            () => import('prismjs/components/prism-graphql.js'),
            () => import('prismjs/components/prism-handlebars.js'),
            () => import('prismjs/components/prism-less.js'),
            () => import('prismjs/components/prism-makefile.js'),
            () => import('prismjs/components/prism-markdown.js'),
            () => import('prismjs/components/prism-objectivec.js'),
            () => import('prismjs/components/prism-ocaml.js'),
            () => import('prismjs/components/prism-python.js'),
            () => import('prismjs/components/prism-reason.js'),
            () => import('prismjs/components/prism-rust.js'),
            () => import('prismjs/components/prism-sass.js'),
            () => import('prismjs/components/prism-scss.js'),
            () => import('prismjs/components/prism-solidity.js'),
            () => import('prismjs/components/prism-sql.js'),
            () => import('prismjs/components/prism-stylus.js'),
            () => import('prismjs/components/prism-swift.js'),
            () => import('prismjs/components/prism-wasm.js'),
            () => import('prismjs/components/prism-yaml.js'),
        ]);

        return m.Code;
    }),
);
const Collection = dynamic(() =>
    import('../packages/notionx/third-party/collection').then(
        (m) => m.Collection
    )
)
const Equation = dynamic(() =>
    import('../packages/notionx/third-party/equation').then((m) => m.Equation)
)
const Pdf = dynamic(
    () => import('../packages/notionx/third-party/pdf').then((m) => m.Pdf),
    {
        ssr: false
    }
)
const Modal = dynamic(
    () => import('../packages/notionx/third-party/modal').then((m) => m.Modal) as any,
    {
        ssr: false
    }
)

export { Code, Collection, Equation, Pdf, Modal }