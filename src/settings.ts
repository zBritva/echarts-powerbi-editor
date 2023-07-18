
"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser  {
    public chart: Chart = new Chart();
    public editor: Editor = new Editor();
}

export class Chart {
    public schema: string = "{}";
}

export class Editor {
    public loadJSONSchema: boolean = false;
}
