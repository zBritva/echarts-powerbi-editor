import { monaco } from "../../monacobundle/monaco.bundle.js";
import { editor } from "monaco-editor";

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

function createBlobURL(code: string) {
  const blob = new Blob([code], { type: "application/javascript" });
  return URL.createObjectURL(blob);
}

export interface IColumn {
  displayName: string;
  type: string;
}

export interface IDataModel {
  columns: IColumn;
}

export class MonacoEditorWrapper {
  private editorInstance: IStandaloneCodeEditor;
  private root: HTMLElement;
  private data: IDataModel;

  private schemas: object[];

  constructor() {
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
  }

  public createEditor(root: HTMLElement) {
    this.root = root;
    // creates instance of editor
    this.editorInstance = monaco.editor.create(root, {
        language: "json",
        quickSuggestions: true,
        fontSize: 16,
        automaticLayout: true,
        wrappingIndent: "indent",
        model: monaco.editor.createModel("{\n}\n", 'json', "inmemory://inmemory/option.json")
      } as IStandaloneEditorConstructionOptions);
  }

  public addLibrary(content: string, name: string) {
    const libUri = `ts:filename/${name}`;
    monaco.languages.typescript.javascriptDefaults.addExtraLib(content, libUri);
    monaco.editor.createModel(content, "typescript", monaco.Uri.parse(libUri));
  }

  public setupJson(schema: any) {
    this.schemas.push({
      fileMatch: [ 'option.json' ],
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
    this.data = model;
  }
}
