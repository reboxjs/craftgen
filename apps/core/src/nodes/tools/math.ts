import { merge } from "lodash-es";
import * as mathjs from "mathjs";
import dedent from "ts-dedent";
import { P } from "ts-pattern";
import { SetOptional } from "type-fest";
import {
  createMachine,
  enqueueActions,
  fromPromise,
  PromiseActorLogic,
} from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import { DiContainer } from "../../types";
import {
  BaseContextType,
  BaseInputType,
  BaseMachineTypes,
  BaseNode,
  None,
  ParsedNode,
} from "../base";

const inputSockets = {
  RUN: generateSocket({
    name: "Run",
    type: "trigger",
    description: "Run",
    required: false,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "RUN",
    "x-event": "RUN",
  }),
  expression: generateSocket({
    name: "Expression",
    type: "string",
    description: "Expression",
    required: true,
    isMultiple: false,
    default: "",
    "x-showSocket": true,
    "x-key": "expression",
  }),
};
const outputSockets = {
  result: generateSocket({
    name: "Result",
    type: "number",
    description: "Result",
    required: true,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "result",
  }),
  Math: generateSocket({
    name: "Math",
    type: "tool",
    description: "Math",
    required: false,
    isMultiple: true,
    "x-showSocket": true,
    "x-key": "Math",
  }),
};

export const MathNodeMachine = createMachine(
  {
    id: "MathNode",
    context: ({ input }) => {
      const defaultInputs: (typeof input)["inputs"] = {};
      for (const [key, socket] of Object.entries(inputSockets)) {
        if (socket.default) {
          defaultInputs[key as any] = socket.default;
        } else {
          defaultInputs[key as any] = undefined;
        }
      }

      return merge<Partial<typeof input>, any>(
        {
          inputs: {
            ...defaultInputs,
          },
          inputSockets: {
            ...inputSockets,
          },
          outputSockets: {
            ...outputSockets,
          },
          outputs: {
            result: null,
          },
        },
        input,
      );
    },
    types: {} as BaseMachineTypes<{
      input: BaseInputType<typeof inputSockets, typeof outputSockets>;
      context: BaseContextType<typeof inputSockets, typeof outputSockets>;
      actions: None;
      actors: {
        src: "Run";
        logic: PromiseActorLogic<number, { expression: string }>;
      };
      guards: None;
      events: None;
    }>,
    initial: "idle",
    states: {
      idle: {
        on: {
          RUN: {
            target: "running",
          },
          SET_VALUE: {
            actions: ["setValue"],
          },
          UPDATE_SOCKET: {
            actions: ["updateSocket"],
          },
        },
      },
      running: {
        invoke: {
          src: "Run",
          input: ({ context }) => ({
            expression: context.inputs.expression,
          }),
          onDone: {
            target: "complete",
            actions: enqueueActions(({ enqueue }) => {
              enqueue.assign({
                outputs: ({ context, event }) => ({
                  ...context.outputs,
                  result: event.output,
                }),
              });
            }),
          },
          onError: {
            target: "error",
            actions: ["setError"],
          },
        },
      },
      complete: {
        on: {
          SET_VALUE: {
            actions: ["setValue"],
            target: "idle",
          },
          UPDATE_SOCKET: {
            actions: ["updateSocket"],
          },
        },
      },
      error: {},
    },
  },
  {
    actors: {
      Run: fromPromise(
        async ({
          input,
        }: {
          input: {
            expression: string;
          };
        }): Promise<number> => {
          const { expression } = input;
          return mathjs.evaluate(expression);
        },
      ),
    },
  },
);

export type MathNodeData = ParsedNode<"MathNode", typeof MathNodeMachine>;

export class MathNode extends BaseNode<typeof MathNodeMachine> {
  static nodeType = "MathNode" as const;
  static label = "Math";
  static description = dedent`
    A tool for evaluating mathematical expressions. Example expressions:
    '1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.
  `;
  static icon = "calculator";

  static section = "Tools";

  static parse(params: SetOptional<MathNodeData, "type">): MathNodeData {
    return {
      ...params,
      type: "MathNode",
    };
  }

  constructor(di: DiContainer, data: MathNodeData) {
    super("MathNode", di, data, MathNodeMachine, {});
    this.description = data.description || MathNode.description;
    this.setup();
  }
}