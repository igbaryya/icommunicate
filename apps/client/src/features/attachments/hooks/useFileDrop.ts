import { useRef, useState, type DragEvent } from 'react';

const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes('Files');

/** A depth counter avoids flicker from dragenter/dragleave firing on every child element. */
export function useFileDrop(onFiles: (files: File[]) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const depth = useRef(0);

  const dropZoneProps = {
    onDragEnter: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth.current += 1;
      setIsDragging(true);
    },
    onDragOver: (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    },
    onDragLeave: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth.current = Math.max(depth.current - 1, 0);
      if (!depth.current) setIsDragging(false);
    },
    onDrop: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth.current = 0;
      setIsDragging(false);
      onFiles([...event.dataTransfer.files]);
    },
  };

  return { isDragging, dropZoneProps };
}
