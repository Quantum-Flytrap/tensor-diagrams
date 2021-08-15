# Tensor diagrams - Penrose graphical notation in D3.js

[![npm version](https://badge.fury.io/js/tensor-diagrams.svg)](https://badge.fury.io/js/tensor-diagrams)
![License](https://img.shields.io/npm/l/tensor-diagrams)
![Buld status](https://github.com/Quantum-Game/tensor-diagrams/actions/workflows/lint-and-test.yml/badge.svg)
[![Twitter @QuantumGameIO](https://img.shields.io/twitter/follow/QuantumGameIO)](https://twitter.com/quantumgameio)

A package for creating visual tensor diagrams using [Penrose graphical notation](https://en.wikipedia.org/wiki/Penrose_graphical_notation) in D3js. For machine learning, deep learning, quantum computing, quantum information, and other array operations. By [Piotr Migdał](https://p.migdal.pl/) and [Claudia Zendejas-Morales](https://claudiazm.xyz/) from [Quantum Flytrap](https://quantumflytrap.com/).  

A simple live version: https://jsfiddle.net/stared/60ndm3co/.

Inspirations include:

* [tensornetwork.org/diagrams](http://tensornetwork.org/diagrams/)
* [Matrices as Tensor Network Diagrams](https://www.math3ma.com/blog/matrices-as-tensor-network-diagrams) by Tai-Danae Bradley
* [Drawing Trace Diagrams with TikZ](http://elishapeterson.wikidot.com/tikz:diagrams) by Elisha Peterson
* Piotr's longstanding interest in data visualization of array operations
  * [⟨𝜑|𝜓⟩.vue - a Vue-based visualization of quantum states and operations](https://github.com/Quantum-Game/bra-ket-vue)
  * [Simple diagrams of convoluted neural networks](https://p.migdal.pl/2018/09/15/simple-diagrams-deep-learning.html)
  * [Symmetries and self-similarity of many-body wavefunctions](https://arxiv.org/abs/1412.6796)

If you want to use tensors in the browser, you may be looking for the [Quantum-Game/quantum-tensors](https://github.com/Quantum-Game/quantum-tensors) NPM package. If you are looking to visualize complex vectors and operators (especially for quantum computing), see [https://github.com/Quantum-Game/bra-ket-vue](https://github.com/Quantum-Game/bra-ket-vue).

## Local setup

Created using a NPM TypeScript frontend boilerplate [metachris/typescript-boilerplate](https://github.com/metachris/typescript-boilerplate/), which uses [esbuild](https://esbuild.github.io/), and is described in detail in [Blog post: Starting a TypeScript Project in 2021](https://www.metachris.com/2021/03/bootstrapping-a-typescript-node.js-project/).

```bash
# Clone the repository
git clone https://github.com/Quantum-Flytrap/tensor-diagrams
cd tensor-diagrams

# Install dependencies
yarn install

# Now you can run various yarn commands:
yarn lint
yarn test
yarn build-all
yarn esbuild-browser
yarn docs
```


## Feedback

The easiest feedback is by opening a [GitHub Issue](https://github.com/Quantum-Flytrap/tensor-diagrams/issues).
