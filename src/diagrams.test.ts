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
