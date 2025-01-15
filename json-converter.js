/* eslint-disable powerbi-visuals/no-http-string */
/* eslint-disable powerbi-visuals/non-literal-fs-path */
const fs = require("fs");

/**
 * Converts Plotly.js schema to JSON Schema format.
 * @param {Object} plotlySchema - The Plotly.js schema object.
 * @returns {Object} - The JSON Schema object.
 */
function convertPlotlyToJSONSchema(plotlySchema) {
  const jsonSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
      "traces": {
        "type": "object",
        "properties": {
        }
      },
      "layout": {
        "type": "object",
        "properties": {
        }
      },
      "transforms": {
        "type": "object",
        "properties": {
        }
      },
      "frames": {
        "type": "object",
        "properties": {
        }
      },
      "animation": {
        "type": "object",
        "properties": {
        }
      },
      "config": {
        "type": "object",
        "properties": {
        }
      }
    },
  };

  const schema = plotlySchema.schema;

  // convert traces
  for (const [key, value] of Object.entries(schema.traces)) {
    jsonSchema.properties.traces[key] = {
      type: "object",
      properties: {

      }
    };
    for (const [key2, value2] of Object.entries(value.attributes)) {
      jsonSchema.properties.traces[key].properties[key2] = convertAttribute(value2);
    }
  }

  for (const [key, value] of Object.entries(schema.layout.layoutAttributes)) {
    jsonSchema.properties.layout.properties[key] = convertAttribute(value);
  }

  for (const [key, value] of Object.entries(schema.transforms)) {
    jsonSchema.properties.transforms[key] = {
      type: "object",
      properties: {

      }
    };
    for (const [key2, value2] of Object.entries(value.attributes)) {
      jsonSchema.properties.transforms[key].properties[key2] = convertAttribute(value2);
    }
  }

  for (const [key, value] of Object.entries(schema.animation)) {
    jsonSchema.properties.animation.properties[key] = convertAttribute(value);
  }

  for (const [key, value] of Object.entries(schema.config)) {
    jsonSchema.properties.config.properties[key] = convertAttribute(value);
  }

  jsonSchema.properties.frames = {
    type: "array",
    items: {
      type: "object",
      properties: {

      }
    }
  };

  for (const [key, value] of Object.entries(schema.frames.items.frames_entry)) {
    jsonSchema.properties.frames.items.properties[key] = convertAttribute(value);
  }

  return jsonSchema;
}

/**
 * Converts individual Plotly.js schema attributes to JSON Schema format.
 * @param {Object} attribute - Plotly.js attribute object.
 * @returns {Object} - JSON Schema-compliant attribute object.
 */
function convertAttribute(attribute) {
  if (typeof attribute == "string") {
    return {
      "enum": [
        attribute
      ]
    };
  }
  const schemaAttribute = {};

  if (attribute.description) {
    schemaAttribute.description = attribute.description;
  }

  if (attribute.valType) {
    switch (attribute.valType) {
      case "enumerated":
        schemaAttribute.type = "string";
        if (attribute.values) {
          schemaAttribute.enum = attribute.values;
        }
        break;
      case "number":
        schemaAttribute.type = "number";
        if (attribute.min !== undefined) schemaAttribute.minimum = attribute.min;
        if (attribute.max !== undefined) schemaAttribute.maximum = attribute.max;
        break;
      case "integer":
        schemaAttribute.type = "integer";
        if (attribute.min !== undefined) schemaAttribute.minimum = attribute.min;
        if (attribute.max !== undefined) schemaAttribute.maximum = attribute.max;
        break;
      case "boolean":
        schemaAttribute.type = "boolean";
        break;
      case "string":
        schemaAttribute.type = "string";
        break;
      case "any":
        schemaAttribute.type = "object";
        break;
      default:
        schemaAttribute.type = "string"; // Fallback type
    }
  }

  if (attribute.dflt !== undefined) {
    schemaAttribute.default = attribute.dflt;
  }

  if (attribute.role === "object") {
    schemaAttribute.type = "object";
    schemaAttribute.properties = {};
    for (const [subKey, subAttribute] of Object.entries(attribute)) {
      if (typeof subAttribute === "object" && subKey !== "role") {
        schemaAttribute.properties[subKey] = convertAttribute(subAttribute);
      }
    }
  }

  return schemaAttribute;
}

// Example usage
fs.readFile("assets/plot-schema.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading Plotly schema file:", err);
    return;
  }

  const plotlySchema = JSON.parse(data);
  const jsonSchema = convertPlotlyToJSONSchema(plotlySchema);

  fs.writeFile("assets/plotly.json", JSON.stringify(jsonSchema, null, 2), (err) => {
    if (err) {
      console.error("Error writing JSON Schema file:", err);
    } else {
      console.log("JSON Schema has been successfully generated.");
    }
  });
});