import * as React from "react";
import Link from "next/link";
import { useSelector } from "@xstate/react";
import * as FlexLayout from "flexlayout-react";
import { CheckCircle, Loader2, Play, Undo2, Wrench } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { Resizable } from "react-resizable";
import { useCopyToClipboard, useDebounce, useMeasure } from "react-use";
import type { RenderEmit } from "rete-react-plugin";
import { Drag, Presets } from "rete-react-plugin";
import { Key } from "ts-key-enum";
import { useStore } from "zustand";

import type { Schemes } from "@seocraft/core/src/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

import type { ReteStoreInstance } from "../store";

import "react-resizable/css/styles.css";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import { ActorStatus } from "xstate";

import { updateNodeMetadata } from "@/actions/update-node-meta";
import { Icons } from "@/components/icons";
import { JSONView } from "@/components/json-view";
import { Label } from "@/components/ui/label";

const { RefSocket, RefControl } = Presets.classic;

function sortByIndex<T extends [string, undefined | { index?: number }][]>(
  entries: T,
) {
  entries.sort((a, b) => {
    const ai = a[1]?.index || 0;
    const bi = b[1]?.index || 0;

    return ai - bi;
  });
}

interface Props<S extends Schemes> {
  data: S["Node"];
  styles?: () => any;
  emit: RenderEmit<S>;
  store: ReteStoreInstance;
}
export type NodeComponent = (props: Props<Schemes>) => JSX.Element;

export function CustomNode(props: Props<Schemes>) {
  return <Node {...props} />;
}

export const Node = observer((props: Props<Schemes>) => {
  const inputs = Object.entries(props.data.inputs);
  const outputs = Object.entries(props.data.outputs);
  const controls = Object.entries(props.data.controls);
  const selected = props.data.selected || false;
  const { id, di } = props.data;
  const { projectSlug, layout } = useStore(props.store);
  const [debug, SetDebug] = React.useState(false);

  sortByIndex(inputs);
  sortByIndex(outputs);
  sortByIndex(controls);

  const deleteNode = React.useCallback(async () => {
    const connections =
      di?.editor.getConnections().filter((c) => {
        return c.source === props.data.id || c.target === props.data.id;
      }) || [];
    for (const connection of connections) {
      await di?.editor.removeConnection(connection.id);
    }
    await di?.editor.removeNode(props.data.id);
  }, [props.data]);

  const cloneNode = React.useCallback(async () => {
    console.log("clone node", {
      data: props.data,
      name: props.data.ID,
      state: props.data.actor.getSnapshot(),
    });
    const rawState = JSON.stringify(props.data.actor.getSnapshot());
    console.log({ rawState });

    const node = await di.duplicateNode(props.data.id);
    await di?.editor.addNode(node);
    await di?.area?.translate(node.id, di?.area?.area.pointer);
  }, []);
  const triggerNode = async () => {
    await di.runSync({
      inputId: props.data.id,
    });
  };

  const pinNode = React.useCallback(async () => {
    const tabset = layout.getActiveTabset()?.getId()!;
    layout.doAction(
      FlexLayout.Actions.addNode(
        {
          type: "tab",
          component: "inspectorNode",
          name: props.data.label,
          config: {
            nodeId: props.data.id,
          },
        },
        tabset,
        FlexLayout.DockLocation.CENTER,
        1,
      ),
    );
  }, []);

  useHotkeys<HTMLDivElement>(
    `${Key.Backspace}, ${Key.Delete}`,
    async () => {
      await deleteNode();
    },
    {
      enabled: selected,
    },
  );
  useHotkeys<HTMLDivElement>(
    `${Key.Meta}+d`,
    async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await cloneNode();
    },
    {
      enabled: selected,
    },
  );

  useHotkeys<HTMLDivElement>(
    `${Key.Meta}+${Key.Enter}`,
    async (event) => {
      triggerNode();
    },
    {
      enabled: selected,
    },
  );

  const toggleDebug = () => {
    SetDebug(!debug);
  };
  const ref = React.useRef<HTMLButtonElement>(null);
  Drag.useNoDrag(ref);
  const ref2 = React.useRef<HTMLButtonElement>(null);
  Drag.useNoDrag(ref2);

  const state = useSelector(props.data.actor, (state) => state);

  const { toast } = useToast();
  React.useEffect(() => {
    const subs = props.data.actor.subscribe((state) => {
      if (state.matches("error")) {
        if (state.context.error.name === "MISSING_API_KEY_ERROR") {
          toast({
            title: "Error",
            description: state.context.error.message,
            action: (
              <Link href={`/project/${projectSlug}/settings/tokens`}>
                <ToastAction altText={"go to settings"}>
                  {/* <Button size="sm">Go to Settings</Button> */}
                  Go to Settings
                </ToastAction>
              </Link>
            ),
          });
        } else {
          toast({
            title: "Error",
            description: state.context.error.message,
          });
        }
      }
    });
    return subs.unsubscribe;
  }, []);
  const NodeIcon = React.useMemo(() => {
    const iconName = props.data.di.nodeMeta.get(props.data.ID)?.icon;
    if (!iconName) return Icons.component;
    return Icons[iconName as keyof typeof Icons];
  }, []);
  const [editLabel, setEditLabel] = React.useState(false);
  const [size, setSize] = useState({
    width: props.data.width,
    height: props.data.height,
  });

  useHotkeys(
    `${Key.Meta}+r`,
    (e) => {
      setEditLabel(!editLabel);
    },
    {
      enabled: props.data.di.selectedNodeId === props.data.id,
      preventDefault: true,
    },
  );
  const [internalRef, internal] = useMeasure<HTMLDivElement>();

  useDebounce(
    () => {
      setSize({
        height: internal.height + 20,
        width: size.width,
      });
    },
    10,
    [internal.height],
  );

  useDebounce(
    () => {
      const { width, height } = size;
      const { data } = props;

      if (width > 0 || height > 0) {
        if (data.width !== width || data.height !== height) {
          di?.area?.resize(data.id, width, height);
        }
      }
    },
    100,
    [size],
  );

  useDebounce(
    async () => {
      if (props.data.label !== props.data.nodeData.label) {
        await updateNodeMetadata({
          id: props.data.id,
          label: props.data.label,
        });
      }
    },
    1000,
    [props.data.label],
  );
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.data.setLabel(e.target.value);
  };
  const [copyToClipboardState, copyToClipboard] = useCopyToClipboard();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Resizable
          data-nodetype={props.data.ID}
          width={size.width}
          height={size.height}
          handle={<ResizeHandle />}
          onResize={(e, { size }) => {
            setSize(size);
          }}
          minConstraints={[200, internal.height + 20]}
        >
          <Card
            style={{
              width: size.width,
              height: size.height,
            }}
            className={cn(
              "",
              "@container group",
              selected && " border-primary",
              "glass flex flex-1 flex-col",
              state.matches("loading") &&
                "animate-pulse border-2 border-blue-300",
              state.matches("running") && "border-yellow-300",
              state.matches("error") && "border-2 border-red-600",
            )}
          >
            <div ref={internalRef} className="flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-2 py-1">
                <div className="flex items-center space-x-2">
                  <NodeIcon className="h-5 w-5" />
                  {editLabel ? (
                    <Input
                      defaultValue={props.data.label}
                      autoFocus
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          setEditLabel(false);
                        }
                      }}
                      onChange={handleLabelChange}
                    />
                  ) : (
                    <Drag.NoDrag>
                      <CardTitle
                        className="flex"
                        onDoubleClick={() => {
                          setEditLabel(true);
                        }}
                      >
                        {props.data.label}{" "}
                        {props.data.action ? (
                          <span className="text-muted-foreground ml-2 text-sm">
                            {"/"}
                            {props.data.action}
                          </span>
                        ) : null}
                      </CardTitle>
                    </Drag.NoDrag>
                  )}
                </div>
                <div className="flex">
                  {props.data.actor.status === ActorStatus.Stopped && (
                    <Drag.NoDrag>
                      <Button
                        variant={"ghost"}
                        size={"icon"}
                        onClick={() => props.data.reset()}
                      >
                        <Undo2 size={14} />
                      </Button>
                    </Drag.NoDrag>
                  )}
                  <Button
                    ref={ref}
                    variant={"ghost"}
                    size={"icon"}
                    onClick={toggleDebug}
                  >
                    <Wrench size={14} />
                  </Button>
                  <Button
                    ref={ref2}
                    onClick={triggerNode}
                    disabled={!state.matches("idle")}
                    variant={"ghost"}
                    size="icon"
                  >
                    {state.matches("running") && (
                      <Loader2
                        size={14}
                        className="animate-spin text-green-400"
                      />
                    )}
                    {state.matches("idle") && <Play size={14} />}
                    {state.matches("complete") && (
                      <CheckCircle size={14} className="text-green-400" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <div className="grid grid-cols-2 py-4">
                <div>
                  {/* Inputs */}
                  {inputs.map(([key, input]) => {
                    if (!input || !input.showSocket) return null;
                    return (
                      <RenderInput
                        emit={props.emit}
                        input={input}
                        key={`input-key-${key}`}
                        inputKey={key}
                        id={id}
                      />
                    );
                  })}
                </div>
                <div>
                  {/* Outputs */}
                  {outputs.map(([key, output]) => {
                    if (!output || !output.showSocket) return null;
                    return (
                      <RenderOutput
                        emit={props.emit}
                        output={output}
                        key={`output-key-${key}`}
                        outputKey={key}
                        id={id}
                      />
                    );
                  })}
                </div>
              </div>
              <CardContent className="flex-1">
                {/* controls */}
                <section
                  className={cn(
                    "hidden",
                    size.height > props.data.minHeightForControls &&
                      "@xs:block my-2 space-y-2",
                  )}
                >
                  {controls.map(([key, control]) => {
                    return control ? (
                      <div className="flex flex-col space-y-1" key={key}>
                        <Label htmlFor={control.id} className="capitalize">
                          {key}
                        </Label>
                        <Drag.NoDrag>
                          <RefControl
                            key={key}
                            name="control"
                            emit={props.emit}
                            payload={control}
                          />
                        </Drag.NoDrag>
                      </div>
                    ) : null;
                  })}
                </section>
              </CardContent>

              <CardFooter className="mt-auto flex flex-col p-1 px-2 pt-0">
                {props.data.snap.matches("complete") && (
                  <div className="w-full">
                    <Drag.NoDrag>
                      <JSONView
                        data={
                          props.data.actor.getSnapshot().output ||
                          props.data.snap.context.outputs
                        }
                      />
                    </Drag.NoDrag>
                  </div>
                )}
                <Drag.NoDrag>
                  <Badge
                    variant={"outline"}
                    className="text-muted group-hover:text-primary  cursor-copy truncate font-mono text-xs"
                    onClick={() => copyToClipboard(props.data.id)}
                  >
                    {props.data.id}
                  </Badge>
                </Drag.NoDrag>
              </CardFooter>
            </div>
          </Card>
        </Resizable>
      </ContextMenuTrigger>
      {debug && (
        <div className="absolute">
          <pre>
            <code>
              {JSON.stringify(
                {
                  isExection: props.data.isExecution,
                  state: state,
                  // executionNode: props.data.executionNode,
                  node: props.data.nodeData,
                  size: props.data.size,
                },
                null,
                2,
              )}
            </code>
          </pre>
        </div>
      )}
      <ContextMenuContent>
        <ContextMenuItem onClick={cloneNode}>
          Clone
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={pinNode}>Pin</ContextMenuItem>
        <ContextMenuItem onClick={() => setEditLabel(true)}>
          Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={deleteNode}>
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Controllers</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuCheckboxItem checked>
              Show Bookmarks Bar
              <ContextMenuShortcut>⌘⇧B</ContextMenuShortcut>
            </ContextMenuCheckboxItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
});

const ResizeHandle = React.forwardRef<any>((props: any, ref: any) => {
  const { handleAxis, ...restProps } = props;
  Drag.useNoDrag(ref);
  return (
    <div
      ref={ref}
      className={`-m-2 hidden h-10 w-10 active:-m-32 active:h-full  active:w-full  active:bg-none group-hover:block  react-resizable-handle-${handleAxis} react-resizable-handle`}
      {...restProps}
    ></div>
  );
});
ResizeHandle.displayName = "ResizeHandle";

const RenderInput: React.FC<any> = ({ input, emit, id, inputKey }) => {
  return (
    <div
      className="flex select-none items-center text-left "
      data-testid={`input-${inputKey}`}
    >
      <RefSocket
        name="input-socket"
        emit={emit}
        side="input"
        socketKey={inputKey}
        nodeId={id}
        payload={{ socket: input.socket, input } as any}
      />
    </div>
  );
};

const RenderOutput: React.FC<any> = ({ output, emit, id, outputKey }) => {
  return (
    <div
      className="flex select-none items-center justify-end text-right"
      data-testid={`output-${outputKey}`}
    >
      <RefSocket
        name="output-socket"
        side="output"
        emit={emit}
        socketKey={outputKey}
        nodeId={id}
        payload={{ socket: output?.socket!, output } as any}
      />
    </div>
  );
};
