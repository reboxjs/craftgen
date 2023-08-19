import { useCallback } from "react";
import { ClassicPreset } from "rete";

export class Socket extends ClassicPreset.Socket {
  name: SocketNameType;

  constructor(name: SocketNameType) {
    super(name);
    this.name = name;
  }

  compatible: Socket[] = [];

  combineWith(socket: Socket) {
    this.compatible.push(socket);
  }

  isCompatibleWith(socket: Socket) {
    return this === socket || this.compatible.includes(socket);
  }
}

export const triggerSocket = new Socket("Trigger");

export const anySocket = new Socket("Any");

export const numberSocket = new Socket("Number");
export const booleanSocket = new Socket("Boolean");
export const arraySocket = new Socket("Array");
export const stringSocket = new Socket("String");
export const objectSocket = new Socket("Object");
export const eventSocket = new Socket("Event");
export const audioSocket = new Socket("Audio");
export const documentSocket = new Socket("Document");
export const embeddingSocket = new Socket("Embedding");
export const taskSocket = new Socket("Task");
export const imageSocket = new Socket("Image");
export const databaseIdSocket = new Socket("databaseIdSocket");

databaseIdSocket.combineWith(stringSocket);

const sockets = [
  numberSocket,
  booleanSocket,
  stringSocket,
  arraySocket,
  objectSocket,
  eventSocket,
  audioSocket,
  documentSocket,
  embeddingSocket,
  taskSocket,
  imageSocket,
  databaseIdSocket,
] as const;
export type SocketNameType =
  | "Trigger"
  | "Any"
  | "Number"
  | "Boolean"
  | "Array"
  | "String"
  | "Object"
  | "Event"
  | "Audio"
  | "Document"
  | "Embedding"
  | "Task"
  | "Image"
  | "databaseIdSocket";

export type SocketType =
  | "anySocket"
  | "numberSocket"
  | "booleanSocket"
  | "arraySocket"
  | "stringSocket"
  | "objectSocket"
  | "triggerSocket"
  | "eventSocket"
  | "taskSocket"
  | "audioSocket"
  | "imageSocket"
  | "embeddingSocket"
  | "taskSocket"
  | "documentSocket"
  | "databaseIdSocket";

export const socketNameMap: Record<SocketNameType, SocketType> = {
  Any: "anySocket",
  Number: "numberSocket",
  Boolean: "booleanSocket",
  Array: "arraySocket",
  String: "stringSocket",
  Object: "objectSocket",
  Trigger: "triggerSocket",
  Event: "eventSocket",
  Audio: "audioSocket",
  Document: "documentSocket",
  Embedding: "embeddingSocket",
  Task: "taskSocket",
  Image: "imageSocket",
  databaseIdSocket: "databaseIdSocket",
};

export const types = [
  "string",
  "number",
  "boolean",
  "any",
  "array",
  "object",
  "date",
] as const;

export const getSocketByJsonSchemaType = (type: (typeof types)[number]) => {
  switch (type) {
    case "string":
      return stringSocket;
    case "number":
      return numberSocket;
    case "boolean":
      return booleanSocket;
    case "array":
      return arraySocket;
    case "object":
      return objectSocket;
    default:
      return anySocket;
  }
};

type SocketConfig = {
  badge: string;
  color: string;
  connection: string;
};

export const socketConfig: Record<SocketNameType, SocketConfig> = {
  Trigger: { badge: "bg-red-600", color: "bg-red-400", connection: "red" },
  Any: { badge: "bg-gray-600", color: "bg-gray-400", connection: "gray" },
  Number: {
    badge: "bg-indigo-600",
    color: "bg-indigo-400",
    connection: "indigo",
  },
  Boolean: {
    badge: "bg-yellow-600",
    color: "bg-yellow-400",
    connection: "yellow",
  },
  Array: { badge: "bg-green-600", color: "bg-green-400", connection: "green" },
  String: { badge: "bg-teal-600", color: "bg-teal-400", connection: "teal" },
  Object: { badge: "bg-blue-600", color: "bg-blue-400", connection: "blue" },
  Event: { badge: "bg-pink-600", color: "bg-pink-400", connection: "pink" },
  Audio: {
    badge: "bg-purple-600",
    color: "bg-purple-400",
    connection: "purple",
  },
  Document: {
    badge: "bg-violet-600",
    color: "bg-violet-400",
    connection: "violet",
  },
  Embedding: { badge: "bg-cyan-600", color: "bg-cyan-400", connection: "cyan" },
  Task: {
    badge: "bg-orange-600",
    color: "bg-orange-400",
    connection: "orange",
  },
  Image: {
    badge: "bg-emerald-600",
    color: "bg-emerald-400",
    connection: "emerald",
  },
  databaseIdSocket: {
    badge: "bg-stone-600",
    color: "bg-stone-400",
    connection: "stone",
  },
};

export const useSocketConfig = (name: SocketNameType) => {
  const getConfig = useCallback((name: SocketNameType) => {
    return socketConfig[name];
  }, []);
  return getConfig(name);
};

sockets.forEach((socket) => {
  anySocket.combineWith(socket);
  socket.combineWith(anySocket);
});

export type Sockets = (typeof sockets)[number];
