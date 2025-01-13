import { Observable, fromEvent, map, switchMap  } from 'rxjs';

export class Toolbar {

    private root: HTMLDivElement;

    private saveButton: HTMLButtonElement;
    private loadButton: HTMLButtonElement;
    private exportButton: HTMLButtonElement;
    
    private input: HTMLInputElement;

    public onSave: Observable<Event>;
    public onLoad: Observable<string>;
    public onExport: Observable<void>;

    public onContextMenu: Observable<Event>;

    constructor(target: HTMLElement) {
        this.root = document.createElement("div");
        this.root.className = "toobar";
        target.appendChild(this.root);

        this.onContextMenu = fromEvent(this.root, 'contextmenu');

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

        this.exportButton = document.createElement("button");
        this.exportButton.textContent = "Export";
        this.exportButton.className = "export";
        this.exportButton.setAttribute('disabled', 'true');
        this.root.appendChild(this.exportButton);

        this.onExport = fromEvent<void>(this.exportButton, 'click');
        
        fromEvent(this.exportButton, "click")
            .subscribe(() => {
                console.log('TODO: export functionaluty');
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

    public allowExport(allow: boolean) {
        if (allow) {
            this.exportButton.removeAttribute('disabled');
            this.exportButton.setAttribute('title', 'Export to file');
        } else {
            this.exportButton.setAttribute('disabled','true');
            this.exportButton.setAttribute('title', 'Export is not allowed. Contact with tenant administrator.');
        }
    }

    public allowLoadSave(allow: boolean) {
        if (allow) {
            this.loadButton.removeAttribute('disabled');
            this.saveButton.removeAttribute('disabled');
            this.loadButton.removeAttribute('title');
            this.saveButton.removeAttribute('title');
        } else {
            this.loadButton.setAttribute('disabled', 'true');
            this.saveButton.setAttribute('disabled', 'true');
            this.loadButton.setAttribute('title', 'Report in view mode. Loading enabled in edit mode only');
            this.saveButton.setAttribute('title', 'Report in view mode. Saving enabled in edit mode only');
        }
    }
}