import { NodeEditor, NodeId } from "rete";
import { NodeProps, NodeTypes, Schemes } from "./types";
import * as Nodes from "./nodes";
import { DiContainer } from "./editor";
import { Connection } from "./connection";
import { createNodeInDB } from "../action";
import { getNodeData } from "./actions";

export async function createNode({
  di,
  name,
  data,
  saveToDB = false,
  playgroundId,
  projectSlug,
}: {
  di: DiContainer;
  name: NodeTypes;
  data?: any;
  saveToDB?: boolean;
  playgroundId?: string;
  projectSlug?: string;
}) {
  type NodeMappingFunctions = {
    [Property in NodeTypes]: (di: DiContainer, data: any) => NodeProps;
  };

  const nodes: NodeMappingFunctions = {
    Start: (di) => new Nodes.Start(di),
    Log: (di) => new Nodes.Log(di),
    TextNode: (di, data) => new Nodes.TextNode(di, data),
    PromptTemplate: (di, data) => new Nodes.PromptTemplate(di, data),
    OpenAIFunctionCall: (di, data) => new Nodes.OpenAIFunctionCall(di, data),
    FunctionNode: (di, data) => new Nodes.FunctionNode(di, data),
    DataSource: (di, data) => new Nodes.DataSource(di, data),
  };
  const matched = nodes[name];

  if (!matched) throw new Error(`Unsupported node '${name}'`);

  if (saveToDB) {
    if (!playgroundId) throw new Error("playgroundId is required");
    if (!projectSlug) throw new Error("projectSlug is required");
    const nodeInDb = await createNodeInDB({
      playgroundId,
      projectSlug,
      type: name,
    });
    console.log("nodeInDb", nodeInDb);
    const node = await matched(di, {
      ...nodeInDb,
      ...data,
    });
    return node;
  }

  const node = await matched(di, data);
  return node;
}

export type Data = {
  nodes: { id: NodeId; name: string; data: Record<string, unknown> }[];
  edges: {
    id: NodeId;
    source: string;
    target: string;
    sourceOutput: keyof NodeProps["outputs"];
    targetInput: keyof NodeProps["inputs"];
  }[];
};

export async function importEditor(di: DiContainer, data: Data) {
  const { nodes, edges } = data;

  for (const n of nodes) {
    const data = await getNodeData(n.id);
    console.log("gettingData", data);
    const node = await createNode({
      di,
      name: n.name as any,
      data: {
        ...n.data,
        ...data,
      },
    });
    node.id = n.id;
    await di.editor.addNode(node);
  }
  for (const c of edges) {
    const source = di.editor.getNode(c.source);
    const target = di.editor.getNode(c.target);

    if (
      source &&
      target &&
      source.outputs[c.sourceOutput] &&
      target.inputs[c.targetInput]
    ) {
      const conn = new Connection(
        source,
        c.sourceOutput,
        target,
        c.targetInput
      );

      await di.editor.addConnection(conn);
    }
  }
  await di.arrange?.layout();
}

export function exportEditor(editor: NodeEditor<Schemes>) {
  const nodes = [];
  const edges = [];

  for (const n of editor.getNodes()) {
    nodes.push({
      id: n.id,
      name: n.constructor.name,
      data: n.serialize(),
    });
  }
  for (const c of editor.getConnections()) {
    edges.push({
      source: c.source,
      sourceOutput: c.sourceOutput,
      target: c.target,
      targetInput: c.targetInput,
    });
  }

  return {
    nodes,
    edges,
  };
}
