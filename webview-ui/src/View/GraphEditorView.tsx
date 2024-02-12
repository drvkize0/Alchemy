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
} from 'reactflow';

import { ThemeMode, GraphEditorData, useStore } from '../Data/GraphEditorData';
import { FunctionNode } from './FunctionNode';

import 'reactflow/dist/style.css';
import './GraphEditorView.css';

const selector = (data: GraphEditorData) => ({
    themeMode: data.themeMode,
    nodes: data.nodes,
    edges: data.edges,
    selectedNodes: data.selectedNodes,
    debug: data.debug,

    setThemeMode: data.setThemeMode,
    onNodesChange: data.onNodesChange,
    onEdgesChange: data.onEdgesChange,
    onConnect: data.onConnect,
    setDebug: data.setDebug,
    updateGraph: data.updateGraph,
    setSelectedNodes: data.setSelectedNodes,
    setEdgeAnimated: data.setEdgeAnimated
});

const nodeTypes = {
    function: FunctionNode
};

export function GraphView() {
    const { themeMode, nodes, edges, selectedNodes, debug, setThemeMode, onNodesChange, onEdgesChange, onConnect, setDebug, updateGraph, setSelectedNodes, setEdgeAnimated } = useStore(selector);
    const toggleTheme = () => {
        setThemeMode( themeMode === ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light );
    };

    const onDidReceivedMessage = ( vscodeMessage: any ) => {
        const command = vscodeMessage.data.command;
        const data = vscodeMessage.data.data;
        setDebug( command );

        switch( command ) {
            case "alchemy.update_graph":
                updateGraph( data );
                return;
        }
    }

    useEffect(() => {
        window.addEventListener( "message", onDidReceivedMessage );
        window.addEventListener( "drop", onDidDrop );
        return () => {
            window.removeEventListener( "drop", onDidDrop );
            window.removeEventListener( 'message', onDidReceivedMessage );
        };
    }, []);

    useEffect(() => {
        for( let edge of edges ) {
            let connectedToSelectedNode = false;
            for( const selectedNode of selectedNodes ) {
                if( edge.source == selectedNode.id || edge.target == selectedNode.id ) {
                    connectedToSelectedNode = true;
                    break;
                }
            }

            setEdgeAnimated( edge.id, connectedToSelectedNode );
        }
    }, [selectedNodes]);

    const onChange = useCallback((selectedChange: OnSelectionChangeParams) => {
        setSelectedNodes( selectedChange.nodes );
    }, []);
    
    useOnSelectionChange({ onChange });

    const fitViewOptions: FitViewOptions = {
        duration: 200,
        nodes: selectedNodes.length > 0 ? selectedNodes : nodes
    }

    const onDidDrop = (event: DragEvent) => {
        setDebug( JSON.stringify( event.dataTransfer ) );
    };

    const rectFlow = useReactFlow();

    const graphRef = useRef<HTMLDivElement>(null);
    
    const onDragOver = ( event: DragEvent ) => {
        setDebug( "onDragOver: " + JSON.stringify(event ) );
        event.preventDefault();
    }

    const onDrop = ( event: DragEvent ) => {
        setDebug( "onDrop: " + JSON.stringify(event ) );
    }

    useEffect(() => {
        if(graphRef.current) {
            graphRef.current.ondragover = onDragOver;
            graphRef.current.ondrop = onDidDrop;
            setDebug( "useEffect: drag&drop" );
        }
    }, []);

    return (
        <ReactFlow
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            snapToGrid={true}
            snapGrid={[20,20]}
            panOnDrag={[2]}
            selectionOnDrag={true}
            zoomOnDoubleClick={true}
            connectionRadius={15}
            deleteKeyCode="Delete"
            fitView
            ref={graphRef}
        >
            <Panel position="bottom-center">
                {debug}
            </Panel>
            <MiniMap zoomable pannable/>
            <Controls fitViewOptions={fitViewOptions} />
            <Background variant={BackgroundVariant.Lines} gap={20} color="slategray" />
        </ReactFlow>
    );
}