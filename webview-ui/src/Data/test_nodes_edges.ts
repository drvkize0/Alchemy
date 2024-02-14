import { Node, Edge } from "reactflow"

export const nodes: Node[] = [
    {
        id: '1',
        type: 'function',
        data: {
            templateUri: "add.act",
            name: 'add',
            description: 'calculate sum',
            parameters: [
                { name: 'a', type: "int", value: 0 },
                { name: 'b', type: "int", value: 0 }
            ],
            returnValues: [
                { name: 'sum', type: "int", value: 0 }
            ]
        },
        position: { x: 0, y: 0 },
    },
    {
        id: '2',
        type: 'function',
        data: {
            templateUri: "add.act",
            name: 'add',
            description: 'calculate sum',
            parameters: [
                { name: 'a', type: "int", value: 0 },
                { name: 'b', type: "int", value: 0 }
            ],
            returnValues: [
                { name: 'sum', type: "int", value: 0 }
            ]
        },
        position: { x: 200, y: 0 },
    },
    {
        id: '3',
        type: 'function',
        data: {
            templateUri: "add.act",
            name: 'add',
            description: 'calculate sum',
            parameters: [
                { name: 'a', type: "int", value: 0 },
                { name: 'b', type: "int", value: 0 }
            ],
            returnValues: [
                { name: 'sum', type: "int", value: 0 }
            ]
        },
        position: { x: 0, y: 100 },
    }
];

export const edges: Edge[] = [
    {
        id: 'e1@sum-2@a',
        type: 'default',
        source: '1',
        sourceHandle: 'sum',
        target: '2',
        targetHandle: 'a',
    }
];