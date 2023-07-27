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

import { VisualSettings } from "./settings";
import { ResourceLoader, wrapSchema } from "./resource";

import { MonacoEditorWrapper } from "./monaco/editor";
import { IColumn, createDataset } from "./data";
import { ChartViewer } from "./viewer";
import { Toolbar } from "./toolbar";

import "../style/visual.scss";

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private host: IVisualHost;
    private editor: MonacoEditorWrapper;
    private viewer: ChartViewer;
    private toolbar: Toolbar;
    private resources: ResourceLoader;
    private propertyForPersist: {
        object: string;
        propperty: string;
    };

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;

        this.toolbar = new Toolbar(this.target);
        this.editor = new MonacoEditorWrapper(this.target);
        this.viewer = new ChartViewer(this.target);

        this.editor.onSave((value) => {
            this.persistProperty(this.propertyForPersist.object, this.propertyForPersist.propperty, value);
        })

        this.resources = new ResourceLoader();

        this.toolbar.onSave.subscribe(() => {
            const value = this.editor.getValue();
            this.persistProperty(this.propertyForPersist.object, this.propertyForPersist.propperty, value);
        });

        this.toolbar.onPreviewSwitch.subscribe((state) => {
            if (state === "Editor") {
                this.viewer.hide();
                this.editor.show();
            }
            if (state === "Preview") {
                const chart = this.editor.getValue();
                this.viewer.setOptions(chart);
                this.editor.hide();
                this.viewer.show();
            }
        });
    }

    public async update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options.dataViews[0]);

        if (this.settings.editor.loadJSONSchema) {
            const jsonSchema = this.settings.editor.jsonSchema;
            await this.resources.load(jsonSchema);
            const schema = this.resources.get(jsonSchema);
            if (schema) {
                this.editor.setupJson(wrapSchema(jsonSchema, schema));
                this.editor.setModel(jsonSchema);
            }
        }

        const targetVisual = this.settings.editor.targetVisual;

        this.toolbar.switchPreviewSupport(targetVisual === "echart");

        let schema: string = "{}";

        switch (targetVisual) {
            case "plotlyjs":
                this.propertyForPersist = {
                    object: "chart",
                    propperty: "schema"
                };
                schema = this.settings.chart.schema;
                break;
            case "deneb":
                this.propertyForPersist = {
                    object: "vega",
                    propperty: "jsonSpec"
                };
                schema = this.settings.vega.jsonSpec;
                break;
            case "charticulator":
                this.propertyForPersist = {
                    object: "chart",
                    propperty: "template"
                };
                schema = this.settings.chart.template;
                break;
            
            case "echart":
            default:
                this.propertyForPersist = {
                    object: "chart",
                    propperty: "echart"
                };
                schema = this.settings.chart.echart;
                break;
        }

        if (schema) {
            this.editor.loadValue(schema);
        }

        if (
            ((options.type & VisualUpdateType.All) === VisualUpdateType.All ||
            (options.type & VisualUpdateType.Data) === VisualUpdateType.Data) &&
            targetVisual === "echart"
        ) {
            const dataset = createDataset(options.dataViews[0]);

            const columns = this.getColumns(options.dataViews[0]);
            this.editor.setDataModel({
                columns
            });

            this.viewer.addDataset(dataset);
            this.viewer.setOptions(schema);
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

    private getColumns(dataView: DataView) {
        return dataView.metadata.columns.map(col => (<IColumn>{
            displayName: col.displayName,
            type: Visual.typeToString(col.type)
        }));
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
            return <VisualObjectInstance[]>[
                {
                    objectName: options.objectName,
                    properties: {}
                }
            ];
        }
        if (options.objectName === 'vega') {
            return <VisualObjectInstance[]>[
                {
                    objectName: options.objectName,
                    properties: {}
                }
            ];
        }
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}