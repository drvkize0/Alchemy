import { useEffect, useLayoutEffect } from "react";
import { vscode } from "../utilities/vscode";
import { NodeTemplateViewData, useStore } from "../Data/NodeTemplateViewData";
import { VSCodeDataGrid, VSCodeDataGridRow, VSCodePanelView } from "@vscode/webview-ui-toolkit/react";

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
        <VSCodePanelView>
            <VSCodeDataGrid>
            {
                nodeTemplates.map((name) => {
                    return <VSCodeDataGridRow style={{
                        msUserSelect: "none",
                        MozUserSelect: "none",
                        KhtmlUserSelect: "none",
                        WebkitUserSelect: "none",
                        userSelect: "none",
                    }}>{name}</VSCodeDataGridRow>;
                })
            }
            </VSCodeDataGrid>
        </VSCodePanelView>
    );
}