import { merge, set } from "lodash-es";
import type { SetOptional } from "type-fest";
import { assign, createMachine, enqueueActions } from "xstate";

import { generateSocket } from "../../controls/socket-generator";
import type { DiContainer } from "../../types";
import type { BaseMachineTypes, None } from "../base";
import { BaseNode } from "../base";
import type { ParsedNode } from "../base";
import { spawnInputSockets } from "../../input-socket";
import { spawnOutputSockets } from "../../output-socket";

const inputSockets = {
  value: generateSocket({
    name: "value",
    type: "string",
    description: "Text",
    required: false,
    isMultiple: false,
    "x-showSocket": false,
    "x-key": "value",
    "x-controller": "textarea",
  }),
};

const outputSockets = {
  value: generateSocket({
    name: "value",
    type: "string",
    description: "Result text",
    required: true,
    isMultiple: false,
    "x-showSocket": true,
    "x-key": "value",
    "x-controller": "textarea",
  }),
};

const TextNodeMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBcwA9kDkD2EwGIBBAZWIEkBxTAfQGEAJMgGQBEBtABgF1FQAHbLACWyIdgB2vEGkQAmAIwBOAHTyAbABYA7PPlbZavbIAcWgDQgAnonkcty2Vu0BWDsdkBmNceMcNAX38LVAwcPHwyTDIAFTJCJjIALQBRTh4kEAFhUQkpGQRPNWUOWw0DXRNFWWcLawR5WUDg9CxcMGVkSz4hcSh8AFUABRZCaOTqYgB5WgBpZOi0qSyRMUkM-I99ZWcqjU35H3kPDz3axA0D5UUtNWdnX2NnE44ONSaQENa8Dq6evuJ5tQAGrxfqpbhLQQrXLrRAeRTOZQePx+byyDiyDQIs4IDyeZRaErGDQkjT3DS+ZzvT5hdqdbq9fBoWDIACGqGUrIAZqgAE4AClsAEp8DS2j8GVBFhlljk1qB8tVZA4NG4SR5bD5FIoNDiSfYOCcnvI7mpHGoPNSWrTlABjbAAWz4ABswKgBsNRuMprN5tL+FC5XlzuYrHCtPY9E9FOo9BxnI4qUEPtbxfana73QDosDQeD0gHsqtgwU8ds7FpjBbFPCzfJdWGEFiPMpHqY7PWNZWDIFk+I2vAMmK8JCizCFYgALTyHEHFTOLGudTaTZqNxW0Li+l-UfQ+XSc4mhxOLQnbWGlGhurOJQOG-I4yKDhPkzyDdfdrpl1usC7oOwhA1wcYwGk2M81B1PY1D1CNlDJF4Iy8Yx4QjXt-CAA */
  id: "textNode",
  entry: enqueueActions(({ enqueue }) => {
    enqueue("initialize");
  }),
  on: {
    ASSIGN_CHILD: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue("assignChild");
      }),
    },
    INITIALIZE: {
      actions: enqueueActions(({ enqueue }) => {
        enqueue("initialize");
      }),
    },
  },
  context: ({ input, spawn, self }) => {
    const config = merge(
      {
        inputs: {
          value: "",
        },
        inputSockets: {
          ...inputSockets,
        },
        outputSockets: {
          ...outputSockets,
        },
        outputs: {
          value: "",
        },
        error: null,
      },
      input,
    );

    const spawnedInputSockets = spawnInputSockets({
      spawn,
      self,
      inputSockets: config.inputSockets as any,
    });
    const spawnedOutputSockets = spawnOutputSockets({
      spawn,
      self,
      outputSockets: config.outputSockets as any,
    });

    set(config, "inputSockets", spawnedInputSockets);
    set(config, "outputSockets", spawnedOutputSockets);

    return config;
  },
  initial: "complete",
  types: {} as BaseMachineTypes<{
    input: {
      value: string;
      outputs: {
        value: string;
      };
    };
    context: {
      value: string;
      outputs: {
        value: string;
      };
    };
    actors: None;
    actions: None;
    guards: None;
    events: None;
  }>,
  states: {
    typing: {
      after: {
        10: "complete",
      },
      on: {
        SET_VALUE: {
          target: "typing",
          reenter: true,
          actions: ["setValue"],
        },
      },
    },
    complete: {
      output: ({ context }) => context.outputs,
      entry: [
        assign({
          outputs: ({ context }) => ({
            value: context.inputs.value,
          }),
        }),
      ],
      on: {
        UPDATE_SOCKET: {
          actions: ["updateSocket"],
        },
        SET_VALUE: {
          target: "typing",
          actions: ["setValue"],
        },
      },
    },
  },
  output: ({ context }) => context.outputs,
});

export type TextNodeData = ParsedNode<"NodeText", typeof TextNodeMachine>;

export class NodeText extends BaseNode<typeof TextNodeMachine> {
  static nodeType = "TextNode" as const;
  static label = "Text";
  static description = "Node for handling static text";
  static icon = "text";

  static section = "Primitives";

  static parse(params: SetOptional<TextNodeData, "type">): TextNodeData {
    return {
      ...params,
      type: "NodeText",
    };
  }

  static machines = {
    NodeText: TextNodeMachine,
  };

  constructor(di: DiContainer, data: TextNodeData) {
    super("NodeText", di, data, TextNodeMachine, {});
    this.setup();
  }
}
