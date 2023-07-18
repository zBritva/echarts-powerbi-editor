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

import { VisualSettings } from "./settings";
import { ResourceLoader } from "./resource";

import { MonacoEditorWrapper } from "./monaco/editor";

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private host: IVisualHost;
    private editor: MonacoEditorWrapper;
    private resources: ResourceLoader;

    private appliccationRef: React.RefObject<{
        setOptions: (options: VisualUpdateOptions, settings: VisualSettings) => void;
    }>;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;

        this.editor = new MonacoEditorWrapper();
        this.editor.createEditor(this.target);
        this.editor.setupJson({
            properties: {
                p1: {},
            },
            additionalProperties: false,
        })

        this.resources = new ResourceLoader();
    }

    public async update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options.dataViews[0]);

        if (this.settings.editor.loadJSONSchema) {
            await this.resources.load("options.json");
            const schema = this.resources.get("options.json");
            if (schema) {
                this.editor.setupJson(schema);
            }
        }
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return VisualSettings.parse(dataView);
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
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}