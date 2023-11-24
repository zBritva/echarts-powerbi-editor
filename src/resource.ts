/* eslint-disable powerbi-visuals/no-http-string */

// https://raw.githubusercontent.com/apache/echarts-website/asf-site/en/documents/option.json


const resourcesList: Record<string, string> = require("json-loader!../../assets/resources.json");

import PlotlyJSONSchemaConverter from "./plotly-schema-converter";

export class ResourceLoader {

    private resourceKeys: string[];

    private loadedResources: Map<string, any>;

    constructor() {
        this.resourceKeys = Object.keys(resourcesList);
        this.resourceKeys.forEach(resource => {
            console.log(resource);
        });

        this.loadedResources = new Map();
    }

    public resources() {
        return this.resourceKeys;
    }

    public get(name) {
        const resource = this.resourceKeys.find(r => r === name);
        if (resource && this.loadedResources.has(name)) {
            return this.loadedResources.get(name);
        }

        return null;
    }

    public async load(name: string): Promise<boolean> {
        const resource = this.resourceKeys.find(r => r === name);

        if (name === 'handlebars') {
            this.loadedResources.set(name, '');
        }

        if (resource && !this.loadedResources.has(name)) {
            const response = await fetch(resourcesList[resource]);
            if (response.status !== 200) {
                return false;
            }
            const content = await response.json();

            if (content) {
                this.loadedResources.set(name, content);
                return true;
            }
        }
    
        return false;
    }
}

export function wrapSchema(name: string, json: Record<string, unknown>): {
    fileMatch: [string];
    $schema: string;
    option: Record<string, unknown>;
} {
    switch (name) {
        case "plotly.js.json": {
            const plotlySchema = PlotlyJSONSchemaConverter.convert(json as Record<string, unknown>);
            return {
                fileMatch: [name],
                $schema:plotlySchema.$schema,
                option: plotlySchema
            };
        }
        case "vega.v5.json":
        case "vega-lite.v5.json":
            return {
                fileMatch: [name],
                $schema: "http://json-schema.org/draft-07/schema#",
                option: json as Record<string, unknown>
            };
        default:
            return {
                fileMatch: [name],
                $schema: typeof json.$schema === "string" ? json.$schema : "",
                option: json.option as Record<string, unknown>
            }
    }
}