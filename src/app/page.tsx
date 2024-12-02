"use client";

import Textbox from "./types";
import { MouseEvent, useRef, useState, useMemo } from "react";

export default function TextEditor() {
  const [textBoxes, setTextBoxes] = useState<Textbox[]>([]);
  const [activeBoxID, setActiveBoxID] = useState<number | null>(null);
  const [draggedBoxID, setDraggedBoxID] = useState<number | null>(null);
  const [initialPosition, setInitialPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const undoStack = useRef<Textbox[][]>([]);
  const redoStack = useRef<Textbox[][]>([]);

  const activeBox = useMemo(
    () => textBoxes.find((box) => box.id === activeBoxID) || null,
    [textBoxes, activeBoxID]
  );

  const saveToUndo = (textBox: Textbox[] = textBoxes) => {
    // console.log(undoStack.current.length);
    undoStack.current.push([...textBox]);
  };

  const undo = () => {
    if (undoStack.current.length > 0) {
      const nextState = undoStack.current.pop()!;
      redoStack.current.push([...textBoxes]);
      setTextBoxes(nextState);
    }
  };

  const undoHandler = () => {
    undo();
    undo();
  };

  const redo = () => {
    if (redoStack.current.length > 0) {
      const nextState = redoStack.current.pop()!;
      saveToUndo([...textBoxes]);
      setTextBoxes(nextState);
    }
  };

  if (undoStack.current.length === 0) saveToUndo([...textBoxes]);

  const addBox = () => {
    const newBox: Textbox = {
      id: Date.now(),
      x: 50,
      y: 50,
      content: "New box",
      fontSize: 16,
      fontFamily: "Arial",
      bold: false,
      italic: false,
      underline: false,
      alignment: "Left",
    };

    setTextBoxes((prev) => {
      const updated = [...prev, newBox];
      saveToUndo(updated);
      redoStack.current = [];
      return updated;
    });

    setActiveBoxID(newBox.id);
  };

  const updateTextBox = (id: number, changes: Partial<Textbox>) => {
    setTextBoxes((prev) =>
      prev.map((box) => (box.id === id ? { ...box, ...changes } : box))
    );
    saveToUndo([...textBoxes]);
  };

  const updatePosition = (id: number, x: number, y: number) => {
    setTextBoxes((prev) =>
      prev.map((box) => (box.id === id ? { ...box, x, y } : box))
    );
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>, id: number) => {
    e.stopPropagation();
    setActiveBoxID(id);
    setDraggedBoxID(id);

    const box = textBoxes.find((box) => box.id === id);
    if (box) setInitialPosition({ x: box.x, y: box.y });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (draggedBoxID !== null) {
      const canvas = document.getElementById("canvas")!;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      updatePosition(draggedBoxID, x, y);
    }
  };

  const handleMouseUp = () => {
    if (initialPosition && draggedBoxID !== null) {
      const box = textBoxes.find((box) => box.id === draggedBoxID);
      if (box && (box.x !== initialPosition.x || box.y !== initialPosition.y)) {
        saveToUndo([...textBoxes]);
      }
    }

    setDraggedBoxID(null);
    setInitialPosition(null);
  };

  return (
    <div
      className="relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="bg-white h-[100dvh] w-[100dvw]">
        <header className="h-[10dvh] flex justify-center gap-4">
          <button className="buttons" onClick={undoHandler}>
            Undo
          </button>
          <button className="buttons" onClick={redo}>
            Redo
          </button>
        </header>

        <main className="bg-slate-200 h-[80dvh]">
          <div
            id="canvas"
            className="bg-white h-[75dvh] w-[80dvw] mx-auto rounded relative"
            onMouseDown={() => setActiveBoxID(null)}
          >
            {textBoxes.map((box) => (
              <div
                key={box.id}
                className={`absolute p-2 rounded border ${
                  activeBoxID === box.id
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
                }}
                contentEditable={activeBoxID === box.id}
                suppressContentEditableWarning
                onMouseDown={(e) => handleMouseDown(e, box.id)}
                onBlur={() => setActiveBoxID(null)}
                onInput={(e) =>
                  updateTextBox(box.id, { content: e.currentTarget.innerText })
                }
              >
                {box.content}
              </div>
            ))}
          </div>
        </main>

        <footer className="flex justify-center gap-5 h-[10dvh]">
          <select
            className="buttons"
            onChange={(e) =>
              activeBox &&
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
            value={activeBox?.fontSize || 16}
            onChange={(e) =>
              activeBox &&
              updateTextBox(activeBox.id, {
                fontSize: parseInt(e.target.value, 10),
              })
            }
          />

          <button
            className={`buttons ${activeBox?.bold ? "bg-slate-400" : ""}`}
            onClick={() =>
              activeBox &&
              updateTextBox(activeBox.id, { bold: !activeBox.bold })
            }
          >
            B
          </button>
          <button
            className={`buttons ${activeBox?.italic ? "bg-slate-400" : ""}`}
            onClick={() =>
              activeBox &&
              updateTextBox(activeBox.id, { italic: !activeBox.italic })
            }
          >
            I
          </button>
          <button
            className={`buttons ${activeBox?.underline ? "bg-slate-400" : ""}`}
            onClick={() =>
              activeBox &&
              updateTextBox(activeBox.id, { underline: !activeBox.underline })
            }
          >
            U
          </button>
          <button className="buttons bg-blue-500 text-white" onClick={addBox}>
            + Add text box
          </button>
        </footer>
      </div>
    </div>
  );
}
