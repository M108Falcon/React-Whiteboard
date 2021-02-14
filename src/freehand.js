import React from 'react';
import ReactDOM from 'react-dom';
import { SliderPicker } from 'react-color';
import { Slider } from '@material-ui/core';

class App1 extends React.Component {
  state = {
    background: '#fff',
  };

  handleChangeComplete = (color) => {
    this.setState({ background: color.hex });
  };

  render() {
    return (
      <SliderPicker color={ this.state.background } onChangeComplete={ this.handleChangeComplete }/>
     
    );
  }
}
export default App1;