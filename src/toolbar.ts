import { Observable, fromEvent, map, switchMap  } from 'rxjs';

export type ViewState = "Editor" | "Preview";

export class Toolbar {

    private root: HTMLDivElement;

    private saveButton: HTMLButtonElement;
    private loadButton: HTMLButtonElement;
    private preview: HTMLButtonElement;
    
    private input: HTMLInputElement;

    public onSave: Observable<Event>;
    public onLoad: Observable<string>;
    public onPreviewSwitch: Observable<ViewState>;

    constructor(target: HTMLElement) {
        this.root = document.createElement("div");
        this.root.className = "toobar";
        target.appendChild(this.root);

        this.saveButton = document.createElement("button");
        this.saveButton.textContent = "Save";
        this.saveButton.className = "save";
        this.onSave = fromEvent(this.saveButton, 'click');
        this.root.appendChild(this.saveButton);
        
        this.loadButton = document.createElement("button");
        this.loadButton.textContent = "Load";
        this.loadButton.className = "load";
        this.root.appendChild(this.loadButton);
        fromEvent(this.loadButton, "click")
            .subscribe(() => {
                this.input.click();
            });
        
        this.preview = document.createElement("button");
        this.preview.textContent = "Preview";
        this.preview.className = "preview";
        this.root.appendChild(this.preview);
        this.onPreviewSwitch = fromEvent(this.preview, 'click').pipe(map(() => {
            return this.preview.textContent === "Preview" ? "Editor" : "Preview";
        }));

        this.onPreviewSwitch.subscribe(() => {
            this.preview.textContent = this.preview.textContent === "Preview" ? "Editor" : "Preview";
        });

        this.input = document.createElement("input");
        this.input.type = "file";
        this.input.className = "input";
        this.root.appendChild(this.input);
        this.onLoad = fromEvent(this.input, "change")
        .pipe(switchMap (async (event: Event) => {
            const fileList = (event.target as HTMLInputElement).files;
            if (fileList.length) {
                const content = await fileList[0].text();
                return content;
            }
            return null;
        }));
    }

    public switchPreviewSupport(enable: boolean) {
        if (enable) {
            this.preview.style.display = "block";
        } else {
            this.preview.style.display = "none";
        }
    }
}