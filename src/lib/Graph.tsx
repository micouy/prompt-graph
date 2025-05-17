"use client";

import * as actions from "@/server/actions";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Background,
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import DataNode from "./DataNode";
import PromptNode from "./PromptNode";

const initialNodes = [];

let id = 1;
const getId = () => `${id++}`;
const nodeOrigin = [0.5, 0];

const nodeTypes = {
  data: DataNode,
  prompt: PromptNode,
};

const AddNodeOnEdgeDrop = () => {
  const reactFlowWrapper = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onChange = (id: string, newData: { [key: string]: any }) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== id) {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            ...newData,
          },
        };
      })
    );
  };

  const onConnectEnd = useCallback(
    (event: any, connectionState: any) => {
      // when a connection is dropped on the pane it's not valid

      if (!connectionState.isValid) {
        // we need to remove the wrapper bounds, in order to get the correct position
        const id = getId();
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        const newNode = {
          id,
          type: "prompt",
          position: screenToFlowPosition({
            x: clientX,
            y: clientY,
          }),
          data: {
            label: `Node ${id}`,
            prompt: "",
            processingPromise: null,
            output: "",
            onChange: (data: { data: string }) => onChange(id, data),
          },
          origin: [0.5, 0.0],
        };

        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) =>
          eds.concat({ id, source: connectionState.fromNode.id, target: id })
        );
      }
    },
    [setEdges, setNodes, screenToFlowPosition]
  );

  const onDoubleClick = useCallback(
    (event: any, node: any) => {
      setNodes((nds) => [
        ...nds,
        {
          id: getId(),
          type: "data",
          data: { label: "Node" },
          position: screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          }),
        },
      ]);
    },
    [setNodes, screenToFlowPosition]
  );

  useEffect(() => {
    const id = getId();

    setNodes([
      {
        id,
        type: "data",
        data: {
          label: "Node",
          onChange: (data: { data: string }) => onChange(id, data),
        },
        position: { x: 0, y: 50 },
      },
    ]);
  }, [setNodes]);

  return (
    <div className="wrapper h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onDoubleClick={onDoubleClick}
        nodeTypes={nodeTypes}
        zoomOnDoubleClick={false}
        fitView
        fitViewOptions={{ padding: 2 }}
        nodeOrigin={nodeOrigin}
      >
        <Background />
      </ReactFlow>
    </div>
  );
};

const Graph = () => {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <AddNodeOnEdgeDrop />
      </ReactFlowProvider>
    </div>
  );
};

export default Graph;
