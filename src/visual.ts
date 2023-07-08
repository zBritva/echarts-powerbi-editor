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

import { createEditor, setEnvironment } from "./monaco/editor";
import { editor } from "monaco-editor";

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private host: IVisualHost;
    private editor: editor.IStandaloneCodeEditor;

    private appliccationRef: React.RefObject<{
        setOptions: (options: VisualUpdateOptions, settings: VisualSettings) => void;
    }>;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        setEnvironment();

        this.editor = createEditor(this.target);
    }

    public update(options: VisualUpdateOptions) {
        //
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