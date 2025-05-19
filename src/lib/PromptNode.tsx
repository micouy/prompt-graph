import * as actions from "@/server/actions";
import {
  Handle,
  Node,
  Position,
  useNodeConnections,
  useNodesData,
} from "@xyflow/react";
import Handlebars from "handlebars";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import * as uuid from "uuid";
import { DataNodeData } from "./DataNode";
import useDebounce from "./useDebounce";

interface Comment {
  id: string;
  text: string;
  selectedText: string;
}

interface PromptVersion {
  prompt: string;
  comments: Comment[];
}

export type PromptNodeData = {
  output: string;
  prompt: string;
  promptVersions: PromptVersion[];
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
  ),
);

VersionControls.displayName = "VersionControls";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
}

const PromptInput = memo(({ value, onChange }: PromptInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, 100);
  }, [value]);

  return (
    <textarea
      className="w-full p-1 border rounded resize-none"
      value={value}
      onChange={(e) => {
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
        onChange(e.target.value);
      }}
      rows={4}
    />
  );
});

PromptInput.displayName = "PromptInput";

interface OutputSectionProps {
  renderedPrompt: string;
  output: string;
  isLoading: boolean;
  comments: Comment[];
  onAddComment: (comment: Omit<Comment, "id">) => void;
  onRemoveComment: (commentId: string) => void;
  onOptimize: () => void;
}

const OutputSection = memo(
  ({
    renderedPrompt,
    output,
    isLoading,
    comments,
    onAddComment,
    onRemoveComment,
    onOptimize,
  }: OutputSectionProps) => {
    const [newComment, setNewComment] = useState("");
    const [selectedText, setSelectedText] = useState("");

    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString());
      } else {
        setSelectedText("");
      }
    };

    const handleAddComment = () => {
      if (newComment.trim() && selectedText) {
        onAddComment({
          text: newComment,
          selectedText,
        });
        setNewComment("");
        setSelectedText("");
      }
    };

    return (
      <>
        <p className="text-xs text-gray-500 mt-3">Rendered Prompt</p>
        <div className="select-text cursor-text max-h-[10rem] overflow-y-auto whitespace-pre-wrap bg-lime-50 rounded-md p-2">
          <Markdown>{renderedPrompt}</Markdown>
        </div>
        <p className="text-xs text-gray-500 mt-3">Output</p>
        <div
          className="select-text cursor-text max-h-[40rem] overflow-y-auto overflow-x-scroll bg-lime-50 rounded-md p-2"
          onMouseUp={handleSelection}
          onKeyUp={handleSelection}
        >
          <Markdown>{isLoading ? "Loading..." : output}</Markdown>
        </div>

        {comments.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-gray-500">Comments</p>
              <button
                onClick={onOptimize}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Optimize
              </button>
            </div>
            {comments.map((comment) => (
              <div key={comment.id} className="mt-1 p-2 bg-gray-50 rounded">
                <div className="flex justify-between items-start">
                  <div className="text-sm text-gray-600 mb-1">
                    Selected text: &ldquo;{comment.selectedText}&rdquo;
                  </div>
                  <button
                    onClick={() => onRemoveComment(comment.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <div>{comment.text}</div>
              </div>
            ))}
          </div>
        )}

        {selectedText && (
          <div className="mt-3 flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 p-1 border rounded"
              rows={2}
              placeholder="Add a comment..."
            />
            <button
              onClick={handleAddComment}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Add
            </button>
          </div>
        )}
      </>
    );
  },
);

OutputSection.displayName = "OutputSection";

const PromptNode = memo(({ data, isConnectable }: PromptNodeProps) => {
  const connections = useNodeConnections({
    handleType: "target",
  });

  const [selectedVersionIx, setSelectedVersionIx] = useState<number>(0);
  const { onChange, promptVersions, prompt } = data;

  const nodesData = useNodesData<Node<DataNodeData | PromptNodeData>>(
    connections.map((connection) => connection.source),
  );

  const {
    debouncedValue: debouncedPrompt,
    overrideDebouncedValue: overrideDebouncedPrompt,
  } = useDebounce(prompt, 1000);

  // Handle prompt version changes
  useEffect(() => {
    if (debouncedPrompt === "") return;

    const existingVersionIndex = promptVersions.findIndex(
      (version) => version.prompt === debouncedPrompt,
    );

    if (existingVersionIndex !== -1) {
      setSelectedVersionIx(existingVersionIndex);
      return;
    }

    onChange({
      promptVersions: [
        ...promptVersions,
        { prompt: debouncedPrompt, comments: [] },
      ],
    });
  }, [debouncedPrompt, promptVersions, onChange]);

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

  const handleAddComment = (comment: Omit<Comment, "id">) => {
    const newVersions = [...promptVersions];
    newVersions[selectedVersionIx] = {
      ...newVersions[selectedVersionIx],
      comments: [
        ...newVersions[selectedVersionIx].comments,
        { ...comment, id: uuid.v4() },
      ],
    };
    onChange({ promptVersions: newVersions });
  };

  const handleRemoveComment = (commentId: string) => {
    const newVersions = [...promptVersions];
    newVersions[selectedVersionIx] = {
      ...newVersions[selectedVersionIx],
      comments: newVersions[selectedVersionIx].comments.filter(
        (comment) => comment.id !== commentId,
      ),
    };
    onChange({ promptVersions: newVersions });
  };

  const handleOptimize = async () => {
    const currentVersion = promptVersions[selectedVersionIx];
    const optimizationPrompt = `This is the current prompt: "${
      currentVersion.prompt
    }". It produced this output: "${data.output}" based on this context: "${
      nodesData[0]?.data.output ?? ""
    }". The user left these comments: ${currentVersion.comments
      .map((c) => `- Selected text: "${c.selectedText}", Comment: "${c.text}"`)
      .join(
        "\n",
      )}. Please improve the prompt accordingly. Respond with the new prompt only, no other text.`;

    const optimizedPrompt = await actions.processPrompt(optimizationPrompt);

    const newVersions = [
      ...promptVersions,
      { prompt: optimizedPrompt, comments: [] },
    ];

    console.log({
      optimizedPrompt,
      newVersions,
    });

    onChange({
      promptVersions: newVersions,
      prompt: optimizedPrompt,
    });
    setSelectedVersionIx(newVersions.length - 1);
    overrideDebouncedPrompt(optimizedPrompt);
  };

  return (
    <div
      className="nowheel rounded-lg bg-lime-100 w-[40rem]"
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

      <div className="p-2">
        <p className="text-lg font-bold text-zinc-700">Prompt</p>

        <VersionControls
          selectedVersionIx={selectedVersionIx}
          totalVersions={promptVersions.length}
          onVersionChange={(newIndex) => {
            setSelectedVersionIx(newIndex);
            onChange({
              prompt: promptVersions[newIndex].prompt,
            });
            overrideDebouncedPrompt(promptVersions[newIndex].prompt);
          }}
        />

        <PromptInput
          value={prompt}
          onChange={(value) => onChange({ prompt: value })}
        />

        <OutputSection
          renderedPrompt={renderedPrompt}
          output={data.output}
          isLoading={!!data.processingPromise}
          comments={promptVersions[selectedVersionIx]?.comments ?? []}
          onAddComment={handleAddComment}
          onRemoveComment={handleRemoveComment}
          onOptimize={handleOptimize}
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
