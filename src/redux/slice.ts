/* eslint-disable max-lines-per-function */
import powerbiVisualsApi from "powerbi-visuals-api";
import VisualUpdateOptions = powerbiVisualsApi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbiVisualsApi.DataView;
import IVisualHost = powerbiVisualsApi.extensibility.visual.IVisualHost
import ValueTypeDescriptor = powerbiVisualsApi.ValueTypeDescriptor;
import IViewport = powerbiVisualsApi.IViewport;

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { IVisualSettings } from "../settings";
import { ResourceLoader } from "../resource";
import { IColumn } from "../data";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Dataset {

}

export interface VisualState {
    host: IVisualHost;
    options: VisualUpdateOptions;
    settings: IVisualSettings;
    dataset: Dataset;
    dataView: DataView;
    viewport: IViewport;
    template: string;
    mode: powerbi.EditMode;
    resources: ResourceLoader;
    schema: {
        fileMatch: [string];
        $schema: string;
        option: Record<string, unknown>;
    },
    values: {
        [key: string]: string;
    }
}

const initialState: VisualState = {
    host: undefined,
    options: undefined,
    settings: null,
    dataset: {},
    dataView: null,
    viewport: {
        height: 0,
        width: 0
    },
    template: '',
    mode: powerbi.EditMode.Default,
    resources: new ResourceLoader(),
    schema: null,
    values: {},
}


function typeToString(type: ValueTypeDescriptor): string {
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

function getColumns(dataView: DataView) {
    return dataView.metadata.columns.map(col => (<IColumn>{
        displayName: col.displayName,
        type: typeToString(col.type)
    }));
}

export const slice = createSlice({
    name: 'options',
    initialState,
    reducers: {
        setHost: (state, action: PayloadAction<IVisualHost>) => {
            state.host = action.payload
        },
        setViewport: (state, action: PayloadAction<IViewport>) => {
            state.viewport = action.payload
        },
        setDataView: (state, action: PayloadAction<DataView>) => {
            state.dataView = action.payload
        },
        setSettings: (state, action: PayloadAction<IVisualSettings>) => {
            state.settings = action.payload;

            const values = {}
            if (state.settings.chart.echart.trim()) {
                const value = state.settings.chart.echart;
                const model = 'echarts.json'
                values[model] = value;
            }
            if (state.settings.chart.apexcharts.trim()) {
                const value = state.settings.chart.apexcharts;
                const model = 'apexcharts.json'
                values[model] = value;
            }
            if (state.settings.chart.template.trim()) {
                const value = state.settings.chart.template;
                const model = 'charticulator.json'
                values[model] = value;
            }
            if (state.settings.vega.jsonSpec.trim()) {
                const value = state.settings.vega.jsonSpec;
                const model = 'deneb.json'
                values[model] = value;
            }
            if (state.settings.template.chunk0.trim()) {
                const value = state.settings.template.chunk0
                    .concat(state.settings.template.chunk1)
                    .concat(state.settings.template.chunk2)
                    .concat(state.settings.template.chunk3)
                    .concat(state.settings.template.chunk4)
                    .concat(state.settings.template.chunk5)
                    .concat(state.settings.template.chunk6)
                    .concat(state.settings.template.chunk7)
                    .concat(state.settings.template.chunk8)
                    .concat(state.settings.template.chunk9)
                    .concat(state.settings.template.chunk10)
    
                const model = 'mermaid.md'
                values[model] = value;
            }
            state.values = values;
        },
        setValue: (state, action: PayloadAction<{
            model: string,
            value: string
        }>) => {
            state.values[action.payload.model] = action.payload.value;
        },
        setMode: (state, action: PayloadAction<powerbi.EditMode>) => {
            state.mode = action.payload;
        }
    }
})

// Action creators are generated for each case reducer function
export const { setHost, setDataView, setSettings, setViewport, setMode, setValue } = slice.actions

export default slice.reducer