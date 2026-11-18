import type { ComponentProps } from "react";
import { Code as StandardCode } from "../../utils/notion-components";
import { isInteractiveBlock } from "./parser";

export function RecapCode({ block }: ComponentProps<typeof StandardCode>) {
  return isInteractiveBlock(block) ? null : <StandardCode block={block} />;
}
