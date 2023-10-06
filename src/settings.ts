
"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export type TargetVisual = "echart" | "plotlyjs" | "deneb" | "charticulator"

export class VisualSettings extends DataViewObjectsParser  {
    public chart: Chart = new Chart();
    public vega: Vega = new Vega();
    public editor: Editor = new Editor();
}

export class Chart {
    public echart: string = "{}";
    public schema: string = "{}";
    public template: string = "{}";
}

export class Vega {
    public jsonSpec: string = "{}";
}

export class Editor {
    public loadJSONSchema: boolean = true;
    public jsonSchema: string = "options.json";
    public targetVisual: TargetVisual = "echart"
}
