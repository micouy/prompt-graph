import Graph from "@/lib/Graph";

export default function Home() {
  return (
    <div className="flex flex-col h-full w-full">
      <h1 className="text-2xl">Miko's Prompt Optimizer</h1>
      <div className="flex-1">
        <Graph />
      </div>
    </div>
  );
}
