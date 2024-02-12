import { create } from 'zustand';

export type NodeTemplateViewData = {
    nodeTemplates: string[];

    updateNodeTemplates: (jsonNodeTemplates: string) => void;
}

const useStore = create<NodeTemplateViewData>((set, get) => ({
    nodeTemplates: [],

    updateNodeTemplates: (jsonNodeTemplates: string ) => {
        const data = JSON.parse( jsonNodeTemplates );
        if( typeof data !== 'object' || data.nodeTemplates === 'undefined' ) {
            return;
        }

        data.nodeTemplates.sort();

        set({
            nodeTemplates: data.nodeTemplates
        });
    }
}));

export { useStore };