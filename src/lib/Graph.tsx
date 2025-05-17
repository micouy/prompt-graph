"use client";

import React, { useCallback, useEffect, useRef } from "react";
import {
  Background,
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  FinalConnectionState,
  Edge,
  Node,
  Connection,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import DataNode, { DataNodeData } from "./DataNode";
import PromptNode, { PromptNodeData } from "./PromptNode";

let id = 1;
const getId = () => `${id++}`; // UGH wtf
const nodeOrigin: [number, number] = [0.5, 0];

type MyNode = Node<DataNodeData> | Node<PromptNodeData>;

const nodeTypes = {
  data: DataNode,
  prompt: PromptNode,
};

const AddNodeOnEdgeDrop = () => {
  const reactFlowWrapper = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<MyNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onChange = useCallback(
    (id: string, newData: Partial<DataNodeData> | Partial<PromptNodeData>) => {
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
          } as MyNode;
        })
      );
    },
    [setNodes]
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
      if (!connectionState.isValid) {
        const id = getId();
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        const newNode: MyNode = {
          id,
          type: "prompt",
          dragHandle: ".drag-handle__custom",
          position: screenToFlowPosition({
            x: clientX,
            y: clientY,
          }),
          data: {
            prompt: "",
            output: "",
            processingPromise: null,
            promptVersions: [],
            onChange: (data: Partial<PromptNodeData>) => onChange(id, data),
          },
          origin: [0.5, 0.0],
        };

        setNodes((nds) => [...nds, newNode]);
        setEdges((eds) => [
          ...eds,
          { id, source: connectionState.fromNode?.id, target: id } as Edge,
        ]);
      }
    },
    [setEdges, setNodes, screenToFlowPosition, onChange]
  );

  const onDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const id = getId();

      setNodes((nds) => [
        ...nds,
        {
          id,
          type: "data",
          dragHandle: ".drag-handle__custom",
          data: {
            output: "",
            onChange: (data: Partial<PromptNodeData>) => onChange(id, data),
          },
          position: screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          }),
        } as MyNode,
      ]);
    },
    [setNodes, screenToFlowPosition, onChange]
  );

  useEffect(() => {
    const id = getId();

    setNodes([
      {
        id,
        type: "data",
        dragHandle: ".drag-handle__custom",
        data: {
          output: "",
          onChange: (data: Partial<DataNodeData>) => onChange(id, data),
        },
        position: { x: 0, y: 50 },
      } as MyNode,
    ]);
  }, [setNodes, onChange]);

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
