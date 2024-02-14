import { ReactFlowProvider } from 'reactflow';
import { GraphView } from  "./View/GraphEditorView";
import "./GraphEditorMain.css";

export default function GraphEditorMain() {
    return (
        <main>
            <ReactFlowProvider>
                <GraphView />
            </ReactFlowProvider>
        </main>
    );
}
