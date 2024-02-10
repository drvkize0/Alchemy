import { ReactFlowProvider } from 'reactflow';
import { GraphView } from  "./View/GraphView";
import "./App.css";

function App() {
    return (
        <main>
            <ReactFlowProvider>
                <GraphView />
            </ReactFlowProvider>
        </main>
    );
}

export default App;
