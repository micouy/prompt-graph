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

interface VersionControlsProps {
  selectedVersionIx: number;
  totalVersions: number;
  onVersionChange: (newIndex: number) => void;
}

const VersionControls = memo(
  ({
    selectedVersionIx,
    totalVersions,
    onVersionChange,
  }: VersionControlsProps) => (
    <div className="flex flex-row items-baseline gap-2">
      <button
        className="bg-gray-200 px-2 py-1 rounded-md text-xs w-fit"
        disabled={selectedVersionIx === 0}
        onClick={() => onVersionChange(selectedVersionIx - 1)}
      >
        &lt;
      </button>

      <p className="text-xs text-gray-500 w-fit">v{selectedVersionIx + 1}</p>

      <button
        className="bg-gray-200 px-2 py-1 rounded-md text-xs w-fit"
        disabled={selectedVersionIx >= totalVersions - 1}
        onClick={() => onVersionChange(selectedVersionIx + 1)}
      >
        &gt;
      </button>
    </div>
  )
);

VersionControls.displayName = "VersionControls";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
}

const PromptInput = memo(({ value, onChange }: PromptInputProps) => (
  <textarea
    className="w-full p-1 border rounded"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    rows={4}
  />
));

PromptInput.displayName = "PromptInput";

interface OutputDisplayProps {
  renderedPrompt: string;
  output: string;
  isLoading: boolean;
}

const OutputDisplay = memo(
  ({ renderedPrompt, output, isLoading }: OutputDisplayProps) => (
    <>
      <p className="text-xs text-gray-500 mt-3">Rendered Prompt</p>
      <div className="select-text cursor-text">
        <Markdown>{renderedPrompt}</Markdown>
      </div>
      <p className="text-xs text-gray-500 mt-3">Output</p>
      <div className="select-text cursor-text">
        <Markdown>{isLoading ? "Loading..." : output}</Markdown>
      </div>
    </>
  )
);

OutputDisplay.displayName = "OutputDisplay";

const PromptNode = memo(({ data, isConnectable }: PromptNodeProps) => {
  const connections = useNodeConnections({
    handleType: "target",
  });

  const [selectedVersionIx, setSelectedVersionIx] = useState<number>(0);
  const { onChange, promptVersions, prompt } = data;

  const nodesData = useNodesData<Node<DataNodeData | PromptNodeData>>(
    connections.map((connection) => connection.source)
  );

  const {
    debouncedValue: debouncedPrompt,
    overrideDebouncedValue: overrideDebouncedPrompt,
  } = useDebounce(prompt, 1000);

  // Handle prompt version changes
  useEffect(() => {
    if (debouncedPrompt === "") return;

    if (promptVersions.includes(debouncedPrompt)) {
      setSelectedVersionIx(promptVersions.indexOf(debouncedPrompt));
      return;
    }

    onChange({
      promptVersions: [...promptVersions, debouncedPrompt],
    });
  }, [debouncedPrompt, promptVersions, onChange]);

  // Update prompt when version changes
  useEffect(() => {
    if (promptVersions.length === 0) return;

    onChange({
      prompt: promptVersions[selectedVersionIx],
    });
  }, [selectedVersionIx, promptVersions, onChange]);

  // Render the prompt with input data
  const renderedPrompt = useMemo(() => {
    const template = Handlebars.compile(debouncedPrompt);
    return template({ input: nodesData[0]?.data.output ?? undefined });
  }, [debouncedPrompt, nodesData]);

  // Process the prompt
  useEffect(() => {
    if (renderedPrompt === "") return;

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

        <VersionControls
          selectedVersionIx={selectedVersionIx}
          totalVersions={promptVersions.length}
          onVersionChange={(newIndex) => {
            setSelectedVersionIx(newIndex);
            overrideDebouncedPrompt(promptVersions[newIndex]);
          }}
        />

        <PromptInput
          value={prompt}
          onChange={(value) => onChange({ prompt: value })}
        />

        <OutputDisplay
          renderedPrompt={renderedPrompt}
          output={data.output}
          isLoading={!!data.processingPromise}
        />
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
