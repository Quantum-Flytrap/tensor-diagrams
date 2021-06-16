/**
 * This file is the entrypoint of browser builds.
 * The code executes when loaded in a browser.
 */
import { TensorDiagram } from './diagrams'

// instead of casting window to any, you can extend the Window interface: https://stackoverflow.com/a/43513740/5433572
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).TensorDiagram = TensorDiagram;
