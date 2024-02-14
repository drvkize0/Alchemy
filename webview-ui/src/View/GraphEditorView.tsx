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
    Viewport
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
    selectedNodes: data.selectedNodes,
    selectedEdges: data.selectedEdges,
    viewport: data.viewport,

    onNodesChange: data.onNodesChange,
    onEdgesChange: data.onEdgesChange,
    onConnect: data.onConnect,
    setDebug: data.setDebug,
    updateGraph: data.updateGraph,
    createNode: data.createNode,
    updateDocument: data.updateDocument,

    setThemeMode: data.setThemeMode,
    setEdgeHightlighted: data.setEdgeHightlighted,
    setSelectedNodes: data.setSelectedNodes,
    setSelectedEdges: data.setSelectedEdges,
    setViewport: data.setViewport,

    debug: data.debug,
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
        setDebug(command);

        switch (command) {
            case "alchemy.update_graph":
                updateGraph(data);
                return;
            case "alchemy.create_node":
                createNode(data.template, data.pos);
                return;
        }
    }

    type stateType = {
        documentUri: string
        viewport: Viewport
    };

    const setState = () => {
        const viewport = reactFlow.getViewport();
        vscode.setState({
            viewport: reactFlow.getViewport()
        });
        console.debug("viewport.zoom = " + viewport.zoom);
    }

    useEffect(() => {
        window.addEventListener("message", onDidReceivedMessage);

        const state = vscode.getState() as stateType;
        if (state) {

            vscode.postMessage({
                command: "alchemy.query_document",
                data: undefined
            });

            setViewport(state.viewport);
        }

        return () => {
            window.removeEventListener('message', onDidReceivedMessage);
        };
    }, []);

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

    useLayoutEffect(() => {
        if (typeof viewport !== 'undefined')
            reactFlow.setViewport(viewport);
    }, [viewport])

    const onChange = useCallback((selectedChange: OnSelectionChangeParams) => {
        setSelectedNodes(selectedChange.nodes);
        setSelectedEdges(selectedChange.edges);
    }, []);

    useOnSelectionChange({ onChange });

    // drop handler for creating new node
    // const getChildNodePosition = (event: MouseEvent, parentNode?: Node) => {
    //     const { domNode } = store.getState();

    //     if (
    //         !domNode ||
    //         // we need to check if these properites exist, because when a node is not initialized yet,
    //         // it doesn't have a positionAbsolute nor a width or height
    //         !parentNode?.positionAbsolute ||
    //         !parentNode?.width ||
    //         !parentNode?.height
    //     ) {
    //         return;
    //     }

    //     const panePosition = screenToFlowPosition({
    //         x: event.clientX,
    //         y: event.clientY,
    //     });

    //     // we are calculating with positionAbsolute here because child nodes are positioned relative to their parent
    //     return {
    //         x: panePosition.x - parentNode.positionAbsolute.x + parentNode.width / 2,
    //         y: panePosition.y - parentNode.positionAbsolute.y + parentNode.height / 2,
    //     };
    // };

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

    // fitview to selected nodes or all nodes
    // hotkey: F
    const fitViewOptions: FitViewOptions = {
        duration: 200,
        nodes: selectedNodes.length > 0 ? selectedNodes : nodes
    }
    const fitViewKeyPressed = useKeyPress("f");
    useEffect(() => {
        reactFlow.fitView(fitViewOptions);
    }, [fitViewKeyPressed])

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
            onMoveEnd={setState}

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