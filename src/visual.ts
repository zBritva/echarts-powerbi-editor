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

import { MonacoEditorWrapper } from "./monaco/editor";
import { IColumn } from "./data";
import { Toolbar } from "./toolbar";

import "../style/visual.scss";

export class Visual implements IVisual {
    private target: HTMLElement;
    private options: VisualConstructorOptions;
    private settings: VisualSettings;
    private host: IVisualHost;
    private editor: MonacoEditorWrapper;
    private toolbar: Toolbar;
    private resources: ResourceLoader;
    private selectionManager: ISelectionManager;
    private propertyForPersist: {
        object: string;
        propperty: string;
    };

    private previousTargetVisual: string;

    constructor(options: VisualConstructorOptions) {
        this.options = options;
        this.target = options.element;
        this.host = options.host;

        this.selectionManager = this.host.createSelectionManager();

        this.toolbar = new Toolbar(this.target);
        this.editor = new MonacoEditorWrapper(this.target);
        this.editor.hide();
        // this.viewer = new ChartViewer(this.target);

        this.editor.onSave((value) => {
            this.persistProperty(this.propertyForPersist.object, this.propertyForPersist.propperty, value);
        })

        this.resources = new ResourceLoader();

        this.toolbar.onSave.subscribe(() => {
            const value = this.editor.getValue();
            this.persistProperty(this.propertyForPersist.object, this.propertyForPersist.propperty, value);
        }); 

        this.toolbar.onLoad.subscribe((content: string) => {
            if (!content) {
                return;
            }
            this.editor.loadValue(content, true);
        });

        this.toolbar.onContextMenu.subscribe((event: MouseEvent) => {
            this.selectionManager.showContextMenu(null, {
                x: event.clientX,
                y: event.clientY
            });
            event.preventDefault();
            event.stopPropagation();
        });
        
        this.toolbar.onExport.subscribe(() => {
            this.host.downloadService.exportVisualsContent(this.editor.getValue(), 'chart.json', '.json', 'JSON File');
        });

        this.host.downloadService.exportStatus().then((status) => {
            this.toolbar.allowExport(status === powerbiVisualsApi.PrivilegeStatus.Allowed);
        });
    }

    public async update(options: VisualUpdateOptions) {
        console.log('update');
        this.settings = Visual.parseSettings(options.dataViews[0]);

        this.toolbar.allowLoadSave(options.viewMode !== powerbiVisualsApi.ViewMode.View)

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

        // add options for data model
        if (
            ((options.type & VisualUpdateType.All) === VisualUpdateType.All ||
            (options.type & VisualUpdateType.Data) === VisualUpdateType.Data) &&
            targetVisual === "echart"
        ) {
            const columns = this.getColumns(options.dataViews[0]);
            this.editor.setDataModel({
                columns
            });
        }

        if (schema) {
            this.editor.loadValue(schema, targetVisual !== this.previousTargetVisual);
        }

        this.editor.show();
        this.previousTargetVisual = targetVisual;
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
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}