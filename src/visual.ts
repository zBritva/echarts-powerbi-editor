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
import VisualUpdateType = powerbiVisualsApi.VisualUpdateType;
import ISelectionManager = powerbiVisualsApi.extensibility.ISelectionManager;

import { VisualSettings } from "./settings";
import { ResourceLoader, wrapSchema } from "./resource";

// import { MonacoEditorWrapper } from "./monaco/editor";
import { IColumn } from "./data";
import { Toolbar } from "./toolbar";
import { Application, IApplication } from "./Application";
import { concatChunks, deepClone, splitToChunks } from "./utils"

import React from "react";
import { createRoot, Root } from "react-dom/client";
import { BlueprintProvider, OverlaysProvider } from "@blueprintjs/core";

import "../style/visual.scss";
import { Provider, useDispatch } from "react-redux";

import { store } from "./redux/store";
import { setDataView, setHost, setJsonSchema, setMode, setSettings, setViewport } from './redux/slice';

export class Visual implements IVisual {
    private target: HTMLElement;
    private options: VisualConstructorOptions;
    private settings: VisualSettings;
    private host: IVisualHost;
    // private editor: MonacoEditorWrapper;
    private root: Root;
    private resources: ResourceLoader;
    private selectionManager: ISelectionManager;
    private propertyForPersist: {
        object: string;
        property: string;
    };

    private previousTargetVisual: string;

    constructor(options: VisualConstructorOptions | undefined) {
        this.options = options;
        this.target = options.element;
        this.host = options.host;

        this.selectionManager = this.host.createSelectionManager();

        if (document) {
            const reactApplication = React.createElement<IApplication>(Application, {
                key: "root",
                persistValue: (object: string, property: string, value: string) => {
                    this.persistValue(object, property, value);
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

        // this.editor = new MonacoEditorWrapper(this.target);
        // this.editor.hide();

        // this.editor.onSave((value) => {
        //     this.persistValue(value);
        // })

        // this.resources = new ResourceLoader();

        // this.toolbar.onSave.subscribe(() => {
        //     const value = this.editor.getValue();
        //     this.persistValue(value);
        // }); 

        // this.toolbar.onLoad.subscribe((content: string) => {
        //     if (!content) {
        //         return;
        //     }
        //     this.editor.loadValue(content, true);
        // });

        // this.toolbar.onContextMenu.subscribe((event: MouseEvent) => {
        //     this.selectionManager.showContextMenu(null, {
        //         x: event.clientX,
        //         y: event.clientY
        //     });
        //     event.preventDefault();
        //     event.stopPropagation();
        // });
        
        // this.toolbar.onExport.subscribe(() => {
        //     this.host.downloadService.exportVisualsContent(this.editor.getValue(), 'chart.json', '.json', 'JSON File');
        // });

        // this.host.downloadService.exportStatus().then((status) => {
        //     this.toolbar.allowExport(status === powerbiVisualsApi.PrivilegeStatus.Allowed);
        // });
    }

    private persistValue(object: string, property: string, value: string) {
        if (property.indexOf("{index}") != -1) {
            const chunks = splitToChunks(value);
            for (const chunk in chunks) {
                this.persistProperty(object, property.replace('${index}', chunk), chunks[chunk]);
            }
        } else {
            this.persistProperty(object, property, value);
        }
    }

    public async update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options.dataViews[0]);
        store.dispatch(setMode(options.editMode));
        store.dispatch(setSettings(this.settings));
        store.dispatch(setDataView(deepClone(options.dataViews[0])));
        store.dispatch(setViewport(deepClone(options.viewport)));

        const jsonSchema = this.settings.editor.jsonSchema;

        if (this.settings.editor.loadJSONSchema) {
            await this.resources.load(jsonSchema);
            const schema = this.resources.get(jsonSchema);
            if (schema !== null) {
                store.dispatch(setJsonSchema(wrapSchema(jsonSchema, schema)))
                // this.editor.setupJson();
                // this.editor.setModel(jsonSchema, targetVisual === "handlebars" ? 'svg' : 'json');
            }
        }
        // if (targetVisual === "handlebars") {
        //     this.editor.setModel('svg', 'svg');
        // }
        // if (targetVisual === "mermaidmarkdown" && jsonSchema === 'mermaid') {
        //     this.editor.setModel('mermaid', 'mermaid');
        // }

        // let schema: string = "{}";

        // switch (targetVisual) {
        //     case "plotlyjs":
        //         this.propertyForPersist = {
        //             object: "chart",
        //             property: "schema"
        //         };
        //         schema = this.settings.chart.schema;
        //         break;
        //     case "deneb":
        //         this.propertyForPersist = {
        //             object: "vega",
        //             property: "jsonSpec"
        //         };
        //         schema = this.settings.vega.jsonSpec;
        //         break;
        //     case "charticulator":
        //         this.propertyForPersist = {
        //             object: "chart",
        //             property: "template"
        //         };
        //         schema = this.settings.chart.template;
        //         break;
        //     case "apexcharts":
        //             this.propertyForPersist = {
        //                 object: "chart",
        //                 property: "apexcharts"
        //             };
        //             schema = this.settings.chart.apexcharts;
        //             break;
        //     case "handlebars":
        //             this.propertyForPersist = {
        //                 object: "template",
        //                 property: "chunk${index}"
        //             };
        //             schema = concatChunks(this.settings.template);
        //             break;
        //     case "mermaidmarkdown": 
        //         this.propertyForPersist = {
        //             object: "template",
        //             property: "chunk${index}"
        //         };
        //         schema = concatChunks(this.settings.template);
        //         break;
        //     default:
        //         this.propertyForPersist = {
        //             object: "chart",
        //             property: "echart"
        //         };
        //         schema = this.settings.chart.echart;
        //         break;
        // }

        // // add options for data model
        // if (
        //     ((options.type & VisualUpdateType.All) === VisualUpdateType.All ||
        //     (options.type & VisualUpdateType.Data) === VisualUpdateType.Data) &&
        //     targetVisual === "echart"
        // ) {
        //     const columns = this.getColumns(options.dataViews[0]);
        //     this.editor.configureModel({
        //         columns
        //     });
        // }

        // if (schema) {
        //     this.editor.loadValue(schema, targetVisual !== this.previousTargetVisual);
        // }

        // this.editor.show();
        // this.previousTargetVisual = targetVisual;
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