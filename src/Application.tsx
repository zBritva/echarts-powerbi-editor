import React  from "react";

import { Monaco } from "./Monaco"
import { useAppSelector } from './redux/hooks'

export interface IApplication {
    persistValue: (object: string, property: string, value: string) => void;

} 

export const Application: React.FC<IApplication> = ({
    persistValue
}) => {

    const settings = useAppSelector((state) => state.options.settings);

    if (!settings) {
        return null;
    }

    return (<>
        <Monaco onSave={(models) => {
            models.forEach(m => {
                persistValue(m.object, m.property, m.value);
            })
        }}/>
    </>);
}