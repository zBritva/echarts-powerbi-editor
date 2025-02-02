import React  from "react";

import { Monaco } from "./Monaco"
import { useAppSelector } from './redux/hooks'
import { ResourceLoader } from "./resource";

export interface IApplication {
    persistValue: (object: string, property: string, value: string) => void;
    resources: ResourceLoader
} 

export const Application: React.FC<IApplication> = ({
    persistValue,
    resources
}) => {

    const settings = useAppSelector((state) => state.options.settings);

    if (!settings) {
        return null;
    }

    return (<>
        <Monaco
            resources={resources}
            onSave={(models) => {
            models.forEach(m => {
                persistValue(m.object, m.property, m.value);
            })
        }}/>
    </>);
}