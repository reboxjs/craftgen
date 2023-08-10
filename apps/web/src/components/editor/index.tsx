"use client";

import { Plate, PlateProvider, createPlugins } from "@udecode/plate-common";
import {
  createBoldPlugin,
  createCodePlugin,
  createItalicPlugin,
  createStrikethroughPlugin,
  createUnderlinePlugin,
} from "@udecode/plate-basic-marks";
import { createNodeIdPlugin } from "@udecode/plate-node-id";
import { createBlockSelectionPlugin } from "@udecode/plate-selection";
import { createBlockquotePlugin } from "@udecode/plate-block-quote";
import { createCodeBlockPlugin } from "@udecode/plate-code-block";
import {
  ELEMENT_H1,
  ELEMENT_H2,
  ELEMENT_H3,
  ELEMENT_H4,
  ELEMENT_H5,
  ELEMENT_H6,
  createHeadingPlugin,
} from "@udecode/plate-heading";
import {
  ELEMENT_PARAGRAPH,
  createParagraphPlugin,
} from "@udecode/plate-paragraph";
import { createAutoformatPlugin } from "@udecode/plate-autoformat";
import { createResetNodePlugin } from "@udecode/plate-reset-node";

import { createDndPlugin } from "@udecode/plate-dnd";
import { createPlateUI } from "./create-plate-ui";
import { autoformatRules } from "./autoformatRules";
import { MyValue, createMyPlugins } from "@/lib/plate/plate-types";

import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { TooltipProvider } from "../plate-ui/tooltip";
import { FixedToolbar } from "../plate-ui/fixed-toolbar";
import { FixedToolbarButtons } from "../plate-ui/fixed-toolbar-buttons";
import { cn } from "@/lib/utils";
import { FloatingToolbar } from "../plate-ui/floating-toolbar";
import { FloatingToolbarButtons } from "../plate-ui/floating-toolbar-buttons";
import { CursorOverlay } from "../plate-ui/cursor-overlay";
import { useRef } from "react";
import {
  CommentsProvider,
  createCommentsPlugin,
} from "@udecode/plate-comments";
import { CommentsPopover } from "../plate-ui/comments-popover";
import { resetBlockTypePlugin } from "./reset-node-options";
import { createExitBreakPlugin } from "@udecode/plate-break";
import { exitBreakPlugin } from "./exit-break-plugin-options";
import { createComboboxPlugin } from "@udecode/plate-combobox";
import {
  createImagePlugin,
  createMediaEmbedPlugin,
  ELEMENT_IMAGE,
  ELEMENT_MEDIA_EMBED,
} from "@udecode/plate-media";
import { createCaptionPlugin } from "@udecode/plate-caption";
import { createSelectOnBackspacePlugin } from "@udecode/plate-select";
import { createAlignPlugin } from "@udecode/plate-alignment";
import { createEmojiPlugin } from "@udecode/plate-emoji";
import { createTablePlugin } from "@udecode/plate-table";
import { createLinkPlugin } from "@udecode/plate-link";
import { linkPlugin } from "./link-plugin";

type EditorProps = {
  initialValue?: any[];
  onChange?: (value: any[]) => void;
};

const plugins = createMyPlugins(
  [
    // Elements
    createCaptionPlugin({ options: [ELEMENT_IMAGE, ELEMENT_MEDIA_EMBED] }),
    createAlignPlugin({
      inject: {
        props: {
          validTypes: [
            ELEMENT_PARAGRAPH,
            ELEMENT_H1,
            ELEMENT_H2,
            ELEMENT_H3,
            ELEMENT_H4,
            ELEMENT_H5,
            ELEMENT_H6,
          ],
        },
      },
    }),
    createEmojiPlugin(),
    createImagePlugin(),
    createMediaEmbedPlugin(),
    createSelectOnBackspacePlugin({
      options: {
        query: {
          allow: [ELEMENT_IMAGE, ELEMENT_MEDIA_EMBED],
        },
      },
    }),
    createTablePlugin({
      options: {
        initialTableWidth: 600,
      },
    }),
    createParagraphPlugin(),
    createBlockquotePlugin(),
    createCodeBlockPlugin(),
    createHeadingPlugin(),

    // Marks
    createBoldPlugin(),
    createItalicPlugin(),
    createUnderlinePlugin(),
    createStrikethroughPlugin(),
    createCodePlugin(),
    createLinkPlugin({
      ...linkPlugin,
    }),

    // Functionality
    createAutoformatPlugin({
      options: {
        rules: autoformatRules as any,
        enableUndoOnDelete: true,
      },
    }),
    createBlockSelectionPlugin(),
    createComboboxPlugin(),
    createNodeIdPlugin(),
    createDndPlugin({ options: { enableScroller: true } }),
    createCommentsPlugin(),
    createResetNodePlugin({
      ...resetBlockTypePlugin,
    }),
    createExitBreakPlugin({
      ...exitBreakPlugin,
    }),
  ],
  {
    components: createPlateUI(undefined, {
      draggable: false,
    }),
  }
);

export const Editor: React.FC<EditorProps> = ({
  initialValue = [],
  onChange = console.log,
}) => {
  const containerRef = useRef(null);

  return (
    <TooltipProvider>
      <DndProvider backend={HTML5Backend}>
        <PlateProvider<MyValue>
          plugins={plugins}
          initialValue={initialValue}
          onChange={onChange}
        >
          <FixedToolbar>
            <FixedToolbarButtons />
          </FixedToolbar>
          <CommentsProvider>
            <div
              ref={containerRef}
              className={cn(
                "relative flex max-w-[900px] overflow-x-auto",
                "[&_.slate-start-area-top]:!h-4",
                "[&_.slate-start-area-left]:!w-[64px] [&_.slate-start-area-right]:!w-[64px]"
              )}
            >
              <Plate<MyValue>
                editableProps={{
                  placeholder: "Type...",
                  autoFocus: true,
                  className: cn(
                    "relative max-w-full leading-[1.4] outline-none [&_strong]:font-bold",
                    "!min-h-[600px] w-[900px] px-[96px] py-16"
                  ),
                }}
              >
                <FloatingToolbar>
                  <FloatingToolbarButtons />
                </FloatingToolbar>
                <CursorOverlay containerRef={containerRef} />
                <CommentsPopover />
              </Plate>
            </div>
          </CommentsProvider>
        </PlateProvider>
      </DndProvider>
    </TooltipProvider>
  );
};
