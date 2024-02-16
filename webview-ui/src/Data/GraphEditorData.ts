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
    Viewport,
    NodeSelectionChange,
    EdgeSelectionChange

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
    nodes: Node<FunctionNodeData>[];
    edges: Edge[];
    stateDirty: boolean;
    graphDirty: boolean;
    documentDirty: boolean;
    version: number,

    themeMode: ThemeMode;
    selectedNodes: Node[];
    selectedEdges: Edge[];
    viewport?: Viewport;
    debug: string;

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;

    setFunctionNodeName: (id: string, name: string) => void;
    setFunctionNodeDescription: (id: string, description: string) => void;
    setFunctionNodeParameters: (id: string, parameters: ParameterData[]) => void;
    setFunctionNodeReturnValues: (id: string, returnValues: ReturnValueData[]) => void;

    updateGraph: ( data: string, version: number ) => void;
    createNode: ( nodeTemplateJson: string, pos: XYPosition ) => void;
    setStateDirty: ( value: boolean ) => void;
    setGraphDirty: ( value: boolean ) => void;
    setDocumentDirty: ( value: boolean ) => void;
    updateDocument: () => void;

    setThemeMode: (themeMode: ThemeMode) => void;
    setEdgeHightlighted: (id: string, animated: boolean) => void;
    setSelectedNodes: (nodes: Node[]) => void;
    setSelectedEdges: (edges: Edge[]) => void;
    setViewport: ( viewport: Viewport ) => void;

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

    nodes: [],
    edges: [],
    stateDirty: false,
    graphDirty: false,
    documentDirty: false,
    version: 0,

    themeMode: ThemeMode.Light,
    selectedNodes: [],
    selectedEdges: [],
    viewport: undefined,

    debug: "Debug",

    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes)
        });

        const needUpdateDocument = changes.find((change) => {
            return change.type == "add" || change.type == "remove";
        });

        if( typeof needUpdateDocument !== "undefined" ) {
            get().setDocumentDirty( true );
        }
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges)
        });

        const needUpdateDocument = changes.find((change) => {
            return change.type == "add" || change.type == "remove";
        });

        if( typeof needUpdateDocument !== "undefined" ) {
            get().setDocumentDirty( true );
        }
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

        get().setDocumentDirty( true );
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

        if( typeof nodeTemplateData != 'object' ) {
            return;
        }

        const newNode = {
            id: uuidv1(),
            type: "function",
            data: nodeTemplateData,
            position: pos,
        };

        // console.debug( "created node at x: " + pos.x + " y: " + pos.y + ":\n" + JSON.stringify(newNode, null, '\t' ) );

        set({
            nodes: get().nodes.concat( newNode )
        });

        get().setDocumentDirty( true );
    },

    updateGraph: (content: string, version: number) => {

        if( version <= get().version ) {
            console.debug( "AlchemyClient: update graph failed with version: " + version + "\n" + content );
            return;
        }

        if( content.length == 0 ) {
            set({
                nodes: [],
                edges: [],
                version: version,
                graphDirty: true,
            });
        } else {
            const graphData = JSON.parse( content );
            set({
                nodes: graphData.nodes,
                edges: graphData.edges,
                version: version,
                graphDirty: true,
            });
        }

        console.debug("AlchemyClient: update graph with version: " + version + "\n", content );
    },

    setStateDirty: ( value: boolean ) => {
        set({
            stateDirty: value
        });
    },

    setGraphDirty: ( value: boolean ) => {
        set({
            graphDirty: value
        })
    },

    setDocumentDirty: ( value: boolean ) => {
        set({
            documentDirty: get().documentDirty || value
        });
    },

    updateDocument: () => {

        const newVersion = get().version + 1;

        const doc = {
            nodes: get().nodes.map(({id, type, data, position}) => ({id, type, data, position})),
            edges: get().edges.map(({id, source, sourceHandle, target, targetHandle}) => ({id, source, sourceHandle, target, targetHandle})),
        };

        const content = JSON.stringify( doc );

        set({
            version: newVersion
        })

        set({
            documentDirty: false
        });

        vscode.postMessage({
            command: "alchemy.update_document",
            data: content,
            version: newVersion
        });
    },

    setThemeMode: (themeMode: ThemeMode) => {
        set({
            themeMode: themeMode
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

    setViewport: ( viewport: Viewport ) => {
        set({
            viewport: viewport
        })
    },

    setDebug: ( text: string ) => {
        set({
            debug: text
        });
    },
}));

export { useStore };