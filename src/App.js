import React, { useEffect, useLayoutEffect, useState, Component } from "react";
import rough from "roughjs/bundled/rough.esm";
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import ReactDOM from 'react-dom';
import { Button, Drawer } from '@material-ui/core';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import PanToolIcon from '@material-ui/icons/PanTool';
import ShowChartIcon from '@material-ui/icons/ShowChart';
import Select from 'react-select';
import CreateIcon from '@material-ui/icons/Create';
import BorderColorIcon from '@material-ui/icons/BorderColor';
import { SketchPicker } from 'react-color';

import "./App.css";
import { PlayCircleFilledWhite } from "@material-ui/icons";
const mousemovement = false;
const generator = rough.generator();

const createElement = (id, x1, y1, x2, y2, type) => {
  const roughElement =
    type === "line" && mousemovement === false
      ? generator.line(x1, y1, x2, y2)
      : generator.rectangle(x1, y1, x2 - x1, y2 - y1);
  return { id, x1, y1, x2, y2, type, roughElement };
};

const nearPoint = (x, y, x1, y1, name) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
};

const positionWithinElement = (x, y, element) => {
  const { type, x1, x2, y1, y2 } = element;
  if (type === "rectangle") {
    const topLeft = nearPoint(x, y, x1, y1, "tl");
    const topRight = nearPoint(x, y, x2, y1, "tr");
    const bottomLeft = nearPoint(x, y, x1, y2, "bl");
    const bottomRight = nearPoint(x, y, x2, y2, "br");
    const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
    return topLeft || topRight || bottomLeft || bottomRight || inside;
  } else{
    const a = { x: x1, y: y1 };
    const b = { x: x2, y: y2 };
    const c = { x, y };
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));
    const start = nearPoint(x, y, x1, y1, "start");
    const end = nearPoint(x, y, x2, y2, "end");
    const inside = Math.abs(offset) < 1 ? "inside" : null;
    return start || end || inside;
  }
};

const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const getElementAtPosition = (x, y, elements) => {
  return elements
    .map(element => ({ ...element, position: positionWithinElement(x, y, element) }))
    .find(element => element.position !== null);
};

const adjustElementCoordinates = element => {
  const { type, x1, y1, x2, y2 } = element;
  if (type === "rectangle") {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return { x1: minX, y1: minY, x2: maxX, y2: maxY };
  } else {
    if (x1 < x2 || (x1 === x2 && y1 < y2)) {
      return { x1, y1, x2, y2 };
    } else {
      return { x1: x2, y1: y2, x2: x1, y2: y1 };
    }
  }
};

const cursorForPosition = position => {
  switch (position) {
    case "tl":
    case "br":
    case "start":
    case "end":
      return "nwse-resize";
    case "tr":
    case "bl":
      return "nesw-resize";
    default:
      return "move";
  }
};

const resizedCoordinates = (clientX, clientY, position, coordinates) => {
  const { x1, y1, x2, y2 } = coordinates;
  switch (position) {
    case "tl":
    case "start":
      return { x1: clientX, y1: clientY, x2, y2 };
    case "tr":
      return { x1, y1: clientY, x2: clientX, y2 };
    case "bl":
      return { x1: clientX, y1, x2, y2: clientY };
    case "br":
    case "end":
      return { x1, y1, x2: clientX, y2: clientY };
    default:
      return null; //should not really get here...
  }
};

const useHistory = initialState => {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([initialState]);

  const setState = (action, overwrite = false) => {
    const newState = typeof action === "function" ? action(history[index]) : action;
    if (overwrite) {
      const historyCopy = [...history];
      historyCopy[index] = newState;
      setHistory(historyCopy);
    } else {
      const updatedState = [...history].slice(0, index + 1);
      setHistory([...updatedState, newState]);
      setIndex(prevState => prevState + 1);
    }
  };

  const undo = () => index > 0 && setIndex(prevState => prevState - 1);
  const redo = () => index < history.length - 1 && setIndex(prevState => prevState + 1);

  return [history[index], setState, undo, redo];
};

const App = () => {
  const [elements, setElements, undo, redo] = useHistory([]);
  const [action, setAction] = useState("none");
  const [tool, setTool] = useState("line");
  const [selectedElement, setSelectedElement] = useState(null);

  useLayoutEffect(() => {
    const canvas = document.getElementById("mycanvas");
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    const roughCanvas = rough.canvas(canvas);

    elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement));
  }, [elements]);

  useEffect(() => {
    const undoRedoFunction = event => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    document.addEventListener("keydown", undoRedoFunction);
    return () => {
      document.removeEventListener("keydown", undoRedoFunction);
    };
  }, [undo, redo]);

  const updateElement = (id, x1, y1, x2, y2, type) => {
    const updatedElement = createElement(id, x1, y1, x2, y2, type);

    const elementsCopy = [...elements];
    elementsCopy[id] = updatedElement;
    setElements(elementsCopy, true);
  };

  const handleMouseDown = event => {
    const { clientX, clientY } = event;
    if (tool === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        const offsetX = clientX - element.x1;
        const offsetY = clientY - element.y1;
        setSelectedElement({ ...element, offsetX, offsetY });
        setElements(prevState => prevState);

        if (element.position === "inside") {
          setAction("moving");
        } else {
          setAction("resizing");
        }
      }
    } else {
      const id = elements.length;
      const element = createElement(id, clientX, clientY, clientX, clientY, tool);
      setElements(prevState => [...prevState, element]);
      setSelectedElement(element);

      setAction("drawing");
    }
  };

  const handleMouseMove = event => {
    const { clientX, clientY } = event;

    if (tool === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements);
      event.target.style.cursor = element ? cursorForPosition(element.position) : "default";
    }

    if (action === "drawing" ) {
      const index = elements.length - 1;
      const { x1, y1 } = elements[index];
      updateElement(index, x1, y1, clientX, clientY, tool);
    } else if (action === "moving") {
      const { id, x1, x2, y1, y2, type, offsetX, offsetY } = selectedElement;
      const width = x2 - x1;
      const height = y2 - y1;
      const newX1 = clientX - offsetX;
      const newY1 = clientY - offsetY;
      updateElement(id, newX1, newY1, newX1 + width, newY1 + height, type);
    } else if (action === "resizing") {
      const { id, type, position, ...coordinates } = selectedElement;
      const { x1, y1, x2, y2 } = resizedCoordinates(clientX, clientY, position, coordinates);
      updateElement(id, x1, y1, x2, y2, type);
    }
  };

  const handleMouseUp = () => {
    if (selectedElement) {
      const index = selectedElement.id;
      const { id, type } = elements[index];
      if (action === "drawing" || action === "resizing") {
        const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index]);
        updateElement(id, x1, y1, x2, y2, type);
      }
    }
    setAction("none");
    setSelectedElement(null);
  };


  useEffect(()=>{
  
    const canvas = document.getElementById('mycanvas');
    const ctx = canvas.getContext('2d');
    window.addEventListener('load', ()=>{
    resize();
    document.addEventListener('mousedown', Freehand);
    document.addEventListener('mouseup', stopFreehand);
    document.addEventListener("mousemove", draw);
    window.addEventListener('resize',resize);
    });
   
   
    function resize(){
      ctx.canvas.width = window.innerWidth;
      ctx.canvas.height = window.innerHeight;
    }
    let crd ={x:0 , y:0};
    let startPaint = false;
    function getPosition(event){
      crd.x = event.clientX - canvas.offsetLeft;
      crd.y = event.clientY - canvas.offsetTop;
    }
    function Freehand(event){
      startPaint = true;
      getPosition(event);
    }
    function stopFreehand(){
      startPaint = false;
    }
    function draw(event){
      if(!startPaint) return;
      ctx.beginPath();
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'red';
      ctx.moveTo(crd.x,crd.y);
      getPosition(event);
      ctx.lineTo(crd.x,crd.y);
      ctx.stroke();
    }
    function erase(){
      ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
    }
    
    
  });
  var x = "black",
    y = 2;

    function color(obj) {
      switch (obj.id) {
          case "green":
              x = "green";
              break;
          case "blue":
              x = "blue";
              break;
          case "red":
              x = "red";
              break;
          case "yellow":
              x = "yellow";
              break;
          case "orange":
              x = "orange";
              break;
          case "black":
              x = "black";
              break;
          case "white":
              x = "white";
              break;
      }
      if (x == "white") y = 14;
      else y = 2;
  
  }
  
  
  
 
  var colors=[
    {
      value:1,
      label:"light",
      colour:"white"
    },
    {
      value:2,
      label:"Dark",
      colour:"#162447"
    }
  ];
  var[color, setColor] = useState(colors.colour);
  var themehandler= event=>
  {
    setColor(event.colour);
  }

  return (
    <div>
       <div className="erase">Eraser</div>
    <div  className="box" id="white" onclick="color(this)"></div>
    <div className="tool-box">
    <style>{'body{background-color:'+color+';}'}</style>
    <SketchPicker/>
           
      <div className="Draw">
        <Select options={colors} onChange={themehandler}></Select>
        <input
          type="radio"
          id="selection"
          checked={tool === "selection"}
          onChange={() => setTool("selection")}
        />
        <label className="selection" htmlFor="selection"><PanToolIcon variant="filled" color="primary" fontSize="large"></PanToolIcon></label>
        <input type="radio" id="line" checked={tool === "line"} onChange={() => setTool("line")} />
        <label className="Freehand"><CreateIcon variant="filled" color="inherit" fontSize="large"></CreateIcon></label>
        <label className="line" htmlFor="line"><ShowChartIcon variant="filled" color="inherit" fontSize="large"></ShowChartIcon></label>
        <input
          type="radio"
          id="rectangle"
          checked={tool === "rectangle"}
          onChange={() => setTool("rectangle")}
        />
        <label className="rectangle" htmlFor="rectangle"><SelectAllIcon variant="filled" color="inherit" fontSize="large"></SelectAllIcon></label>
        <label className="colorpicker"><BorderColorIcon variant="filled" color="primary" fontSize="large"></BorderColorIcon></label>
        <label className="undo" onClick={undo}><UndoIcon variant="filled" color="secondary" fontSize="large"></UndoIcon></label>
        <label className="redo" onClick={redo}><RedoIcon variant="filled" color="action" fontSize="large"></RedoIcon></label>
        </div>
      <canvas
        id="mycanvas"
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        Canvas
      </canvas>

    </div>
    </div>
  );
};
class App1 extends React.Component {

  render() {
    return <SketchPicker />;
  }
}
ReactDOM.render(<App1/>, document.getElementById("root"));


export default App;

