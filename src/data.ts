export interface IColumn {
    name?: string | undefined;
    type?: 'number' | 'float' | 'int' | 'ordinal' | 'time' | undefined;
    displayName?: string | undefined;
}

export interface IDataModel {
    columns: IColumn[];
}
