import {
    Node,
    NodeChange,
    OnNodesChange,
    applyNodeChanges,

    Edge,
    EdgeChange,
    OnEdgesChange,
    addEdge,
    applyEdgeChanges,

    Connection,
    OnConnect,

} from 'reactflow';

import { create } from 'zustand';

import { ParameterData, ReturnValueData, FunctionNodeData } from './FunctionNodeData'

import { nodes as initialNodes, edges as initialEdges } from './test_nodes_edges';

export enum ThemeMode {
    Light,
    Dark
};

export type GraphData = {
    themeMode: ThemeMode;
    nodes: Node[];
    edges: Edge[];
    selectedNodes: Node[];
    debug: string;

    setThemeMode: (themeMode: ThemeMode) => void;
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;

    setDebug: ( text: string ) => void;
    updateGraph: ( graphJson: string ) => void;

    setFunctionNodeName: (id: string, name: string) => void;
    setFunctionNodeDescription: (id: string, description: string) => void;
    setFunctionNodeParameters: (id: string, parameters: ParameterData[]) => void;
    setFunctionNodeReturnValues: (id: string, returnValues: ReturnValueData[]) => void;
    setEdgeAnimated: (id: string, animated: boolean) => void;
    setSelectedNodes: (nodes: Node[]) => void;
};

const makeEdgeFromConnection = (connection: Connection): Edge => {
    return {
        id: "e" + connection.source + "@" + connection.sourceHandle + "-" + connection.target + "@" + connection.targetHandle,
        source: connection.source + "",
        sourceHandle: connection.sourceHandle,
        target: connection.target + "",
        targetHandle: connection.targetHandle
    }
}

const useStore = create<GraphData>((set, get) => ({

    themeMode: ThemeMode.Light,
    nodes: [],
    edges: [],
    selectedNodes: [],
    debug: "Debug",

    setThemeMode: (themeMode: ThemeMode) => {
        set({
            themeMode: themeMode
        });
    },
    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes)
        });
    },
    onEdgesChange: (chagnes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(chagnes, get().edges)
        });
    },
    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(
                makeEdgeFromConnection(connection),
                get().edges
            ),
        });
    },

    setDebug: ( text: string ) => {
        set({
            debug: text
        });
    },

    updateGraph: (graphJson: string) => {
        const graphData = JSON.parse( graphJson );
        set({
            nodes: graphData.nodes,
            edges: graphData.edges,
            debug: graphJson,
        });
    },

    setFunctionNodeName: (id: string, name: string) => {
        set({
            nodes: get().nodes.map((node) => {
                if( node.id === id) {
                    node.data = { ...node.data, name };
                }
                return node;
            })
        });
    },
    setFunctionNodeDescription: (id: string, description: string) => {
        set({
            nodes: get().nodes.map((node) => {
                if( node.id === id) {
                    node.data = { ...node.data, description };
                }
                return node;
            })
        });
    },
    setFunctionNodeParameters: (id: string, parameters: ParameterData[]) => {
        set({
            nodes: get().nodes.map((node) => {
                if( node.id === id) {
                    node.data = { ...node.data, parameters };
                }
                return node;
            })
        });
    },
    setFunctionNodeReturnValues: (id: string, returnValues: ReturnValueData[]) => {
        set({
            nodes: get().nodes.map((node) => {
                if( node.id === id) {
                    node.data = { ...node.data, returnValues };
                }
                return node;
            })
        });
    },
    setEdgeAnimated: (id: string, animated: boolean) => {
        set({
            edges: get().edges.map((edge) => {
                if( edge.id === id) {
                    edge.animated = animated;
                }
                return edge;
            })
        });
    },
    setSelectedNodes: (nodes: Node[]) => {
        set({
            selectedNodes: nodes
        });
    },
}));

export { useStore };