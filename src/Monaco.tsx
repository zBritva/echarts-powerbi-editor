/* eslint-disable max-lines-per-function */
import React from "react";
import {
    Tab, Tabs, TabsExpander
} from "@blueprintjs/core";

import * as monaco_bundle from "monaco-bundle";

console.log('monaco', monaco_bundle.monaco);
import { KeyCode, KeyMod, Uri } from "monaco-editor";

import { setupMermaid } from "./monaco/mermaid"

import IStandaloneEditorConstructionOptions = monaco_bundle.editor.IStandaloneEditorConstructionOptions;
import IStandaloneCodeEditor = monaco_bundle.editor.IStandaloneCodeEditor;
import { useAppSelector } from "./redux/hooks";
// import { setValue } from "./redux/slice";
import { Toolbar } from "./toolbar";
import { ResourceLoader } from "./resource";



export interface IMonaco {
    onSave: (model: {
        object: string,
        property: string,
        value: string
    }[]) => void;
    onExport: (value: string, name: string) => void;
    onContextMenu: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    resources: ResourceLoader;
}

export const Monaco: React.FC<IMonaco> = ({
    onSave,
    onExport,
    resources
}) => {

    const root = React.useRef<HTMLDivElement>();

    const values = useAppSelector((state) => state.options.values);
    const settings = useAppSelector((state) => state.options.settings);
    const [modelNames, setModelNames] = React.useState<string[]>(Object.keys(values));
    const [currentModel, setCurrentModel] = React.useState<string>("");

    const editorInstance = React.useRef<IStandaloneCodeEditor>();

    const fileInput = React.useRef<HTMLInputElement>();

    const schemas = React.useMemo<object[]>(() => {
        return [];
    }, []);

    const onSaveHandler = React.useCallback(() => {
        const forSave = modelNames.map(mn => {
            const model = monaco_bundle.monaco.editor.getModel(Uri.parse(`inmemory://${mn}`))
            const value = model.getValue();

            let object = null;
            switch (mn) {
                case "echarts.json":
                case "charticulator.json":
                case "plotly.json":
                case "apexcharts.json":
                    object = "chart";
                    break;
                case "deneb.json":
                    object = "vega";
                    break;
                case "mermaid.md":
                    object = "template";
                    break;
                case "handlebars.hbs":
                    object = "handlebars";
                    break;
            }
            let property = null;
            switch (mn) {
                case "echarts.json":
                    property = "echart";
                    break;
                case "charticulator.json":
                    property = "template";
                    break;
                case "apexcharts.json":
                    property = "apexchart";
                    break;
                case "deneb.json":
                    property = "jsonSpec";
                    break;
                case "mermaid.md":
                    property = "chunk{index}";
                    break;
                case "plotly.json":
                    property = "schema";
                    break;
                case "handlebars.hbs":
                    property = "chunk{index}";
                    break;
            }

            return {
                object,
                property,
                value
            }
        });

        onSave(forSave);
    }, [onSave, modelNames]);

    const onLoadFile = React.useCallback(() => {
        const file = fileInput.current.files[0];
        const reader = new FileReader();
        reader.addEventListener("load", (e) => {
            debugger;
            const text = e.target.result as string;
            try {
                const model = monaco_bundle.monaco.editor.getModel(Uri.parse(`inmemory://${currentModel}`))
                editorInstance.current.setValue(text)
            } catch (e) {
                // setJsonError(true);
            }
        });
        reader.readAsText(file);
    }, [fileInput]);

    React.useEffect(() => {
        (async () => {
            await resources.load("echarts.json");
            await resources.load("plotly.json");
            await resources.load("vega.json");
            await resources.load("vega-lite.json");
            await resources.load("charticulator.json");

            const models = {};

            const schemas = [];

            if (settings.chart.echart.trim() || settings.editor.showAllSettings) {
                const value = settings.chart.echart;
                const model = 'echarts.json'
                const newModel = monaco_bundle.monaco.editor.createModel(value, "json", Uri.parse(`inmemory://${model}`))
                models[model] = value;

                const schema = resources.get(model);
                if (schema) {
                    schemas.push({
                        fileMatch: [`inmemory://${model}`],
                        uri: schema.$schema,
                        schema: schema.option
                    })
                }
            }
            if (settings.chart.apexcharts.trim() || settings.editor.showAllSettings) {
                const value = settings.chart.apexcharts;
                const model = 'apexcharts.json'
                const newModel = monaco_bundle.monaco.editor.createModel(value, "json", Uri.parse(`inmemory://${model}`))
                models[model] = value;
            }
            if (settings.chart.schema.trim() || settings.editor.showAllSettings) {
                const value = settings.chart.schema;
                const model = 'plotly.json'
                const newModel = monaco_bundle.monaco.editor.createModel(value, "json", Uri.parse(`inmemory://${model}`))
                models[model] = value;

                const schema = resources.get(model);
                if (schema) {
                    schemas.push({
                        fileMatch: [`inmemory://${model}`],
                        uri: schema.$schema,
                        schema: schema
                    })
                }
            }
            if (settings.chart.template.trim() || settings.editor.showAllSettings) {
                const value = settings.chart.template;
                const model = 'charticulator.json'
                const newModel = monaco_bundle.monaco.editor.createModel(value, "json", Uri.parse(`inmemory://${model}`))
                models[model] = value;

                const schema = resources.get(model);
                if (schema) {
                    schemas.push({
                        fileMatch: [`inmemory://${model}`],
                        uri: "https://echarts.apache.org/doc/json-schema",
                        schema: schema
                    })
                }
            }
            if (settings.vega.jsonSpec.trim() || settings.editor.showAllSettings) {
                const value = settings.vega.jsonSpec;
                const model = 'deneb.json'
                const newModel = monaco_bundle.monaco.editor.createModel(value, "json", Uri.parse(`inmemory://${model}`))
                models[model] = value;

                const schemaName = settings.vega.provider == "vegaLite" ? "vega.json" : "";
                const schema = resources.get(schemaName);
                if (schema) {
                    schemas.push({
                        fileMatch: [`inmemory://${model}`],
                        uri: schema.$schema,
                        schema: schema
                    })
                }
            }
            if (settings.template.chunk0.trim() || settings.editor.showAllSettings) {
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

            if (settings.handlebars.chunk0.trim() || settings.editor.showAllSettings) {
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

                const model = 'handlebars.hbs'
                const newModel = monaco_bundle.monaco.editor.createModel(value, "mermaid", Uri.parse(`inmemory://${model}`))
                models[model] = value;
            }

            setupMermaid(monaco_bundle.monaco);

            if (monaco_bundle.monaco.languages.json) {
                monaco_bundle.monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                    validate: true,
                    schemas: schemas,
                });
            }

            // creates instance of editor
            editorInstance.current = monaco_bundle.monaco.editor.create(root.current, {
                language: 'json',
                quickSuggestions: true,
                fontSize: 16,
                automaticLayout: true,
                wrappingIndent: "indent",
                codeLens: true,
                snippetSuggestions: "inline",
                model: null,
            } as IStandaloneEditorConstructionOptions);

            configureKeyCombination();
            const names = Object.keys(models);
            setModelNames(names)
            setCurrentModel(names[0]);

            const model = monaco_bundle.monaco.editor.getModel(Uri.parse(`inmemory://${names[0]}`))
            const value = model.getValue();
            editorInstance.current.setModel(model);
            editorInstance.current.setValue(value);
        })();
    }, []);

    const configureKeyCombination = React.useCallback(() => {
        editorInstance.current.addCommand((KeyMod.CtrlCmd || KeyMod.WinCtrl) | KeyCode.KeyS, () => {
            onSaveHandler()
        });
    }, [editorInstance]);

    return (<>
        <Toolbar
            onExport={() => {
                const model = monaco_bundle.monaco.editor.getModel(Uri.parse(`inmemory://${currentModel}`))
                const value = model.getValue();
                onExport(value, currentModel);
            }}
            onLoad={() => {
                fileInput.current?.click();
            }}
            onSave={onSaveHandler}
        />
        <Tabs id="TabsExample" selectedTabId={currentModel} onChange={(newModel, oldModel, event) => {
            setCurrentModel(newModel as string);
            const model = monaco_bundle.monaco.editor.getModel(Uri.parse(`inmemory://${newModel}`))
            if (!model) {
                return;
            }
            const value = model.getValue();
            editorInstance.current.setModel(model);
            editorInstance.current.setValue(value);
        }}>
            {
                modelNames.map((model) => {
                    return (
                        <Tab key={model} id={model} title={model} />
                    );
                })
            }
            <TabsExpander />
            {/* <input className="bp5-input" type="text" placeholder="Search..." /> */}
        </Tabs>
        <div
            style={{ height: "100%" }} ref={root}>
        </div>
        <input
            ref={fileInput}
            type="file"
            id="file-input"
            style={{
                display: "none",
            }}
            onChange={onLoadFile}
        />
    </>);
}