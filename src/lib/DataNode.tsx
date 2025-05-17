import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";

export type DataNodeData = {
  title: string;
  output: string;
  onChange: (newData: Partial<DataNodeData>) => void;
};

interface DataNodeProps {
  data: DataNodeData;
  isConnectable: boolean;
}

const DataNode = memo(({ data, isConnectable }: DataNodeProps) => {
  return (
    <div
      className="rounded-lg bg-blue-100"
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div className="h-4 w-full bg-gray-200 hover:bg-gray-300 cursor-grab active:cursor-grabbing rounded-t drag-handle__custom" />

      <div className="p-2">
        <p className="text-lg font-bold text-zinc-700">Data</p>

        <div className="font-bold mb-2">{data.title}</div>
        <textarea
          className="w-full p-1 border rounded"
          value={data.output}
          onChange={(e) => data.onChange({ output: e.target.value })}
          rows={4}
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

DataNode.displayName = "DataNode";

export default DataNode;
