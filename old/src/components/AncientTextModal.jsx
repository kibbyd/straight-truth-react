import { useApp } from '../context/AppContext'

function AncientTextModal() {
  const { ancientTextModal, closeAncientText } = useApp()

  if (!ancientTextModal.show) return null

  const source = ancientTextModal.source

  return (
    <div className="modal-overlay" onClick={closeAncientText}>
      <div className="modal-content ancient-text-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={closeAncientText}>&times;</button>

        <div className="ancient-text-header">
          <div className="ancient-text-author">{source.author}</div>
          <div className="ancient-text-work">{source.work}</div>
          <div className="ancient-text-ref">{source.reference}</div>
          {source.date && <div className="ancient-text-date">{source.date}</div>}
        </div>

        <div className="ancient-text-body">
          <blockquote className="ancient-text-quote">
            "{source.text}"
          </blockquote>
        </div>

        {source.context && (
          <div className="ancient-text-context">
            <strong>Context:</strong> {source.context}
          </div>
        )}
      </div>
    </div>
  )
}

export default AncientTextModal
