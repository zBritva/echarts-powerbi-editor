/* eslint-disable max-lines-per-function */
import React  from "react";
import {
    Tab, Tabs, TabsExpander
} from "@blueprintjs/core";

import * as monaco_bundle from "monaco-bundle";

console.log('monaco', monaco_bundle.monaco);
import { KeyCode, KeyMod, Uri } from "monaco-editor";

import { setupMermaid } from "./monaco/mermaid"

// load the source of webworkers as plain text to wrap them into blob and pass into web worker constructor. see setEnvironment function
const editorWorker = require("!raw-loader!./../monaco-bundle/dist/editor.worker.bundle.js");
const jsonWorker = require("!raw-loader!./../monaco-bundle/dist/json.worker.bundle.js");
// import tsWorker from "!raw-loader!../../monacobundle/ts.worker.bundle.js";
const htmlWorker = require('!raw-loader!./../monaco-bundle/dist/html.worker.bundle.js');
const cssWorker = require('!raw-loader!./../monaco-bundle/dist/css.worker.bundle.js');

import IStandaloneEditorConstructionOptions = monaco_bundle.editor.IStandaloneEditorConstructionOptions;
import IStandaloneCodeEditor = monaco_bundle.editor.IStandaloneCodeEditor;
import { useAppSelector } from "./redux/hooks";
// import { setValue } from "./redux/slice";
import { Toolbar } from "./toolbar";

function createBlobURL(code: string) {
    const blob = new Blob([code], { type: "application/javascript" });
    return URL.createObjectURL(blob);
}

window.MonacoEnvironment = {
    getWorker: function (workerId, label) {
        debugger;
        let blob;
        if (label === "json") {
            blob = createBlobURL(jsonWorker);
        } else
        if (label === 'css' || label === 'scss' || label === 'less') {
            blob = createBlobURL(cssWorker);
        } else
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            blob = createBlobURL(htmlWorker);
        }
        // if (label === "typescript" || label === "javascript") {
        //   blob = createBlobURL(tsWorker);
        // } else
        else {
            blob = createBlobURL(editorWorker);
        }
        return new Worker(blob, { name: label });
    },
    createTrustedTypesPolicy: () => null,
};

export interface IMonaco {
    onSave: (model: {
        object: string,
        property: string,
        value: string
    }[]) => void;
}

export const Monaco: React.FC<IMonaco> = ({
    onSave
}) => {

    const root = React.useRef<HTMLDivElement>();
    const host = useAppSelector((state) => state.options.host);

    const values = useAppSelector((state) => state.options.values);
    const settings = useAppSelector((state) => state.options.settings);
    const [modelNames, setModelNames] = React.useState<string[]>(Object.keys(values));
    const [currentModel, setCurrentModel] = React.useState<string>(""); 

    const editorInstance = React.useRef<IStandaloneCodeEditor>();

    const schemas = React.useMemo<object[]>(() => {
        return [];
    }, []); 

    React.useEffect(() => {
        // window.MonacoEnvironment = {
        //     getWorker: function (workerId, label) {
        //         let blob;
        //         if (label === "json") {
        //             blob = createBlobURL(jsonWorker);
        //         } else
        //         if (label === 'css' || label === 'scss' || label === 'less') {
        //             blob = createBlobURL(cssWorker);
        //         } else
        //         if (label === 'html' || label === 'handlebars' || label === 'razor') {
        //             blob = createBlobURL(htmlWorker);
        //         }
        //         // if (label === "typescript" || label === "javascript") {
        //         //   blob = createBlobURL(tsWorker);
        //         // } else
        //         else {
        //             blob = createBlobURL(editorWorker);
        //         }
        //         return new Worker(blob, { name: label });
        //     },
        //     createTrustedTypesPolicy: () => null,
        // };

        const models = {};

        if (settings.chart.echart.trim()) {
            const value = settings.chart.echart;
            const model = 'echart.json'
            const newModel = monaco_bundle.monaco.editor.createModel(value, "json", Uri.parse(`inmemory://${model}`))
            models[model] = value;
        }
        if (settings.chart.apexcharts.trim()) {
            const value = settings.chart.apexcharts;
            const model = 'apexcharts.json'
            const newModel = monaco_bundle.monaco.editor.createModel(value, "json", Uri.parse(`inmemory://${model}`))
            models[model] = value;
        }
        if (settings.chart.template.trim()) {
            const value = settings.chart.template;
            const model = 'charticulator.json'
            const newModel = monaco_bundle.monaco.editor.createModel(value, "json", Uri.parse(`inmemory://${model}`))
            models[model] = value;
        }
        if (settings.vega.jsonSpec.trim()) {
            const value = settings.vega.jsonSpec;
            const model = 'deneb.json'
            const newModel = monaco_bundle.monaco.editor.createModel(value, "json", Uri.parse(`inmemory://${model}`))
            models[model] = value;
        }
        if (settings.template.chunk0.trim()) {
            const value = settings.template.chunk0
                .concat(settings.template.chunk1)
                .concat(settings.template.chunk2)
                .concat(settings.template.chunk3)
                .concat(settings.template.chunk4)
                .concat(settings.template.chunk5)
                .concat(settings.template.chunk6)
                .concat(settings.template.chunk7)
                .concat(settings.template.chunk8)
                .concat(settings.template.chunk9)
                .concat(settings.template.chunk10)

            const model = 'mermaid.md'
            const newModel = monaco_bundle.monaco.editor.createModel(value, "mermaid", Uri.parse(`inmemory://${model}`))
            models[model] = value;
        }

        setupMermaid(monaco_bundle.monaco);

        debugger;
        // creates instance of editor
        editorInstance.current = monaco_bundle.monaco.editor.create(root.current, {
            quickSuggestions: true,
            fontSize: 16,
            automaticLayout: true,
            wrappingIndent: "indent",
            codeLens: true,
            snippetSuggestions: "inline",
            model: null
        } as IStandaloneEditorConstructionOptions);
        
        configureKeyCombination();
        const names = Object.keys(models);
        setModelNames(names)
        setCurrentModel(names[0]);
    }, []);

    const configureKeyCombination = React.useCallback(() => {
        editorInstance.current.addCommand((KeyMod.CtrlCmd || KeyMod.WinCtrl) | KeyCode.KeyS, () => {
            const value = editorInstance.current.getValue();
            // this.onSaveCallback(value);
        });
    }, [editorInstance]);

    return (<>
        <Toolbar
            onExport={() => {
                const model = monaco_bundle.monaco.editor.getModel(Uri.parse(`inmemory://${currentModel}`))
                const value = model.getValue();
                
            }}
            onLoad={() => {
                //
            }}
            onSave={() => {
                const forsave = modelNames.map(mn => {
                    const model = monaco_bundle.monaco.editor.getModel(Uri.parse(`inmemory://${mn}`))
                    const value = model.getValue();

                    
                    let object = null;
                    switch (mn) {
                        case "echart.json":
                        case "charticulator.json":
                        case "apexcharts.json":
                            object = "chart";
                            break;
                        case "deneb.json":
                            object = "vega";
                            break;
                        case "mermaid.md":
                            object = "vega";
                            break;
                    }
                    let property = null;
                    switch (mn) {
                        case "echart.json":
                            property = "chart";
                            break;
                        case "charticulator.json":
                            property = "template";
                            break;
                        case "apexcharts.json":
                            property = "chart";
                            break;
                        case "deneb.json":
                            property = "jsonSpec";
                            break;
                        case "mermaid.md":
                            property = "chunk{index}";
                            break;
                    }

                    return {
                        object,
                        property,
                        value
                    }
                });

                onSave(forsave);
            }}
        />
        <Tabs id="TabsExample" selectedTabId={currentModel} onChange={(newModel, oldModel, event) => {
            setCurrentModel(newModel as string);
            const model = monaco_bundle.monaco.editor.getModel(Uri.parse(`inmemory://${newModel}`))
            const value = model.getValue();
            editorInstance.current.setModel(model);
            editorInstance.current.setValue(value);
        }}>
            {
                modelNames.map(model => {
                    return (
                        <Tab id={model} title={model} />
                    );
                })
            }
            <TabsExpander />
            {/* <input className="bp5-input" type="text" placeholder="Search..." /> */}
        </Tabs>
        <div style={{height: "100%"}} ref={root}>

        </div>
    </>);
}