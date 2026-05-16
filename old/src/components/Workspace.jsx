import { useState, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import Column from './Column'

function Workspace() {
  const { columns, reorderColumns } = useApp()
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null)
  }, [])

  const handleDrop = useCallback((e, index) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderColumns(draggedIndex, index)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [draggedIndex, reorderColumns])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  return (
    <div className="workspace">
      {columns.map((column, index) => (
        <Column
          key={column.id}
          column={column}
          index={index}
          isDragging={draggedIndex === index}
          isDragOver={dragOverIndex === index}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  )
}

export default Workspace
