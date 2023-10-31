import { assign, createMachine, fromPromise } from "xstate";
import { BaseNode, type ParsedNode } from "../base";
import { DiContainer } from "../../types";
import { getSocketByJsonSchemaType, objectSocket } from "../../sockets";
import { createJsonSchema } from "../../utils";
import {
  JSONSocket,
  SocketGeneratorControl,
} from "../../controls/socket-generator";
import { Input, Output } from "../../input-output";
import { SetOptional } from "type-fest";

const composeObjectMachine = createMachine({
  id: "composeObject",
  initial: "idle",
  types: {} as {
    context: {
      name: string;
      description?: string;
      inputs: JSONSocket[];
      schema: any;
    };
    events: {
      type: "change";
      name: string;
      description?: string;
      inputs: JSONSocket[];
      schema: any;
    };
  },
  context: {
    name: "object",
    description: "object description",
    inputs: [
      {
        name: "name",
        type: "string",
        description: "Name of the object",
        required: true,
      },
    ],
    schema: {},
  },
  states: {
    idle: {
      on: {
        change: {
          target: "idle",
          actions: assign({
            inputs: ({ event }) => event.inputs,
            name: ({ event }) => event.name,
            description: ({ event }) => event.description,
            schema: ({ event }) => event.schema,
          }),
          reenter: true,
        },
      },
    },
  },
});

export type ComposeObjectData = ParsedNode<
  "ComposeObject",
  typeof composeObjectMachine
>;

export class ComposeObject extends BaseNode<typeof composeObjectMachine> {
  static nodeType = "ComposeObject" as const;
  static label = "Compose Object";
  static description = "Compose an object";
  static icon = "braces";

  static parse(
    params: SetOptional<ComposeObjectData, "type">
  ): ComposeObjectData {
    return {
      ...params,
      type: "ComposeObject",
    };
  }

  constructor(di: DiContainer, data: ComposeObjectData) {
    super("ComposeObject", di, data, composeObjectMachine, {
      actors: {
        process: fromPromise(async ({ input }) => {
          console.log("PROCESSING", input);
          const schema = createJsonSchema(input.inputs);
          return schema;
        }),
      },
    });

    this.addOutput("object", new Output(objectSocket, "Object"));
    this.addOutput("schema", new Output(objectSocket, "Schema"));

    const state = this.actor.getSnapshot();
    const inputGenerator = new SocketGeneratorControl({
      connectionType: "input",
      name: "Input Sockets",
      ignored: ["trigger"],
      tooltip: "Add input sockets",
      initial: {
        name: state.context.name,
        description: state.context.description,
        sockets: state.context.inputs,
      },
      onChange: ({ sockets, name, description }) => {
        const schema = createJsonSchema(sockets);
        this.actor.send({
          type: "change",
          name,
          description,
          inputs: sockets,
          schema,
        });
      },
    });

    this.addControl("inputGenerator", inputGenerator);
    this.actor.subscribe((state) => {
      this.process();
    });
    this.process();
  }

  process() {
    const state = this.actor.getSnapshot();
    const rawTemplate = state.context.inputs as JSONSocket[];

    for (const item of Object.keys(this.inputs)) {
      if (rawTemplate.find((i: JSONSocket) => i.name === item)) continue;
      const connections = this.di.editor
        .getConnections()
        .filter((c) => c.target === this.id && c.targetInput === item);
      if (connections.length >= 1) continue; // if there's an input that's not in the template keep it.
      this.removeInput(item);
    }

    for (const item of rawTemplate) {
      if (this.hasInput(item.name)) {
        const input = this.inputs[item.name];
        if (input) {
          input.socket = getSocketByJsonSchemaType(item.type)!;
        }
        continue;
      }

      const socket = getSocketByJsonSchemaType(item.type)!;
      this.addInput(item.name, new Input(socket, item.name, false));
    }
  }

  async execute() {}
}