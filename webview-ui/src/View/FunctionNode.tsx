
import { FunctionComponent, useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { vscode } from '../utilities/vscode';

import { ParameterData, ReturnValueData, FunctionNodeData } from '../Data/FunctionNodeData'
import { useStore } from '../Data/GraphEditorData'
import './FunctionNode.css';

const ParameterPin: FunctionComponent<ParameterData> = ({ name, type, value }) => {
    return (
        <div className="parameter-pin">
            <Handle type="target" position={Position.Left} id={name}/>
            <div className="parameter-pin__text">
                {
                    name + ( ( typeof value === "number") ? ( "=" + value ) : "" )
                }
            </div>
        </div>
    );
}

const ReturnValuePin: FunctionComponent<ReturnValueData> = ({ name, type, value }) => {
    return (
        <div className="return-value-pin">
            <div className="return-value-pin__text">
                {
                    ( ( typeof value === "number") ? ( value + "=" ) : "" ) + name
                }
            </div>
            <Handle type="source" position={Position.Right} id={name}/>
        </div>
    );
};

function FunctionNode( {id, selected, data}: NodeProps<FunctionNodeData> ) {

    const setName = useStore((state) => state.setFunctionNodeName);
    const setDescription = useStore((state) => state.setFunctionNodeDescription);
    const setParameters = useStore((state) => state.setFunctionNodeParameters);
    const setReturnValues = useStore((state) => state.setFunctionNodeReturnValues);

    const nodeRef = useRef<HTMLDivElement>( null );
    const nameInputRef = useRef<HTMLInputElement>( null );

    // dynamic name input width
    useLayoutEffect( () => {
        if( nameInputRef.current ) {
            nameInputRef.current.style.width = `${nameInputRef.current.value.length + 1}ch`
        }
    }, [data.name.length]);

    const selectedStyle = { border: "2px solid red" };
    const unselectedStyle = { border: "2px solid silver" };

    const onDoubleClick = () => {
        vscode.postMessage( {
            command: "alchemy.open_node_template",
            data: data.templateUri
        });
    };

    return (
        <div className="function-node"
            ref={nodeRef}
            style={selected ? selectedStyle : unselectedStyle}
            onDoubleClick={onDoubleClick}
        >
            <div className="function-node__header">
                <input className="function-node__header__name"
                    onChange={(event) => {
                        setName(id, event.target.value)
                    }}
                    value={data.name}
                    ref={nameInputRef}
                />
                <div className="function-node__header__description">
                    {data.description}
                </div>
            </div>
            <div className="function-node__body">
                <div className="function-node__body__parameters">
                    {
                        data.parameters.map((parameterData, index) => {
                            return <ParameterPin
                                key={id + index}
                                name={parameterData.name}
                                type={parameterData.type}
                                value={parameterData.value}
                            />
                        })
                    }
                </div>
                <div className="function-node__body__separator"></div>
                <div className="function-node__body__return_values">
                    {
                        data.returnValues.map((returnValue, index) => {
                            return <ReturnValuePin
                                key={id + index}
                                name={returnValue.name}
                                type={returnValue.type}
                                value={returnValue.value}
                            />
                        })
                    }
                </div>
            </div>
        </div>
    );
}

export { FunctionNode }