"use strict";
// import "../style/visual.scss";
import powerbiVisualsApi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbiVisualsApi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbiVisualsApi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbiVisualsApi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbiVisualsApi.VisualObjectInstance;
import DataView = powerbiVisualsApi.DataView;
import VisualObjectInstanceEnumerationObject = powerbiVisualsApi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbiVisualsApi.extensibility.visual.IVisualHost
import ValueTypeDescriptor = powerbiVisualsApi.ValueTypeDescriptor;
import ISelectionManager = powerbiVisualsApi.extensibility.ISelectionManager;

import { VisualSettings } from "./settings";
import { ResourceLoader } from "./resource";

// import { MonacoEditorWrapper } from "./monaco/editor";
import { Application, IApplication } from "./Application";
import { deepClone, splitToChunks } from "./utils"

import React from "react";
import { createRoot, Root } from "react-dom/client";
import { BlueprintProvider, OverlaysProvider } from "@blueprintjs/core";

import "../style/visual.scss";
import { Provider } from "react-redux";

import { store } from "./redux/store";
import { setDataView, setHost, setMode, setSettings, setViewport } from './redux/slice';

// load the source of webworkers as plain text to wrap them into blob and pass into web worker constructor. see setEnvironment function
import editorWorker from "!raw-loader!./../monaco-bundle/dist/editor.worker.bundle.js";
import jsonWorker from "!raw-loader!./../monaco-bundle/dist/json.worker.bundle.js";
import htmlWorker from '!raw-loader!./../monaco-bundle/dist/html.worker.bundle.js';
import cssWorker from '!raw-loader!./../monaco-bundle/dist/css.worker.bundle.js';
// import tsWorker from "!raw-loader!../../monacobundle/ts.worker.bundle.js";

function createBlobURL(code: string) {
    const blob = new Blob([code], { type: "application/javascript" });
    return URL.createObjectURL(blob);
}

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

export class Visual implements IVisual {
    private target: HTMLElement;
    private options: VisualConstructorOptions;
    private settings: VisualSettings;
    private host: IVisualHost;
    private root: Root;
    private resources: ResourceLoader;
    private selectionManager: ISelectionManager;
    private propertyForPersist: {
        object: string;
        property: string;
    };

    constructor(options: VisualConstructorOptions | undefined) {
        this.options = options;
        this.target = options.element;
        this.host = options.host;

        this.selectionManager = this.host.createSelectionManager();
        this.resources = new ResourceLoader();

        if (document) {
            const reactApplication = React.createElement<IApplication>(Application, {
                key: "root",
                persistValue: (object: string, property: string, value: string) => {
                    this.persistValue(object, property, value);
                },
                resources: this.resources,
                onContextMenu: (e) => {
                    this.selectionManager.showContextMenu(null, {
                        x: e.clientX,
                        y: e.clientY
                    });
                }
            });

            const storeProvider = React.createElement(Provider, {
                store: store,
                key: 'provider',
                children: []
            }, [
                reactApplication
            ]);

            const provider = React.createElement(BlueprintProvider, {
                key: 'provider',
                children: []
            }, [
                storeProvider
            ]);
            const overlay = React.createElement(OverlaysProvider, {
                key: 'overlay',
                children: []
            }, [
                provider
            ]);
            this.root = createRoot(this.target);
            this.root.render(overlay);
        }
    }

    private persistValue(object: string, property: string, value: string) {
        if (property.indexOf("{index}") != -1) {
            const chunks = splitToChunks(value);
            for (const chunk in chunks) {
                this.persistProperty(object, property.replace('{index}', chunk), chunks[chunk]);
            }
        } else {
            this.persistProperty(object, property, value);
        }
    }

    public async update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options.dataViews[0]);
        store.dispatch(setHost(this.host));
        store.dispatch(setMode(options.editMode));
        store.dispatch(setSettings(this.settings));
        store.dispatch(setDataView(deepClone(options.dataViews[0])));
        store.dispatch(setViewport(deepClone(options.viewport)));

        if (this.settings.editor.loadJSONSchema) {
            await this.resources.load("echarts.json");
            await this.resources.load("plotly.json");
            await this.resources.load("vega.json");
            await this.resources.load("vega-lite.json");
            await this.resources.load("charticulator.json");
        }
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return VisualSettings.parse(dataView);
    }

    private persistProperty(object: string, property: string, value: string) {
        const instance: powerbiVisualsApi.VisualObjectInstance = {
            objectName: object,
            selector: undefined,
            properties: {
                [property]: value
            }
        };

        this.host.persistProperties({
            merge: [
                instance
            ]
        });

    }

    private static typeToString(type: ValueTypeDescriptor): string {
        if (type.numeric) {
            return 'number'
        }
        if (type.numeric && type.integer) {
            return 'float';
        }
        if (type.text) {
            return 'ordinal';
        }
        if (type.dateTime || type.duration) {
            return 'time';
        }

        return 'ordinal';
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        if (options.objectName === 'chart') {
            // return <VisualObjectInstance[]>[
            //     {
            //         objectName: options.objectName,
            //         properties: {}
            //     }
            // ];
            return [];
        }
        if (options.objectName === 'vega') {
            // return <VisualObjectInstance[]>[
            //     {
            //         objectName: options.objectName,
            //         properties: {}
            //     }
            // ];
            return [];
        }
        if (options.objectName === 'template') {
            // return <VisualObjectInstance[]>[
            //     {
            //         objectName: options.objectName,
            //         properties: {}
            //     }
            // ];
            return [];
        }
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}