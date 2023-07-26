















export default class PlotlyJSONSchemaConverter {

    private static convertType(attr: any) {
        if (attr.role === "object") {
            return attr;
        }

        switch (attr.valType) {
            case "string":
            case "boolean":
            case "number":
                return {
                    "type": attr.valType
                }
            case "integer":
            case "angle":
                return {
                    "type": "number"
                };
            case "data_array":
                return {
                    "type": "array"
                };
            case "enumerated":
                return {
                    "type": "enum",
                    "options": attr.values?.join(",")
                };
            case "flaglist":
                return {
                    "type": "enum",
                    "options": attr.flags?.join(","),
                };
            case "any":
            case "color":
            case "colorlist":
            case "info_array":
            case "colorscale":
            case "subplotid":
            default:
                return {
                    type: null
                }
        }
    }

    public static convert(plotlyJsonSchema: string | Record<string, unknown>) {
        let schema: Record<string, unknown>;
        if (typeof plotlyJsonSchema === "string") {
            schema = JSON.parse(plotlyJsonSchema);
        } else {
            schema = plotlyJsonSchema;
        }

        // base schema with main 3 root objects
        const jsonSchema = {
            // eslint-disable-next-line powerbi-visuals/no-http-string
            "$schema": "http://json-schema.org/draft-07/schema#",
            "definitions": {

            },
            "type": "Object",
            "properties": {
                "traces": {
                    "type": "array",
                    "items": {
                        "oneOf": [
                        ]
                    }
                },
                "frames": {
                    "type": ["Object", "Array"],
                    "properties": {
                        
                    }
                },
                "layout": {
                    "type": "Object",
                    "properties": {
                        
                    }
                }
            }
        };

        const traces = Object.keys(typeof schema.traces === "object" ? schema.traces as object : {});

        // add traces
        traces.forEach(trace => {
            jsonSchema.definitions[trace] = {
                "type": "Object",
                "properties": {
                    
                }
            };
            jsonSchema.properties.traces.items.oneOf.push({
                $ref: `#/definitions/${trace}`
            });
        });

        const mapAttributes = (attributes: any) : [string, any][] => {
            const attributesKeys = Object.keys(attributes);

            return attributesKeys.map(attr => {
                if (attributes[attr].role === "object") {

                    const obj = {
                        "type": "Object",
                        "properties": {
                            
                        }
                    };

                    mapAttributes(attributes[attr]).forEach((map) => {
                        const [attr, property] = map;
                        obj.properties[attr] = property;
                    });
                    
                    return [attr, obj]
                }

                return [attr, {
                    "type": this.convertType(attributes[attr])
                }];
            })
        }
        
        traces.forEach(trace => {
            if (typeof (schema.traces as object)[trace] === "object") {
                const traceObj = (schema.traces as object)[trace];
                mapAttributes(traceObj.attributes).forEach((map) => {
                    const [attr, property] = map;
                    jsonSchema.definitions[trace].properties[attr] = property;
                });
                jsonSchema.definitions[trace].properties['type'] = {
                    "const": traceObj.type
                };
            }
        });

        return jsonSchema;
    }

}