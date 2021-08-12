import {
  Contraction, ContractionRef, Indice, IndiceDrawable, LabelPos, Line, Pos, RelPos, Shape, Tensor, TensorOpts, XY,
} from './interfaces';

const opposite = (pos: Pos): Pos => {
  const mapping: Record<Pos, Pos> = {
    left: 'right',
    right: 'left',
    up: 'down',
    down: 'up',
  };
  return mapping[pos];
};

export default class TensorDiagramCore {
  tensors: Tensor[] = [];

  contractions: ContractionRef[] = [];

  lines: Line[] = [];

  width = 300;

  height = 300;

  constructor(tensors: Tensor[], contractions: Contraction[], lines: Line[]) {
    this.tensors = tensors;

    // mapping contractions and setting defaults
    this.contractions = contractions.map(({
      source, target, name, pos,
    }) => ({
      source: this.tensors[source],
      target: this.tensors[target],
      name,
      pos: pos || 'up',
    }));

    this.lines = lines;
  }

  /**
   * Create a new tensor diagram.
   * @returns A bare tensor diagram.
   */
  static new(): TensorDiagramCore {
    return new TensorDiagramCore([], [], []);
  }

  static createTensor(
    x: number,
    y: number,
    name: string,
    indices: Indice[] = [],
    shape: Shape = 'circle',
    showLabel = true,
    labPos: LabelPos = 'up',
    size = 20,
  ): Tensor {
    const rectHeight = Math.max(
      indices.filter((indice) => indice.pos === 'right').length,
      indices.filter((indice) => indice.pos === 'left').length,
    );
    return {
      x,
      y,
      name,
      shape,
      showLabel,
      labPos,
      size,
      indices,
      rectHeight,
    };
  }

  get lastTensor(): Tensor {
    return this.tensors[this.tensors.length - 1];
  }

  /**
   * A convenient chainable way of adding tensors.
   * diagram.addTensor().addTensor("M", "right" ["i"], ["j"])
   * @param name Tensor name.
   * @param position Position { x, y } in integers, or "right"/"down" to add sequentially.
   * @param left Indice names for left.
   * @param right Indice names for right.
   * @param up Indice names for up.
   * @param down Indice names for down.
   * @param shape Visual shape of the tensor.
   * @returns An updated TensorDiagram, so it is chainable.
   */
  addTensor(
    name: string,
    position: RelPos,
    left: string[] = [],
    right: string[] = [],
    up: string[] = [],
    down: string[] = [],
    opts: TensorOpts = {},
  ): TensorDiagramCore {
    let pos: XY = { x: 0, y: 0 };
    switch (position) {
      case 'start':
        break;
      case 'right':
        pos = { x: this.lastTensor.x + 1, y: this.lastTensor.y };
        break;
      case 'down':
        pos = { x: this.lastTensor.x, y: this.lastTensor.y + 1 };
        break;
      default:
        pos = position;
    }
    const inds1 = left.map((s): Indice => ({ name: s, pos: 'left', showLabel: true }));
    const inds2 = right.map((s): Indice => ({ name: s, pos: 'right', showLabel: true }));
    const inds3 = up.map((s): Indice => ({ name: s, pos: 'up', showLabel: true }));
    const inds4 = down.map((s): Indice => ({ name: s, pos: 'down', showLabel: true }));
    const indices = [...inds1, ...inds2, ...inds3, ...inds4];
    const bigTensor = inds1.length > 1 || inds2.length > 1;
    const tensor = TensorDiagramCore.createTensor(
      pos.x,
      pos.y,
      name,
      indices,
      opts.shape ?? (bigTensor ? 'rectangle' : 'circle'),
      opts.showLabel ?? true,
      opts.labelPos,
      opts.size,
    );
    this.tensors.push(tensor);
    return this;
  }

  /**
   * A convenient chainable way of adding contractions.
   * diagram.addContraction(0, 2, "j")
   * @param i Source tensor id.
   * @param j Targer tensor id.
   * @param name Indice name.
   * @param pos
   * @returns An updated TensorDiagram, so it is chainable.
   * @todo Check if an indice exists in both tensors.
   */
  addContraction(i: number, j: number, name: string, pos: Pos = 'up'): TensorDiagramCore {
    const contraction: ContractionRef = {
      source: this.tensors[i],
      target: this.tensors[j],
      name,
      pos,
    };
    this.contractions.push(contraction);
    return this;
  }

  /**
   * Sum over an indice with a selected name.
   * If there are exactly two, it results in a typical contraction.
   * If there is one or more than two - it creates a dot symbol.
   * @param name Indice name.
   * @param position Dot position. If not specified, it will use a default pos (average).
   * @returns  An updated TensorDiagram, so it is chainable.
   */
  addSummation(name: string, position?: XY): TensorDiagramCore {
    const relevantTensors = this.tensors.filter((tensor) => tensor.indices.some((indice) => indice.name === name));
    const dotOpts: TensorOpts = { shape: 'dot', showLabel: false };
    switch (relevantTensors.length) {
      case 0:
        throw new Error(`addSummation error: no tensors with an indice ${name}`);
      case 1:
        // eslint-disable-next-line no-case-declarations
        const oneTensor = relevantTensors[0];
        // eslint-disable-next-line no-case-declarations
        const indicePos = oneTensor.indices.filter((indice) => indice.name === name)[0].pos;
        switch (indicePos) {
          case 'left':
            this.addTensor('dot', { x: oneTensor.x - 1, y: oneTensor.y }, [], [name], [], [], dotOpts);
            break;
          case 'right':
            this.addTensor('dot', { x: oneTensor.x + 1, y: oneTensor.y }, [name], [], [], [], dotOpts);
            break;
          case 'up':
            this.addTensor('dot', { x: oneTensor.x, y: oneTensor.y - 1 }, [], [], [], [name], dotOpts);
            break;
          case 'down':
            this.addTensor('dot', { x: oneTensor.x, y: oneTensor.y + 1 }, [], [], [name], [], dotOpts);
            break;
          default:
            throw new Error(`Invalid position ${indicePos} for indice ${name}`);
        }
        this.addContraction(this.tensors.indexOf(oneTensor), this.tensors.length - 1, name);
        break;
      case 2:
        this.addContraction(this.tensors.indexOf(relevantTensors[0]), this.tensors.indexOf(relevantTensors[1]), name);
        break;
      default:
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.addTensor('dot', position!, [], [], [], [], dotOpts);
        // eslint-disable-next-line no-case-declarations
        const dotTensor = this.lastTensor;
        relevantTensors.forEach((tensor, i) => {
          // assumes that only one indice with such name
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const indice = tensor.indices.find((ind) => ind.name === name)!;
          const newName = `${name}${i}`; // kind of dirty
          dotTensor.indices.push({
            pos: opposite(indice.pos),
            name: newName,
            showLabel: false,
          });
          indice.name = newName; // kind of dirty
          this.addContraction(this.tensors.indexOf(tensor), this.tensors.length - 1, newName);
        });
        break;
    }
    return this;
  }

  setSize(width: number, height: number): TensorDiagramCore {
    this.width = width;
    this.height = height;
    return this;
  }

  /**
   * Generate a formula string for NumPy, PyTorch and TensorFlow conventions for einsum.
   * E.g. einsum('ij,jk->ik', A, B)
   * https://numpy.org/doc/stable/reference/generated/numpy.einsum.html
   * https://pytorch.org/docs/master/generated/torch.einsum.html#torch.einsum
   * https://www.tensorflow.org/api_docs/python/tf/einsum
   * @returns A string representing the formula.
  */
  toFormulaEinsum(): string {
    const indiceNames = this.tensors.map((tensor) => tensor.indices.map((indice) => indice.name));
    const tensorNames = this.tensors.map((tensor) => tensor.name);
    const indicesAll = indiceNames.flatMap((name) => name);
    const indicesContracted = this.contractions.map((contraction) => contraction.name);
    const indicesFree: string[] = [];
    indicesAll.forEach((name) => {
      if (!indicesContracted.includes(name) && !indicesFree.includes(name)) {
        indicesFree.push(name);
      }
    });
    const indicesPerTensorStr = indiceNames.map((ids) => ids.join('')).join(',');
    const indicesFreeStr = indicesFree.join('');
    const tensorNamesStr = tensorNames.join(', ');

    return `einsum('${indicesPerTensorStr}->${indicesFreeStr}', ${tensorNamesStr})`;
  }

  /**
   * Generate a LaTeX formula.
   * E.g. \sum_{j} A_{ij} B_{jk}
   * @returns A string representing the formula.
  */
  toFormulaLaTeX(): string {
    const tensorsLaTeX = this.tensors.map((tensor) => {
      const indicesStr = tensor.indices.map((indice) => indice.name).join('');
      return `${tensor.name}_{${indicesStr}}`;
    });
    const indicesContracted = this.contractions.map((contraction) => contraction.name);

    return `\\sum_{${indicesContracted.join('')}} ${tensorsLaTeX.join(' ')}`;
  }

  /**
   * (Internal function)
   * @returns Loose indice lines.
   */
  looseIndices(): IndiceDrawable[][] {
    const shifts = {
      up: [0.00, -0.75],
      down: [0.00, 0.75],
      left: [-0.75, 0.00],
      right: [0.75, 0.00],
    };

    const contractedIndicesNames = this.contractions.map((contraction) => contraction.name);

    return this.tensors.map((tensor) => tensor.indices
      .filter((indice) => !contractedIndicesNames.includes(indice.name))
      .map((indice) => {
        let shiftYPerIndice = 0;
        let shiftYRectDown = 0;

        if (tensor.shape === 'rectangle') {
          if (indice.pos === 'right' || indice.pos === 'left') {
            // check if there is more than one indice either left or right
            shiftYPerIndice = tensor.indices.filter((ind) => ind.pos === indice.pos).indexOf(indice);
          }

          if (indice.pos === 'down') { shiftYRectDown = tensor.rectHeight - 1; }
        }

        // get how much an indice should move to any cardinal point
        const dv = shifts[indice.pos];

        return {
          pos: indice.pos,
          name: indice.name,
          showLabel: indice.showLabel,
          source: {
            x: tensor.x,
            y: tensor.y + shiftYPerIndice,
          },
          target: {
            x: tensor.x + dv[0],
            y: tensor.y + dv[1] + shiftYPerIndice + shiftYRectDown,
          },
          labelPosition: {
            x: tensor.x + 1.4 * dv[0],
            y: tensor.y + 1.4 * dv[1] + shiftYPerIndice + shiftYRectDown,
          },
        };
      }));
  }
}
