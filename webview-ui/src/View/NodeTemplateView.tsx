import { useEffect, useLayoutEffect, useRef } from "react";
import { vscode } from "../utilities/vscode";
import { NodeTemplateViewData, useStore } from "../Data/NodeTemplateViewData";
import { VSCodeDataGrid, VSCodeDataGridCell, VSCodeDataGridRow, VSCodePanelView } from "@vscode/webview-ui-toolkit/react";
import { Uri } from "vscode";

const selector = (data: NodeTemplateViewData) => ({
    nodeTemplates: data.nodeTemplates,
    updateNodeTemplates: data.updateNodeTemplates
});

export function NodeTemplateView() {

    const { nodeTemplates, updateNodeTemplates } = useStore(selector);

    const onDidReceivedMessage = ( vscodeMessage: any ) => {
        const command = vscodeMessage.data.command;
        const data = vscodeMessage.data.data;        
        switch( command ) {
            case "alchemy.update_node_templates":
                updateNodeTemplates( data );
                return;
        }
    }

    useEffect(() => {
        window.addEventListener( "message", onDidReceivedMessage );

        vscode.postMessage({
            command: "alchemy.query_node_templates",
            data: undefined
        });

        return () => {
            window.removeEventListener( 'message', onDidReceivedMessage );
        };
    }, []);

    return (
        <div>
            {
                nodeTemplates.map((name) => {
                    return (
                        <VSCodeDataGrid>
                            <VSCodeDataGridRow
                                draggable={true}
                                onDragStart={(event: React.DragEvent) => {
                                    event.dataTransfer.setData('text/uri-list', "file://alchemy" + name);
                                }}
                                style={{display: "flex", flexDirection: "row", alignItems: "flex-start", width: "90%"}}
                                >

                                <VSCodeDataGridCell
                                    style={{width: "100%"}}
                                >
                                    {name}
                                </VSCodeDataGridCell>

                            </VSCodeDataGridRow>
                        </VSCodeDataGrid>
                    )
                })
            }
        </div>
    );
}