import { ReactFlowProvider } from 'reactflow';
import { GraphView } from  "./View/GraphEditorView";
import "./GraphEditor.css";

function GraphEditor() {
    return (
        <main>
            <ReactFlowProvider>
                <GraphView />
            </ReactFlowProvider>
        </main>
    );
}

export default GraphEditor;
