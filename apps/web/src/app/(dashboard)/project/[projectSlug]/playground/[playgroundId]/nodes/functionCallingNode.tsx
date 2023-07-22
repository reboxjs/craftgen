import { useCallback } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type FunctionCallingNodeData = {
  text: string;
};

export const functionCallingNode: React.FC<
  NodeProps<FunctionCallingNodeData>
> = ({}) => {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);


  return (
    <>
      <Handle type="target" position={Position.Right} />
      <Handle type="source" position={Position.Left} />
      <ContextMenu>
        <ContextMenuTrigger>
          <Card>
            <CardHeader>
              CreateJSON
            </CardHeader>
            <CardContent>
              <Label htmlFor="text">Text</Label>
              <Input id="text" name="text" onChange={onChange} />
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem key={'delete'}>
            Delete
            <ContextMenuShortcut>
              ⌫
            </ContextMenuShortcut>
            </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
};