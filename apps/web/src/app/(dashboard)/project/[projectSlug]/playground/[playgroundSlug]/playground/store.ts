import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";

import { DiContainer } from "./editor";
import type * as FlexLayout from "flexlayout-react";

export type ReteStore = {
  workflowId: string;
  workflowSlug: string;
  projectId: string;
  projectSlug: string;
  workflowVersionId: string;
  workflowExecutionId: string | null;
  setWorkflowExecutionId: (workflowExecutionId: string | null) => void;
  readonly: boolean;
  selectedNodeId: string | null;
  di: DiContainer | null;
  layout: FlexLayout.Model;
  showControls: boolean;
  position: { x: number; y: number };
  theme: string;
  setTheme: (theme: string) => void;
  setPosition: (position: { x: number; y: number }) => void;
  toggleControls: () => void;
  setLayout: (layout: FlexLayout.Model) => void;
  setDi: (di: DiContainer) => void;
  setSelectedNodeId: (selectedNodeId: string | null) => void;
};
export const createCraftStore = (initial: Partial<ReteStore>) =>
  createStore<ReteStore, [["zustand/subscribeWithSelector", never]]>(
    subscribeWithSelector((set, get) => ({
      projectId: "",
      projectSlug: "",
      workflowId: "",
      workflowSlug: "",
      workflowVersionId: "",
      workflowExecutionId: null,
      setWorkflowExecutionId: (workflowExecutionId: string | null) =>
        set({ workflowExecutionId }),
      readonly: true,
      selectedNodeId: null,
      di: null,
      showControls: false,
      theme: "dark",
      setTheme: (theme) => set({ theme }),
      layout: {} as FlexLayout.Model,
      position: { x: 0, y: 0 },
      setPosition: (position: { x: number; y: number }) => set({ position }),
      toggleControls: () =>
        set((state) => ({ showControls: !state.showControls })),
      setLayout: (layout: FlexLayout.Model) => set({ layout }),
      setDi: (di: DiContainer) => set({ di }),
      setSelectedNodeId: (selectedNodeId: string | null) =>
        set({ selectedNodeId }),
      ...initial,
    }))
  );

export type ReteStoreInstance = ReturnType<typeof createCraftStore>;
