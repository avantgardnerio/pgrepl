import React, { Component } from 'react';

class App extends Component {
  render() {
    return (
      <div className="App">
          <svg width="100" height="100">
              <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
          </svg>
          <div>
          Hello world!
          </div>
      </div>
    );
  }
}

export default App;
