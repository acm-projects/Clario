import Editor from "@monaco-editor/react";

export default function InterviewRoom() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Interview Room</h1>
      <Editor
        height="500px"
        defaultLanguage="python"
        defaultValue={"# Write your solution here\n"}
        theme="vs-dark"
      />
    </div>
  );
}