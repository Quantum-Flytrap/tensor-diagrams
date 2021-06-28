import { greet } from './main';
// import { TensorDiagram } from './diagrams'

test('the data is peanut butter', () => {
  expect(1).toBe(1);
});

test('greeting', () => {
  expect(greet('Foo')).toBe('Hello Foo');
});

// // // import/export jest + d issue
// test('initializes', () => {
//   const diagram = TensorDiagram.new();
//   expect(diagram.tensors.length).toBe(2);
//   expect(diagram.contractions.length).toBe(0);
//   expect(diagram.lines.length).toBe(0);
// });

// test('adds tenssrs', () => {
//   const diagram = TensorDiagram.new()
//     .addTensor("v", { x: 0, y: 0 }, [], ["i"])
//     .addTensor("A", "right", ["i"], ["j"])
//     .addTensor("B", { x: 3, y: 0 }, ["j"], ["k"])
//     .addTensor("T", "down", ["k"], ["j", "l", "m"])

//   expect(diagram.tensors.length).toBe(4);
// });
