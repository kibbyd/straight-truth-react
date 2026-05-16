import { useState, useEffect, useCallback } from 'react'
import { formatVerseRef } from '../../data/bibleBooks'

// IndexedDB helper functions
const DB_NAME = 'straight-truth-notes'
const DB_VERSION = 1
const STORE_NAME = 'notes'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('pinType', 'pinType')
        store.createIndex('pinRef', 'pinRef')
      }
    }
  })
}

async function getAllNotes() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveNote(note) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = note.id ? store.put(note) : store.add(note)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function deleteNote(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

function NotesColumn({ columnId, data }) {
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', content: '', pinType: 'general', pinRef: '' })
  const [searchQuery, setSearchQuery] = useState('')

  // Load notes on mount
  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const allNotes = await getAllNotes()
      setNotes(allNotes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)))
    } catch (err) {
      console.error('Failed to load notes:', err)
    }
  }

  const handleNewNote = () => {
    setEditForm({ title: '', content: '', pinType: 'general', pinRef: '' })
    setIsEditing(true)
    setSelectedNote(null)
  }

  const handleEditNote = (note) => {
    setEditForm({
      id: note.id,
      title: note.title || '',
      content: note.content || '',
      pinType: note.pinType || 'general',
      pinRef: note.pinRef || ''
    })
    setIsEditing(true)
    setSelectedNote(note)
  }

  const handleSave = async () => {
    try {
      const noteData = {
        ...editForm,
        updatedAt: Date.now()
      }
      await saveNote(noteData)
      await loadNotes()
      setIsEditing(false)
      setSelectedNote(null)
    } catch (err) {
      console.error('Failed to save note:', err)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this note?')) {
      try {
        await deleteNote(id)
        await loadNotes()
        if (selectedNote?.id === id) {
          setSelectedNote(null)
        }
      } catch (err) {
        console.error('Failed to delete note:', err)
      }
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditForm({ title: '', content: '', pinType: 'general', pinRef: '' })
  }

  // Filter notes by search query
  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      (note.title?.toLowerCase().includes(query)) ||
      (note.content?.toLowerCase().includes(query))
    )
  })

  // Export notes to markdown
  const handleExport = () => {
    let md = '# Bible Study Notes\n\n'
    notes.forEach(note => {
      md += `## ${note.title || 'Untitled'}\n`
      if (note.pinRef) md += `*${note.pinType}: ${note.pinRef}*\n\n`
      md += `${note.content || ''}\n\n---\n\n`
    })
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bible-notes.md'
    a.click()
  }

  return (
    <div className="notes-column-content">
      <div className="notes-toolbar">
        <button className="primary" onClick={handleNewNote}>+ New Note</button>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <button onClick={handleExport} title="Export to Markdown">📥</button>
      </div>

      {isEditing ? (
        <div className="note-editor" style={{ padding: '15px' }}>
          <input
            type="text"
            placeholder="Note title..."
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <textarea
            placeholder="Write your note..."
            value={editForm.content}
            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
            style={{ width: '100%', height: '200px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
          />
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={editForm.pinType}
              onChange={(e) => setEditForm({ ...editForm, pinType: e.target.value })}
              style={{ padding: '6px' }}
            >
              <option value="general">General</option>
              <option value="verse">Verse</option>
              <option value="chapter">Chapter</option>
            </select>
            {editForm.pinType !== 'general' && (
              <input
                type="text"
                placeholder={editForm.pinType === 'verse' ? 'Gen.1.1' : 'Gen.1'}
                value={editForm.pinRef}
                onChange={(e) => setEditForm({ ...editForm, pinRef: e.target.value })}
                style={{ padding: '6px', width: '100px' }}
              />
            )}
          </div>
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
            <button className="primary" onClick={handleSave}>Save</button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="notes-list">
          {filteredNotes.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
              {searchQuery ? 'No notes match your search' : 'No notes yet. Click "+ New Note" to create one.'}
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                className={`note-item ${selectedNote?.id === note.id ? 'active' : ''}`}
                onClick={() => setSelectedNote(note)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{note.title || 'Untitled'}</div>
                    {note.pinRef && (
                      <span className={`note-item-pin ${note.pinType}`}>
                        {note.pinType === 'verse' ? formatVerseRef(note.pinRef) : note.pinRef}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditNote(note); }}
                      style={{ padding: '2px 8px', fontSize: '12px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                      style={{ padding: '2px 8px', fontSize: '12px', color: '#dc3545' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '6px', fontSize: '14px', color: '#666' }}>
                  {note.content?.substring(0, 100)}{note.content?.length > 100 ? '...' : ''}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default NotesColumn
