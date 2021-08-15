import TensorDiagramCore from './diagrams';

test('initializes', () => {
  const diagram = TensorDiagramCore.new();
  expect(diagram.tensors.length).toBe(0);
  expect(diagram.contractions.length).toBe(0);
  expect(diagram.lines.length).toBe(0);
});

test('adds tensors', () => {
  const diagram = TensorDiagramCore.new()
    .addTensor('v', { x: 0, y: 0 }, [], ['i'])
    .addTensor('A', 'right', ['i'], ['j'])
    .addTensor('B', { x: 3, y: 0 }, ['j'], ['k'])
    .addTensor('T', 'down', ['k'], ['j', 'l', 'm']);

  expect(diagram.tensors.length).toBe(4);
});

test('adds contractions', () => {
  const diagram = TensorDiagramCore.new()
    .addTensor('v', 'start', [], ['i'])
    .addTensor('T', 'right', ['i'], ['j'], [], ['k'])
    .addTensor('A', 'right', ['j'], ['n'])
    .addTensor('B', { x: 1, y: 1 }, [], [], ['k'], ['m'])
    .addContraction(0, 1, 'i')
    .addContraction(1, 2, 'j')
    .addContraction(1, 3, 'k');

  expect(diagram.contractions.length).toBe(3);
});

test('adds summation', () => {
  const diagram = TensorDiagramCore.new()
    .addTensor('v', { x: 0, y: 0 }, [], ['i'])
    .addTensor('A', 'right', ['i'], ['j'])
    .addTensor('B', { x: 3, y: 0 }, ['j'], ['k'])
    .addTensor('T', 'down', ['k'], ['j', 'l', 'm'])
    .addSummation('i')
    .addSummation('j', { x: 2, y: 0 })
    .addSummation('k');

  expect(diagram.tensors.length).toBe(5);
  expect(diagram.contractions.length).toBe(5);
});

test('adds loop', () => {
  const diagram = TensorDiagramCore.new()
    .addTensor('A', 'start', ['i'], ['j'])
    .addTensor('B', 'right', ['j'], ['i'])
    .addSummation('i')
    .addSummation('j');

  expect(diagram.tensors.length).toBe(2);
  expect(diagram.contractions.length).toBe(2);
});

test('adds self-loop', () => {
  const diagram = TensorDiagramCore.new()
    .addTensor('A', 'start', ['i'], ['i'])
    .addContraction(0, 0, 'i');
    // .addSummation('i'); - for now does not work well

  expect(diagram.tensors.length).toBe(1);
  expect(diagram.contractions.length).toBe(1);
});

test('generating formulas - trace', () => {
  const diagram = TensorDiagramCore.new()
    .addTensor('A', 'start', ['i'], ['i'])
    .addContraction(0, 0, 'i');

  expect(diagram.toFormulaEinsum()).toBe("einsum('ii->', A)");
  expect(diagram.toFormulaLaTeX()).toBe('\\sum_{i} A_{ii}');
});

test('generating formulas - tensors', () => {
  const diagram = TensorDiagramCore.new()
    .addTensor('v', 'start', [], ['i'])
    .addTensor('T', 'right', ['i'], ['j'], [], ['k'])
    .addTensor('A', 'right', ['j'], ['n'])
    .addTensor('B', { x: 1, y: 1 }, [], [], ['k'], ['m'])
    .addContraction(0, 1, 'i')
    .addContraction(1, 2, 'j')
    .addContraction(1, 3, 'k');

  expect(diagram.toFormulaEinsum()).toBe("einsum('i,ijk,jn,km->nm', v, T, A, B)");
  expect(diagram.toFormulaLaTeX()).toBe('\\sum_{ijk} v_{i} T_{ijk} A_{jn} B_{km}');
});
