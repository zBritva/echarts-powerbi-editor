import React  from "react";

import { Monaco } from "./Monaco"
import { useAppSelector } from './redux/hooks'
import { ResourceLoader } from "./resource";

export interface IApplication {
    persistValue: (object: string, property: string, value: string) => void;
    resources: ResourceLoader
    onContextMenu: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
} 

export const Application: React.FC<IApplication> = ({
    persistValue,
    onContextMenu,
    resources
}) => {

    const settings = useAppSelector((state) => state.options.settings);
    const host = useAppSelector((state) => state.options.host);

    if (!settings) {
        return null;
    }

    return (<div
        style={{
            height: "100%",
            width: "100%",
            margin: 0,
            padding: 0
        }}
        onContextMenu={(e) => {
            onContextMenu(e)
            e.preventDefault();
            e.stopPropagation();
        }}
    >
        <Monaco
            onContextMenu={onContextMenu}
            resources={resources}
            onSave={(models) => {
                models.forEach(m => {
                    persistValue(m.object, m.property, m.value);
                })
            }}
            onExport={(value, name) => {
                host.downloadService.exportVisualsContent(value, `${name}.txt`, "*.txt", "Visual content")
            }}
        />
    </div>);
}