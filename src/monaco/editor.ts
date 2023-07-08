import { monaco } from '../../monacobundle/monaco.bundle.js';

import editorWorker from '!raw-loader!../../monacobundle/editor.worker.bundle.js';
import jsonWorker from '!raw-loader!../../monacobundle/json.worker.bundle.js';
import tsWorker from '!raw-loader!../../monacobundle/ts.worker.bundle.js';
// import htmlWorker from '!raw-loader!../../monacobundle/html.worker.bundle.js';
// import cssWorker from '!raw-loader!../../monacobundle/css.worker.bundle.js';

import IStandaloneEditorConstructionOptions = monaco.editor.IStandaloneEditorConstructionOptions;

function createBlobURL(code: string) {
    const blob = new Blob([code], { type: 'application/javascript' })
    return URL.createObjectURL(blob)
}

export function setEnvironment() {
    (window).MonacoEnvironment = {
        getWorker: function (workerId, label) {
            let blob;
            if (label === "json") {
                blob = createBlobURL(jsonWorker);
            } else 
            // if (label === 'css' || label === 'scss' || label === 'less') {
            //     blob = createBlobURL(cssWorker);
            // } else
            // if (label === 'html' || label === 'handlebars' || label === 'razor') {
            //     blob = createBlobURL(htmlWorker);
            // } else 
            if (label === "typescript" || label === "javascript") {
                blob = createBlobURL(tsWorker);
            } else {
                blob = createBlobURL(editorWorker);
            }
            return new Worker(blob, { name: label });
        },
        createTrustedTypesPolicy: () => null
    };
}

export function createEditor(root: HTMLElement) {
    // extra libraries
    const libSource = [
        "declare class CustomClass {",
        "    static hello():string",
        "}",
    ].join("\n");
    const libUri = "ts:filename/CustomClass.d.ts";
    monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri);
    monaco.editor.createModel(libSource, "typescript", monaco.Uri.parse(libUri));

    const editorInstance = monaco.editor.create(root, <IStandaloneEditorConstructionOptions>{
        value: 'const v = 1;\nCustomClass.hello();',
        language: 'typescript',
        quickSuggestions: true,
        fontSize: 16,
        automaticLayout: true,
        wrappingIndent: 'indent'
    });

    return editorInstance;
}
