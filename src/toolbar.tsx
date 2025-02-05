import React  from "react";
import {
    Alignment,
    Button,
    Navbar,
} from "@blueprintjs/core";

export interface IToolbarProps {
    onExport: () => void;
    onSave: () => void;
    onLoad: () => void;
}

export const Toolbar: React.FC<IToolbarProps> = ({
    onExport,
    onLoad,
    onSave
}) => {
    return (<>
        <Navbar>
            <Navbar.Group align={Alignment.LEFT}>
                <Navbar.Heading>Visual Editor</Navbar.Heading>
                <Navbar.Divider />
                <Button className="bp5-minimal" icon="saved" text="Save" onClick={() => onSave()} />
                <Button className="bp5-minimal" icon="document" text="Load" onClick={() => onLoad()} />
                <Button className="bp5-minimal" icon="export" text="Export" onClick={() => onExport()} />
            </Navbar.Group>
        </Navbar>
    </>);
}