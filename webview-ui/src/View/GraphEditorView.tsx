import React, { useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import {
    Node,
    ReactFlowProvider,
    ReactFlow,
    MiniMap,
    Controls,
    FitViewOptions,
    Panel,
    Background,
    BackgroundVariant,
    useReactFlow,
    useKeyPress,
    useOnSelectionChange,
    OnSelectionChangeParams,
    SelectionMode,
    Viewport,
    useOnViewportChange
} from 'reactflow';
import { vscode } from '../utilities/vscode';
import { ThemeMode, GraphEditorData, useStore } from '../Data/GraphEditorData';
import { FunctionNode } from './FunctionNode';

import 'reactflow/dist/style.css';
import './GraphEditorView.css';
import { FunctionNodeData } from '../Data/FunctionNodeData';

const selector = (data: GraphEditorData) => ({
    
    nodes: data.nodes,
    edges: data.edges,
    verison: data.version,
    stateDirty: data.stateDirty,
    graphDirty: data.graphDirty,
    documentDirty: data.documentDirty,

    themeMode: data.themeMode,
    selectedNodes: data.selectedNodes,
    selectedEdges: data.selectedEdges,
    viewport: data.viewport,

    debug: data.debug,

    onNodesChange: data.onNodesChange,
    onEdgesChange: data.onEdgesChange,
    onConnect: data.onConnect,
    updateGraph: data.updateGraph,
    createNode: data.createNode,
    setStateDirty: data.setStateDirty,
    setGraphDirty: data.setGraphDirty,
    setDocumentDirty: data.setDocumentDirty,
    updateDocument: data.updateDocument,

    setThemeMode: data.setThemeMode,
    setEdgeHightlighted: data.setEdgeHightlighted,
    setSelectedNodes: data.setSelectedNodes,
    setSelectedEdges: data.setSelectedEdges,
    setViewport: data.setViewport,

    setDebug: data.setDebug,
});

const nodeTypes = {
    function: FunctionNode
};

export function GraphView() {

    const reactFlow = useReactFlow();

    // graph states
    const {
        nodes,
        edges,
        verison,
        stateDirty,
        graphDirty,
        documentDirty,
        themeMode,
        selectedNodes,
        selectedEdges,
        viewport,
        debug,
        onNodesChange,
        onEdgesChange,
        onConnect,
        updateGraph,
        createNode,
        setStateDirty,
        setGraphDirty,
        setDocumentDirty,
        updateDocument,
        setThemeMode,
        setEdgeHightlighted,
        setSelectedNodes,
        setSelectedEdges,
        setViewport,
        setDebug
    } = useStore(selector);

    const toggleTheme = () => {
        setThemeMode(themeMode === ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light);
    };

    // message processing
    const onDidReceivedMessage = (vscodeMessage: any) => {
        const command = vscodeMessage.data.command;
        const data = vscodeMessage.data.data;
        const version = vscodeMessage.data.version;
        setDebug(command);

        switch (command) {
            case "alchemy.update_graph":
                updateGraph(data, version);
                return;
            case "alchemy.create_node":
                createNode(data.template, data.pos);;
                return;
        }
    }

    type stateType = {
        documentUri: string
        viewport: Viewport
    };

    const fitViewOptions: FitViewOptions = {
        duration: 200,
        minZoom: 0.5,
        maxZoom: 2.0,
        nodes: selectedNodes.length > 0 ? selectedNodes : nodes
    }

    useEffect(() => {
        window.addEventListener("message", onDidReceivedMessage);

        return () => {
            window.removeEventListener('message', onDidReceivedMessage);
        };
    }, []);

    const onInit = () => {
        vscode.postMessage({
            command: "alchemy.query_document",
            data: undefined,
            version: verison
        });
    }

    useEffect(() => {
        if(documentDirty)
            updateDocument();
    }, [documentDirty])

    useLayoutEffect(() => {
        if( stateDirty ) {
            const state = {
                viewport: reactFlow.getViewport()
            };

            vscode.setState( state );
            console.debug( "AlchemyClient: setState:\n", JSON.stringify( state, null, '\t' ) );
        }
        setStateDirty( false );
    }, [stateDirty])

    // useEffect(() => {
    //     if(typeof viewport != "undefined" ) {
    //         reactFlow.setViewport(viewport);
    //         setStateDirty(true);
    //     }
    // }, [viewport])

    useEffect(() => {
        if( graphDirty ) {
            console.debug( "AlchemyClient: graph dirty: " + graphDirty + " state:\n" + JSON.stringify( vscode.getState(), null, '\t' ) );
            const state = vscode.getState() as stateType;
            if( state && state.viewport ) {
                console.debug( "AlchemyClient: set viewport: " + JSON.stringify( state.viewport, null, '\t' ) );
                
                reactFlow.setViewport(state.viewport);
                vscode.setState({
                    viewport: state.viewport
                });
            } else {
                if( nodes.length > 0 ) {
                    reactFlow.fitView( fitViewOptions );
                    console.debug( "AlchemyClient: fitView: " + JSON.stringify( fitViewOptions, null, '\t' ) );
                    // setStateDirty( true );
                } else {
                    const defaultViewport = {
                        x: 0,
                        y: 0,
                        zoom: 2
                    }
                    console.debug( "AlchemyClient: graph dirty: set default viewport: " + JSON.stringify( defaultViewport, null, '\t' ) );

                    setViewport( defaultViewport );
                    vscode.setState({
                        viewport: defaultViewport
                    });
                }
            }
        }
        
        setGraphDirty(false);

    }, [graphDirty])

    // highlight selected nodes and edges
    useEffect(() => {
        for (let edge of edges) {
            let connectedToSelectedNode = false;
            for (const selectedNode of selectedNodes) {
                if (edge.source == selectedNode.id || edge.target == selectedNode.id) {
                    connectedToSelectedNode = true;
                    break;
                }
            }

            setEdgeHightlighted(edge.id, connectedToSelectedNode);
        }
    }, [selectedNodes]);

    useEffect(() => {
        for (const selectedEdge of selectedEdges) {
            setEdgeHightlighted(selectedEdge.id, true);
        }
    }, [selectedEdges])

    const onChange = useCallback((selectedChange: OnSelectionChangeParams) => {
        setSelectedNodes(selectedChange.nodes);
        setSelectedEdges(selectedChange.edges);
    }, []);

    useOnSelectionChange({ onChange });

    const onDragOver = (event: React.DragEvent) => {
        if (event.button == 0) {
            event.preventDefault();
        }
    }

    const onDrop = (event: React.DragEvent) => {
        const nodeTemplateUri = event.dataTransfer.getData("text/uri-list");
        if (nodeTemplateUri.length == 0)
            return;

        const pos = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY });

        const message = {
            command: "alchemy.query_node_template",
            data: {
                templateUri: nodeTemplateUri,
                pos: pos
            }
        };

        vscode.postMessage(message);

        console.debug("alchemy.query_node_template: " + nodeTemplateUri + " " + pos.x + " " + pos.y);

        setDebug(JSON.stringify(message, null, '\t'));
    }

    const onNodeDoubleClick = (event: React.MouseEvent, node: Node<FunctionNodeData>) => {

        const data = node.data;

        if( typeof data.templateUri === "string" ) {

            const message = {
                command: "alchemy.open_node_template",
                data: data.templateUri
            };
            
            console.debug( "alchemy.open_node_template: ", data.templateUri );
            vscode.postMessage( message );
        } else {
            console.debug( "AlchemyClient: invalid note template uri " + typeof data.templateUri );
        }
    };

    // fitview to selected nodes or all nodes
    // hotkey: F
    const fitViewKeyPressed = useKeyPress("f");
    useEffect(() => {
        if(fitViewKeyPressed) {
            reactFlow.fitView( fitViewOptions );
            // setStateDirty( true );
        }
    }, [fitViewKeyPressed])

    const isFitview = (): boolean => {
        return typeof vscode.getState() === "undefined";
    }

    return (
        <ReactFlow
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            onInit={onInit}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={()=>{setDocumentDirty(true);}}
            onNodeDoubleClick={onNodeDoubleClick}
            onConnect={onConnect}
            onMoveEnd={()=>{setStateDirty(true)}}
            nodeDragThreshold={5}

            snapToGrid={true}
            snapGrid={[20, 20]}
            panOnDrag={[2]}
            selectionOnDrag={true}
            selectionMode={SelectionMode.Full}
            zoomOnDoubleClick={true}
            connectionRadius={16}
            deleteKeyCode="Delete"

            onDrop={onDrop}
            onDragOver={onDragOver}

            nodesFocusable={false}
            edgesFocusable={false}
            defaultViewport={{ x: 0, y: 0, zoom: 2 }}
            fitView={isFitview()}
            fitViewOptions={fitViewOptions}
        >
            <Panel position="bottom-center">
                {debug}
            </Panel>
            <MiniMap zoomable pannable />
            <Controls fitViewOptions={fitViewOptions} />
            <Background variant={BackgroundVariant.Lines} gap={20} color="steelblue" />
        </ReactFlow>
    );
}