import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

it('renders without crashing', () => {
  const div = document.createElement('div');
  const table = {rows: []}
  ReactDOM.render(<App circles={table} rectangles={table} />, div);
});
