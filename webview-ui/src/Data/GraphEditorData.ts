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

    XYPosition,
    Viewport

} from 'reactflow';

import { v1 as uuidv1 } from "uuid";
import { create } from 'zustand';

import { ParameterData, ReturnValueData, FunctionNodeData } from './FunctionNodeData'

import { nodes as initialNodes, edges as initialEdges } from './test_nodes_edges';
import { vscode } from "../utilities/vscode";

export enum ThemeMode {
    Light,
    Dark
};

export type GraphEditorData = {
    themeMode: ThemeMode;
    nodes: Node<FunctionNodeData>[];
    edges: Edge[];
    selectedNodes: Node[];
    selectedEdges: Edge[];
    viewport: Viewport;
    debug: string;

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;

    setFunctionNodeName: (id: string, name: string) => void;
    setFunctionNodeDescription: (id: string, description: string) => void;
    setFunctionNodeParameters: (id: string, parameters: ParameterData[]) => void;
    setFunctionNodeReturnValues: (id: string, returnValues: ReturnValueData[]) => void;
    
    updateGraph: ( graphJson: string ) => void;
    createNode: ( nodeTemplateJson: string, pos: XYPosition ) => void;
    updateDocument: () => void;

    setThemeMode: (themeMode: ThemeMode) => void;
    setViewport: (viewport: Viewport) => void;
    setEdgeHightlighted: (id: string, animated: boolean) => void;
    setSelectedNodes: (nodes: Node[]) => void;
    setSelectedEdges: (edges: Edge[]) => void;

    setDebug: ( text: string ) => void;
};

const makeEdgeFromConnection = (connection: Connection, isAnimated: boolean): Edge => {
    return {
        id: "e" + connection.source + "@" + connection.sourceHandle + "-" + connection.target + "@" + connection.targetHandle,
        source: connection.source + "",
        sourceHandle: connection.sourceHandle,
        target: connection.target + "",
        targetHandle: connection.targetHandle,
        animated: isAnimated
    }
}

const useStore = create<GraphEditorData>((set, get) => ({

    themeMode: ThemeMode.Light,
    nodes: [],
    edges: [],
    selectedNodes: [],
    selectedEdges: [],
    viewport: {x: 0, y: 0, zoom: 1},
    debug: "Debug",

    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes)
        });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges)
        });
    },

    onConnect: (connection: Connection) => {

        const selectedSourceOrTarget = get().selectedNodes.find((selectedNode: Node) => {
            return selectedNode.id == connection.source || selectedNode.id == connection.target;
        });

        set({
            edges: addEdge(
                makeEdgeFromConnection(connection, typeof selectedSourceOrTarget !== 'undefined'),
                get().edges
            )
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

    createNode: ( nodeTemplateJson: string, pos: XYPosition ) => {
        const nodeTemplateData = JSON.parse( nodeTemplateJson );

        if( typeof nodeTemplateData != 'object' )
            return;

        const newNode = {
            id: uuidv1(),
            type: "function",
            data: nodeTemplateData,
            position: pos,
        };

        set({
            nodes: get().nodes.concat( newNode )
        });

        get().updateDocument();
    },

    updateGraph: (graphJson: string) => {

        console.debug("OnUpdateGraph");

        if( graphJson.length == 0 )
            return;

        const graphData = JSON.parse( graphJson );
        
        if( typeof graphData !== 'object' )
            return;

        set({
            nodes: typeof graphData.nodes !== 'undefined' ? graphData.nodes : [],
            edges: typeof graphData.edges !== 'undefined' ? graphData.edges : []
        });
    },

    updateDocument: () => {

        const doc = {
            nodes: get().nodes.map(({id, type, data, position}) => ({id, type, data, position})),
            edges: get().edges.map(({id, source, sourceHandle, target, targetHandle}) => ({id, source, sourceHandle, target, targetHandle})),
            viewport: get().viewport
        };

        const docJson = JSON.stringify( doc, null, '\t' );

        vscode.postMessage({
            command: "alchemy.update_document",
            data: docJson
        });

        console.info( "updateDocument: " + docJson );
    },

    setThemeMode: (themeMode: ThemeMode) => {
        set({
            themeMode: themeMode
        });
    },

    setViewport: (viewport: Viewport) => {
        set({
            viewport: viewport
        });
    },

    setEdgeHightlighted: (id: string, animated: boolean) => {
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

    setSelectedEdges: (edges: Edge[]) => {
        set({
            selectedEdges: edges
        })
    },

    setDebug: ( text: string ) => {
        set({
            debug: text
        });
    },
}));

export { useStore };