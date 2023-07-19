import * as echarts from 'echarts';

export class ChartViewer {

    private root: HTMLDivElement;
    private chart: echarts.EChartsType;
    private options: echarts.EChartOption;
    private dataset: echarts.EChartOption.Dataset;

    constructor(target: HTMLElement) {
        this.root = document.createElement("div");
        this.root.className = "viewer";
        target.appendChild(this.root);

        this.chart = echarts.init(this.root);
    }

    public hide(): void {
        this.root.style.display = "none";
    }

    public show(): void {
        this.root.style.display = "block";
    }

    public addDataset(data: echarts.EChartOption.Dataset) {
        this.dataset = data;
        if (this.options) {
            this.options.dataset = data;
        }
    }

    public setOptions(optionConfig: string) {
        try {
            this.options = JSON.parse(optionConfig);
            if (this.dataset) {
                this.options.dataset = [this.dataset];
            }
            this.chart.setOption(this.options);
        } catch (e) {
            console.log('parsing option error', e);
        }
    }

}