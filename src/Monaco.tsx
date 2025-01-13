/* eslint-disable max-lines-per-function */
import React  from "react";
import {
    Tab, Tabs, TabsExpander
} from "@blueprintjs/core";

import * as monaco from "monaco-editor"
import { editor, KeyCode, KeyMod } from "monaco-editor";

import { setupMermaid } from "./monaco/mermaid"

// load the source of webworkers as plain text to wrap them into blob and pass into web worker constructor. see setEnvironment function
import editorWorker from "!raw-loader!../../monacobundle/editor.worker.bundle.js";
import jsonWorker from "!raw-loader!../../monacobundle/json.worker.bundle.js";
// import tsWorker from "!raw-loader!../../monacobundle/ts.worker.bundle.js";
import htmlWorker from '!raw-loader!../../monacobundle/html.worker.bundle.js';
import cssWorker from '!raw-loader!../../monacobundle/css.worker.bundle.js';


import IStandaloneEditorConstructionOptions = editor.IStandaloneEditorConstructionOptions;
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import { useAppSelector } from "./redux/hooks";
import { setValue } from "./redux/slice";
import { Toolbar } from "./toolbar";

function createBlobURL(code: string) {
    const blob = new Blob([code], { type: "application/javascript" });
    return URL.createObjectURL(blob);
}

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
        window.MonacoEnvironment = {
            getWorker: function (workerId, label) {
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

        debugger;
        const models = {};

        if (settings.chart.echart.trim()) {
            const value = settings.chart.echart;
            const model = 'echart.json'
            const newModel = editor.createModel(value, "json", monaco.Uri.parse(`inmemory://${model}`))
            models[model] = value;
        }
        if (settings.chart.apexcharts.trim()) {
            const value = settings.chart.apexcharts;
            const model = 'apexcharts.json'
            const newModel = editor.createModel(value, "json", monaco.Uri.parse(`inmemory://${model}`))
            models[model] = value;
        }
        if (settings.chart.template.trim()) {
            const value = settings.chart.template;
            const model = 'charticulator.json'
            const newModel = editor.createModel(value, "json", monaco.Uri.parse(`inmemory://${model}`))
            models[model] = value;
        }
        if (settings.vega.jsonSpec.trim()) {
            const value = settings.vega.jsonSpec;
            const model = 'deneb.json'
            const newModel = editor.createModel(value, "json", monaco.Uri.parse(`inmemory://${model}`))
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
            const newModel = editor.createModel(value, "mermaid", monaco.Uri.parse(`inmemory://${model}`))
            models[model] = value;
        }

        setupMermaid(monaco);

        // creates instance of editor
        editorInstance.current = monaco.editor.create(root.current, {
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
                const model = editor.getModel(monaco.Uri.parse(`inmemory://${currentModel}`))
                const value = model.getValue();
                
            }}
            onLoad={() => {

            }}
            onSave={() => {
                const forsave = modelNames.map(mn => {
                    const model = editor.getModel(monaco.Uri.parse(`inmemory://${mn}`))
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
            const model = editor.getModel(monaco.Uri.parse(`inmemory://${newModel}`))
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