import React, {useEffect, useRef, useState} from 'react';

import ReactFlow, {
    removeElements,
    addEdge,
    MiniMap,
    Controls,
    Background, ReactFlowProvider, isNode, getOutgoers,
} from 'react-flow-renderer';
import uuid from 'react-uuid'
import {Box, Input} from "@chakra-ui/react";
import Sidebar from "./Sidebar";

const generateRootNode = (setText) => {
    const rootNode = {
        id: 'root',
        type: 'input',
        data: {
            label: (
                <>
                    <Input size={"sm"} placeholder={"Корень"} variant='flushed' onInput={(val) => {
                        setText(val.target.value);
                    }}/>
                </>
            ),
        },
        position: {x: 250, y: 0},
    }
    return rootNode;

}

const OverviewFlow = ({update, alts}) => {
    const [elements, setElements] = useState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [elementsData, setElementsData] = useState({});
    const reactFlowWrapper = useRef(null);
    const [updHack,setUpdHack] = useState(0);

    const generateEdge = (startId, endId, defId) => {
        const edgeId = defId ? defId : uuid();
        setUpdHack(updHack+1);
        return {
            id: edgeId.toString(),
            source: startId,
            target: endId,
            arrowHeadType: 'arrowclosed',
        }

    }

    const onLoad = (_reactFlowInstance) => {
        setReactFlowInstance(_reactFlowInstance);
        console.log('flow loaded:', _reactFlowInstance);
        _reactFlowInstance.fitView();
    };

    const onDragOver = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (event) => {
        event.preventDefault();

        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const type = event.dataTransfer.getData('application/reactflow');
        const position = reactFlowInstance.project({
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
        });
        const id = uuid().toString();
        const newNode = {
            id: id,
            type,
            data: {
                label: (
                    <>
                        <Input variant='flushed' size={"sm"} placeholder={"Нода"} onInput={(val) => {
                            elementsData[id] = val.target.value;
                            setElementsData(JSON.parse(JSON.stringify(elementsData)));
                        }}/>
                    </>
                ),
            },
            position,
            style: {
                background: '#D6D5E6',
                color: '#333',
                border: '1px solid #222138',
                width: 180,
            },
        };
        setElements((es) => drawEnd(es.concat(newNode),true));
    };

    const drawEnd = (elems,withoutUpdate) => {
        if(!withoutUpdate){
            withoutUpdate = false;
        }
        if (!reactFlowInstance||!elements||!alts) {
            return elems;
        }
        elems = elems.filter(s=>s?.id?.indexOf("shadow")===-1);
        let leafs = [];
        let maxH = 0;
        elems.forEach(elem=>{
            if(!isNode(elem)||elem.type!="default") {
                return elems;
            }
            if(elem.position?.y>maxH) {
                maxH = elem.position.y;
            }
            const out = getOutgoers(elem, elems);
            if(!out||out.length===0) {
                leafs.push(elem);
            }
        });
        if(leafs.length===0){
            return elems;
        }
        maxH += 210;
        const ends = alts.map((elem,i)=>{
            return {
                id: 'shadow-'+uuid(),
                type: 'output',
                data: { label: elem },
                position: { x: 210*i , y: maxH },
            }
        });
        let endEdge = []
        ends.forEach(end=>{
            leafs.forEach(leaf=>{
                endEdge.push({
                    id:"shadow-"+uuid(),
                    source:leaf.id,
                    target:end.id,
                    animated: true,
                    type:"smoothstep"
                })
            })
        });
        elems = elems.concat(ends);
        elems = elems.concat(endEdge);
        if(!withoutUpdate) {
            setElements(elems);
        }
        return elems;

    }

    useEffect(() => {
        if(!reactFlowInstance){
            return;
        }
        drawEnd(reactFlowInstance.getElements(),false);
    }, [alts, reactFlowInstance,updHack]);

    useEffect(() => {
        update(elements, elementsData)
    }, [elementsData, elements]);

    useEffect(() => {
        setElements([
            ...elements,
            generateRootNode((text) => {
                elementsData["root"] = text;
                setElementsData(JSON.parse(JSON.stringify(elementsData)));
            })
        ]);
    }, [])

    const onElementsRemove = (elementsToRemove) =>
    {
        setElements((els) =>  removeElements(elementsToRemove, els));
        setUpdHack(updHack+1);

    };
    const onConnect = (params) => setElements((els) => addEdge(generateEdge(params.source, params.target, params.id), els));

    return (
        <Box p={"10px"} w={(window.screen.width - 20) + "px"} h={"800px"}>
            <ReactFlowProvider>
                <Box w={"100%"} h={"80%"} ref={reactFlowWrapper}>
                    <ReactFlow
                        elements={elements}
                        onElementsRemove={onElementsRemove}
                        onConnect={onConnect}
                        onLoad={onLoad}
                        snapToGrid={true}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        snapGrid={[15, 15]}
                    >
                        <MiniMap
                            nodeStrokeColor={(n) => {
                                if (n.style?.background) return n.style.background;
                                if (n.type === 'input') return '#0041d0';
                                if (n.type === 'output') return '#ff0072';
                                if (n.type === 'default') return '#1a192b';

                                return '#eee';
                            }}
                            nodeColor={(n) => {
                                if (n.style?.background) return n.style.background;

                                return '#fff';
                            }}
                            nodeBorderRadius={2}
                        />
                        <Controls/>
                        <Background color="#aaa" gap={16}/>
                    </ReactFlow>
                </Box>
                <Box w={"20%"}>
                    <Sidebar/>
                </Box>
            </ReactFlowProvider>
        </Box>
    );
};

export default OverviewFlow;