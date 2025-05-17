import React, { memo, useEffect, useMemo, useState } from "react";
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  Node,
} from "@xyflow/react";
import * as actions from "@/server/actions";
import { DataNodeData } from "./DataNode";
import useDebounce from "./useDebounce";
import Handlebars from "handlebars";
import Markdown from "react-markdown";
import Debug from "./Debug";

export type PromptNodeData = {
  output: string;
  prompt: string;
  promptVersions: string[];
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

  const [selectedVersionIx, setSelectedVersionIx] = useState<number>(0);

  const { onChange, promptVersions } = data;

  const nodesData = useNodesData<Node<DataNodeData | PromptNodeData>>(
    connections.map((connection) => connection.source)
  );

  const debouncedPrompt = useDebounce(data.prompt, 1000);

  useEffect(() => {
    if (debouncedPrompt === "") {
      return;
    }

    if (promptVersions.includes(debouncedPrompt)) {
      setSelectedVersionIx(promptVersions.indexOf(debouncedPrompt));
      return;
    }

    onChange({
      promptVersions: [...promptVersions, debouncedPrompt],
    });
  }, [debouncedPrompt, promptVersions, onChange]);

  const renderedPrompt = useMemo(() => {
    const template = Handlebars.compile(debouncedPrompt);
    return template({ input: nodesData[0]?.data.output ?? undefined });
  }, [debouncedPrompt, nodesData]);

  useEffect(() => {
    if (promptVersions.length === 0) {
      return;
    }

    onChange({
      prompt: promptVersions[selectedVersionIx],
    });
  }, [selectedVersionIx, promptVersions, onChange]);

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
      <div className="h-4 w-full bg-gray-200 hover:bg-gray-300 cursor-grab active:cursor-grabbing rounded-t drag-handle__custom" />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={connections.length === 0}
        style={{ width: "1rem", height: "1rem" }}
      />

      <Debug data={{ selectedVersionIx, promptVersions }} />

      <div className="p-2">
        <p className="text-lg font-bold text-zinc-700">Prompt</p>
        <div className="flex flex-row items-baseline gap-2">
          <button
            className="bg-gray-200 px-2 py-1 rounded-md text-xs w-fit"
            disabled={selectedVersionIx === 0}
            onClick={() => setSelectedVersionIx(selectedVersionIx - 1)}
          >
            &lt;
          </button>

          <p className="text-xs text-gray-500 w-fit">
            v{selectedVersionIx + 1}
          </p>

          <button
            className="bg-gray-200 px-2 py-1 rounded-md text-xs w-fit"
            disabled={selectedVersionIx >= promptVersions.length - 1}
            onClick={() => setSelectedVersionIx(selectedVersionIx + 1)}
          >
            &gt;
          </button>
        </div>

        <textarea
          className="w-full p-1 border rounded"
          value={data.prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-3">Rendered Prompt</p>
        <div className="select-text cursor-text">
          <Markdown>{renderedPrompt}</Markdown>
        </div>
        <p className="text-xs text-gray-500 mt-3">Output</p>
        <div className="select-text cursor-text">
          <Markdown>
            {data.processingPromise ? "Loading..." : data.output}
          </Markdown>
        </div>
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
