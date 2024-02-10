import { create } from 'zustand';

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
    name: string;
    description: string;
    templateUri: string;
    parameters: ParameterData[];
    returnValues: ReturnValueData[];
}