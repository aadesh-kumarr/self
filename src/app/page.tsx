"use client";
import Textbox from "./types";
import { MouseEvent, useRef, useState } from "react";

export default function Text_Editor() {
  const [textBoxes, setTextBoxes] = useState<Textbox[]>([]);
  const [activeboxID, setActivebox] = useState<number | null>(null);
  const [draggedboxID, setDraggedboxID] = useState<number | null>(null);
  const [initalPosition, setInitialPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const activeBox = textBoxes.find((box) => box.id === activeboxID);

  const undostack = useRef<Textbox[][]>([]);
  const redoStack = useRef<Textbox[][]>([]);

  const undo = () => {
    console.log(undostack.current.length)
    
    if (undostack.current.length > 0) {
      const previous = undostack.current.pop()!;
      redoStack.current.push([...textBoxes]);
      setTextBoxes(previous);
      console.log(undostack.current.length)
    }
  };

  const redo = () => {
    if (redoStack.current.length > 0) {
      const next = redoStack.current.pop()!;
      undostack.current.push([...textBoxes]);
      setTextBoxes(next);
    }
  };

  const saveToUndo = () => {
    console.log("undo stack", undostack);
    console.log(redoStack);
    undostack.current.push([...textBoxes]);
    redoStack.current = [];

  };

  const addBox = () => {
    if(undostack.current.length===0){
      console.log(undostack.current.length)
      saveToUndo();
    }
    console.log(undostack.current.length)
    console.log("add box");
    
    // Create the new box
    const newBox: Textbox = {
      id: Date.now(),
      x: 50,
      y: 50,
      content: "new box",
      fontSize: 16,
      fontFamily: "Arial",
      bold: false,
      italic: false,
      underline: false,
      alignment: "Left",
    };
    
    // Update the state and save it to the undo stack in one step
    setTextBoxes((prev) => {
      const updatedBoxes = [...prev, newBox];
      undostack.current.push(updatedBoxes);
      redoStack.current = []; // Clear redo stack as a new change has occurred
      console.log(undostack.current.length)
      return updatedBoxes;
    });
  };
  

  const updateTextBox = (id: number, changes: Partial<Textbox>) => {
    setTextBoxes((prev) =>
      prev.map((box) => (box.id === id ? { ...box, ...changes } : box))
    );
    saveToUndo();
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (draggedboxID !== null) {
      const canvas = document.getElementById("canvas")!;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      updatePosition(draggedboxID, x, y);
    }
  };

  const updatePosition = (id: number, x: number, y: number) => {
    setTextBoxes((prev) =>
      prev.map((box) => (box.id === id ? { ...box, x, y } : box))
    );
  };

  const handleMouseUp = () => {
    if (initalPosition && draggedboxID !== null) {
      const box = textBoxes.find((box) => box.id === draggedboxID);
      if (box && (box.x !== initalPosition.x || box.y !== initalPosition.y)) {
        saveToUndo();
      }
    }

    setDraggedboxID(null);
    setInitialPosition(null);
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>, id: number) => {
    e.stopPropagation();
    setActivebox(id);
    setDraggedboxID(id);

    const box = textBoxes.find((box) => box.id === id);
    if (box) {
      setInitialPosition({ x: box.x, y: box.y });
    }
  };

  return (
    <div
      className="relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="bg-white h-[100dvh] w-[100dvw]">
        <div className="h-[10dvh] text-lg content-center" id="upper">
          <div className="flex flex-row justify-center gap-4 " id="container">
            <button className="flex flex-col buttons">
              <p onClick={undo}>Undo</p>
              <p></p>
            </button>
            <button className="flex flex-col buttons">
              <p onClick={redo}>Redo</p>
              <p></p>
            </button>
          </div>
        </div>

        <div className="bg-slate-200 h-[80dvh] content-center" id="mid">
          <div
            className="bg-white h-[75dvh] w-[80dvh] mx-auto rounded relative"
            id="canvas"
            onMouseDown={() => setActivebox(null)}
          >
            {textBoxes.map((box) => (
              <div
                key={box.id}
                className={`absolute p-2 rounded border ${
                  activeboxID === box.id
                    ? "border-blue-500"
                    : "border-transparent"
                }`}
                style={{
                  top: `${box.y}px`,
                  left: `${box.x}px`,
                  fontSize: `${box.fontSize}px`,
                  fontWeight: box.bold ? "bold" : "normal",
                  fontStyle: box.italic ? "italic" : "normal",
                  textDecoration: box.underline ? "underline" : "none",
                  fontFamily: box.fontFamily,
                  textAlign:
                    box.alignment.toLowerCase() as React.CSSProperties["textAlign"],
                  border: activeboxID === box.id ? "1px solid blue" : "none",
                  padding: "4px",
                }}
                contentEditable={activeboxID === box.id}
                suppressContentEditableWarning
                onMouseDown={(e) => handleMouseDown(e, box.id)}
                onInput={(e) => {
                  updateTextBox(box.id, {
                    content: (e.target as HTMLDivElement).ariaValueText || "",
                  });
                }}
              >
                {box.content}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-5 h-[10dvh]" id="lower">
          <select
            className="buttons"
            title="Select Font"
            id=""
            onChange={(e) =>
              updateTextBox(activeBox.id, { fontFamily: e.target.value })
            }
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
          </select>

          <input
            type="number"
            className="buttons"
            min={8}
            max={72}
            value={activeBox?.fontSize}
            onChange={(e) =>
              updateTextBox(activeBox.id, {
                fontSize: parseInt(e.target.value, 10),
              })
            }
          />

          <button
            onClick={() =>
              updateTextBox(activeBox.id, { bold: !activeBox?.bold })
            }
            className={`buttons ${
              activeBox?.bold ? "bg-slate-400" : "hover:bg-slate-300+"
            }`}
          >
            B
          </button>

          <button
            onClick={() =>
              updateTextBox(activeBox.id, { italic: !activeBox?.italic })
            }
            className={`buttons ${
              activeBox?.italic ? "bg-slate-400" : "hover:bg-slate-300+"
            }`}
          >
            I
          </button>
          <button
            onClick={() =>
              updateTextBox(activeBox.id, { underline: !activeBox?.underline })
            }
            className={`buttons ${
              activeBox?.underline ? "bg-slate-400" : "hover:bg-slate-300+"
            }`}
          >
            U
          </button>

          <button className="buttons bg-blue-500 text-white" onClick={addBox}>
            + Add text box
          </button>
        </div>
      </div>
    </div>
  );
}
