import { monaco } from "../../monacobundle/monaco.bundle.js";
import { editor, KeyCode, KeyMod } from "monaco-editor";

// load the source of webworkers as plain text to wrap them into blob and pass into web worker constructor. see setEnvironment function
import editorWorker from "!raw-loader!../../monacobundle/editor.worker.bundle.js";
import jsonWorker from "!raw-loader!../../monacobundle/json.worker.bundle.js";
// import tsWorker from "!raw-loader!../../monacobundle/ts.worker.bundle.js";
// import htmlWorker from '!raw-loader!../../monacobundle/html.worker.bundle.js';
// import cssWorker from '!raw-loader!../../monacobundle/css.worker.bundle.js';

// const optionsSchema = require("json-loader!../../assets/option.json");
// https://raw.githubusercontent.com/apache/echarts-website/asf-site/en/documents/option.json

import IStandaloneEditorConstructionOptions = editor.IStandaloneEditorConstructionOptions;
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

import { IDataModel } from "./../data";

function createBlobURL(code: string) {
    const blob = new Blob([code], { type: "application/javascript" });
    return URL.createObjectURL(blob);
}

export class MonacoEditorWrapper {
    private editorInstance: IStandaloneCodeEditor;
    private root: HTMLElement;
    private data: IDataModel;
    private currentModel: string;

    private schemas: object[];
    private onSaveCallback: (value: string) => void;

    constructor(target: HTMLElement) {
        this.schemas = [];
        window.MonacoEnvironment = {
            getWorker: function (workerId, label) {
                let blob;
                if (label === "json") {
                    blob = createBlobURL(jsonWorker);
                }
                // if (label === 'css' || label === 'scss' || label === 'less') {
                //     blob = createBlobURL(cssWorker);
                // } else
                // if (label === 'html' || label === 'handlebars' || label === 'razor') {
                //     blob = createBlobURL(htmlWorker);
                // } else
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

        this.createEditor(target);
    }

    private configureKeyCombination() {
        this.editorInstance.addCommand((KeyMod.CtrlCmd || KeyMod.WinCtrl) | KeyCode.KeyS, () => {
            const value = this.editorInstance.getValue();
            this.onSaveCallback(value);
        });
    }

    public onSave(callback: (value: string) => void) {
        this.onSaveCallback = callback;
    }

    public loadValue(value: string) {
        const current = this.editorInstance.getValue();
        if (current === "{\n}\n") {
            this.editorInstance.setValue(value);
        }
    }

    public getValue(): string {
        return this.editorInstance.getValue();
    }

    public hide(): void {
        this.root.style.display = "none";
    }

    public show(): void {
        this.root.style.display = "block";
    }

    public createEditor(target: HTMLElement) {
        this.root = document.createElement("div");
        this.root.className = "editor";
        this.root.style.height = "100%";
        target.appendChild(this.root);
        // creates instance of editor
        this.editorInstance = monaco.editor.create(this.root, {
            language: "json",
            quickSuggestions: true,
            fontSize: 16,
            automaticLayout: true,
            wrappingIndent: "indent",
            model: monaco.editor.createModel("{\n}\n", 'json', "inmemory://inmemory/option.json")
        } as IStandaloneEditorConstructionOptions);

        this.configureKeyCombination();
    }

    public addLibrary(content: string, name: string) {
        const libUri = `ts:filename/${name}`;
        monaco.languages.typescript.javascriptDefaults.addExtraLib(content, libUri);
        monaco.editor.createModel(content, "typescript", monaco.Uri.parse(libUri));
    }

    public setModel(model: string) {
        const value = this.editorInstance.getValue();
        const oldModel = this.editorInstance.getModel();
        if (oldModel) {
            oldModel.dispose();
        }
        const newModel = monaco.editor.createModel(value, 'json', `inmemory://inmemory/${model}`)
        this.editorInstance.setModel(newModel);
        this.currentModel = model;
    }

    public setupJson(schema: {
        fileMatch: [string];
        $schema: string;
        option: Record<string, unknown>;
    }) {
        this.schemas.push({
            fileMatch: schema.fileMatch,
            uri: schema.$schema,
            schema: schema.option
        });

        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemas: [
                ...this.schemas
            ],
        });
    }

    public setDataModel(model: IDataModel) {
        const value = this.editorInstance.getValue();
        switch(this.currentModel) {
            case "options.json": {
                    try {
                        const json = JSON.parse(value);
                        json.dataset = {
                            dimensions: [ model.columns.map(col => ({
                                name: col.displayName,
                                type: col.type
                            })) ],
                        };
                        const newValue = JSON.stringify(json, null, ' ');
                        this.editorInstance.setValue(newValue);
                    } catch(e) {
                        console.log('Value parse error', e);
                    }
                }
                break;
            case "plotly.js.json":
            case "vega.v5.json":
            case "vega-lite.v5.json":
                break;
        }
        
    }
}
