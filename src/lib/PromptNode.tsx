import React, { memo, useEffect, useMemo } from "react";
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  Node,
} from "@xyflow/react";
import * as actions from "@/server/actions";
import Debug from "./Debug";
import { DataNodeData } from "./DataNode";
import useDebounce from "./useDebounce";
import Handlebars from "handlebars";
import Markdown from "react-markdown";

type PromptNodeData = {
  title: string;
  prompt: string;
  output: string;
  lastProcessedPrompt: string | null;
  processingPromise: Promise<string> | null;
  onChange: (newData: Partial<PromptNodeData>) => void;
};

interface PromptNodeProps {
  data: PromptNodeData;
  isConnectable: boolean;
}

const PromptNode = memo(({ data, isConnectable }: PromptNodeProps) => {
  const connections = useNodeConnections({
    handleType: "target",
  });

  const { onChange } = data;

  const nodesData = useNodesData<Node<DataNodeData | PromptNodeData>>(
    connections.map((connection) => connection.source)
  );

  const debouncedPrompt = useDebounce(data.prompt, 1000);

  const renderedPrompt = useMemo(() => {
    const template = Handlebars.compile(debouncedPrompt);
    return template({ input: nodesData[0]?.data.output ?? undefined });
  }, [debouncedPrompt, nodesData]);

  useEffect(() => {
    console.log("SPAWNING");

    if (renderedPrompt === "") {
      return;
    }

    const processingPromise = actions
      .processPrompt(renderedPrompt)
      .then((result) => {
        onChange({
          output: result,
          lastProcessedPrompt: debouncedPrompt,
          processingPromise: null,
        });

        return result;
      });

    onChange({
      processingPromise,
    });
  }, [debouncedPrompt, onChange, renderedPrompt]);

  return (
    <div
      className="rounded-lg bg-lime-100 w-[20rem]"
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div className="h-4 w-full bg-gray-200 hover:bg-gray-300 cursor-grab active:cursor-grabbing rounded-t" />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={connections.length === 0}
        style={{ width: "1rem", height: "1rem" }}
      />

      <div className="p-2">
        <p className="text-lg font-bold text-zinc-700">Prompt</p>

        <div className="font-bold mb-2">{data.title}</div>
        <textarea
          className="nodrag w-full p-1 border rounded"
          value={data.prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-3">Rendered Prompt</p>
        <Markdown>{renderedPrompt}</Markdown>
        <p className="text-xs text-gray-500 mt-3">Output</p>
        <Markdown>
          {data.processingPromise ? "Loading..." : data.output}
        </Markdown>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ width: "1rem", height: "1rem" }}
      />
    </div>
  );
});

PromptNode.displayName = "PromptNode";

export default PromptNode;
