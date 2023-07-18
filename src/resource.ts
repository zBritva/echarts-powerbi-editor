
// https://raw.githubusercontent.com/apache/echarts-website/asf-site/en/documents/option.json


const resourcesList: Record<string, string> = require("json-loader!../../assets/resources.json");

console.log('resourcesList', resourcesList);

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

    public async load(name: string) {
        const resource = this.resourceKeys.find(r => r === name);

        if (resource && !this.loadedResources.has(name)) {
            const response = await fetch(resourcesList[resource]);
            if (response.status !== 200) {
                return
            }
            const content = await response.json();

            if (content) {
                this.loadedResources.set(name, content);
                console.log('content', content);
            }
        }
    }
}