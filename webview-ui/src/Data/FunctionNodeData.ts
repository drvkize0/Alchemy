export type ParameterData = {
    name: string;
    type: string;
    value?: any;
}

export type ReturnValueData = {
    name: string;
    type: string;
    value?: any;
}

export type FunctionNodeData = {
    templateUri: string;
    name: string;
    description: string;
    parameters: ParameterData[];
    returnValues: ReturnValueData[];
}