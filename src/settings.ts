
"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export type TargetVisual = "echart" | "plotlyjs" | "deneb" | "charticulator" | "handlebars";

export class VisualSettings extends DataViewObjectsParser  {
    public chart: Chart = new Chart();
    public vega: Vega = new Vega();
    public editor: Editor = new Editor();
    public template: Template = new Template();
}

export class Chart {
    public echart: string = "{}";
    public schema: string = "{}";
    public template: string = "{}";
}

export class Vega {
    public jsonSpec: string = "{}";
}

export class Template {
    public chunk0: string = "";
    public chunk1: string = "";
    public chunk2: string = "";
    public chunk3: string = "";
    public chunk4: string = "";
    public chunk5: string = "";
    public chunk6: string = "";
    public chunk7: string = "";
    public chunk8: string = "";
    public chunk9: string = "";
}

export class Editor {
    public loadJSONSchema: boolean = true;
    public jsonSchema: string = "options.json";
    public targetVisual: TargetVisual = "echart"
}
