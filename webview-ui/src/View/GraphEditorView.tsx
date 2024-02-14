import React, { useEffect, useCallback, useRef } from 'react';
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
} from 'reactflow';
import { vscode } from '../utilities/vscode';
import { ThemeMode, GraphEditorData, useStore } from '../Data/GraphEditorData';
import { FunctionNode } from './FunctionNode';

import 'reactflow/dist/style.css';
import './GraphEditorView.css';

const selector = (data: GraphEditorData) => ({
    themeMode: data.themeMode,
    nodes: data.nodes,
    edges: data.edges,
    viewport: data.viewport,
    selectedNodes: data.selectedNodes,
    selectedEdges: data.selectedEdges,
    debug: data.debug,

    onNodesChange: data.onNodesChange,
    onEdgesChange: data.onEdgesChange,
    onConnect: data.onConnect,
    setDebug: data.setDebug,
    updateGraph: data.updateGraph,
    createNode: data.createNode,
    updateDocument: data.updateDocument,

    setThemeMode: data.setThemeMode,
    setViewport: data.setViewport,
    setEdgeHightlighted: data.setEdgeHightlighted,
    setSelectedNodes: data.setSelectedNodes,
    setSelectedEdges: data.setSelectedEdges,
});

const nodeTypes = {
    function: FunctionNode
};

export function GraphView() {

    const reactFlow = useReactFlow();

    // graph states
    const { themeMode, nodes, edges, selectedNodes, selectedEdges, viewport, debug, onNodesChange, onEdgesChange, onConnect, setDebug, updateGraph, createNode, updateDocument, setThemeMode, setViewport, setEdgeHightlighted, setSelectedNodes, setSelectedEdges } = useStore(selector);
    const toggleTheme = () => {
        setThemeMode( themeMode === ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light );
    };

    // message processing
    const onDidReceivedMessage = ( vscodeMessage: any ) => {
        const command = vscodeMessage.data.command;
        const data = vscodeMessage.data.data;
        setDebug( command );

        switch( command ) {
            case "alchemy.update_graph":
                updateGraph( data );
                return;
            case "alchemy.create_node":
                createNode( data.template, data.pos );
                return;
        }
    }

    useEffect(() => {
        window.addEventListener( "message", onDidReceivedMessage );
        return () => {
            window.removeEventListener( 'message', onDidReceivedMessage );
        };
    }, []);

    // highlight selected nodes and edges
    useEffect(() => {
        for( let edge of edges ) {
            let connectedToSelectedNode = false;
            for( const selectedNode of selectedNodes ) {
                if( edge.source == selectedNode.id || edge.target == selectedNode.id ) {
                    connectedToSelectedNode = true;
                    break;
                }
            }

            setEdgeHightlighted( edge.id, connectedToSelectedNode );
        }
    }, [selectedNodes]);

    useEffect(() => {
        for( const selectedEdge of selectedEdges ) {
            setEdgeHightlighted( selectedEdge.id, true );
        }
    }, [selectedEdges])

    const onChange = useCallback((selectedChange: OnSelectionChangeParams) => {
        setSelectedNodes( selectedChange.nodes );
        setSelectedEdges( selectedChange.edges );
    }, []);
    
    useOnSelectionChange({ onChange });

    // drop handler for creating new node
    const onDragOver = ( event: React.DragEvent ) => {
        if( event.button == 0 )
        {
            event.preventDefault();
        }
    }

    const onDrop = ( event: React.DragEvent ) => {
        const nodeTemplateUri = event.dataTransfer.getData( "text/uri-list");
        if( nodeTemplateUri.length == 0 )
            return;

        const pos = reactFlow.screenToFlowPosition( { x: event.screenX, y: event.screenY } );

        const message = {
            command: "alchemy.query_node_template",
            data: {
                templateUri: nodeTemplateUri,
                pos: pos
            }
        };

        vscode.postMessage( message );

        console.debug( "alchemy.query_node_template: " + nodeTemplateUri + " " + pos.x + " " + pos.y );

        setDebug( JSON.stringify( message, null, '\t' ) );
    }

    // update viewport from document
    useEffect(() => {
        if( typeof viewport !== 'undefined' )
            reactFlow.setViewport( viewport );
    }, [viewport]);

    // fitview to selected nodes or all nodes
    // hotkey: F
    const fitViewOptions: FitViewOptions = {
        duration: 200,
        nodes: selectedNodes.length > 0 ? selectedNodes : nodes
    }
    const fitViewKeyPressed = useKeyPress( "f" );
    useEffect(() => {
        reactFlow.fitView( fitViewOptions );    
    },[fitViewKeyPressed])

    return (
        <ReactFlow
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodesDelete={updateDocument}
            onNodeDragStop={updateDocument}
            onConnect={onConnect}
            onEdgesDelete={updateDocument}

            snapToGrid={true}
            snapGrid={[20, 20]}
            panOnDrag={[2]}
            selectionOnDrag={true}
            selectionMode={SelectionMode.Full}
            zoomOnDoubleClick={true}
            connectionRadius={16}
            deleteKeyCode="Delete"
            fitView

            onDrop={onDrop}
            onDragOver={onDragOver}
        >
            <Panel position="bottom-center">
                {debug}
            </Panel>
            <MiniMap zoomable pannable/>
            <Controls fitViewOptions={fitViewOptions} />
            <Background variant={BackgroundVariant.Lines} gap={20} color="steelblue" />
        </ReactFlow>
    );
}