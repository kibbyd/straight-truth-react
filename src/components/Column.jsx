import { useApp } from '../context/AppContext'
import BibleColumn from './columns/BibleColumn'
import StrongsColumn from './columns/StrongsColumn'
import CrossRefsColumn from './columns/CrossRefsColumn'
import NotesColumn from './columns/NotesColumn'
import SearchColumn from './columns/SearchColumn'
import MiraclesColumn from './columns/MiraclesColumn'
import ParablesColumn from './columns/ParablesColumn'
import PrayersColumn from './columns/PrayersColumn'
import NamesOfGodColumn from './columns/NamesOfGodColumn'
import QuotationsColumn from './columns/QuotationsColumn'
import CovenantsColumn from './columns/CovenantsColumn'
import FestivalsColumn from './columns/FestivalsColumn'
import FamilyTreesColumn from './columns/FamilyTreesColumn'
import QuestionsColumn from './columns/QuestionsColumn'
import GlossaryColumn from './columns/GlossaryColumn'
import ConverterColumn from './columns/ConverterColumn'
import TimelinesColumn from './columns/TimelinesColumn'
import MapsColumn from './columns/MapsColumn'
import ParallelPassagesColumn from './columns/ParallelPassagesColumn'

// Column title mapping
const columnTitles = {
  passage: 'Bible',
  strongs: "Strong's Concordance",
  crossrefs: 'Cross-References',
  notes: 'Notes',
  search: 'Search Results',
  miracles: 'Miracles of Jesus',
  parables: 'Parables of Jesus',
  prayers: 'Prayers in the Bible',
  namesofgod: 'Names of God',
  quotations: 'OT → NT Quotations',
  covenants: 'Biblical Covenants',
  festivals: 'Calendar & Festivals',
  familytrees: 'Family Trees',
  questions: 'Questions',
  glossary: 'Glossary',
  converter: 'Measures & Weights',
  timelines: 'Biblical Timelines',
  maps: 'Maps & Geography',
  parallels: 'Parallel Passages'
}

function Column({
  column,
  index,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd
}) {
  const { closeColumn } = useApp()

  // Get title based on column type
  const getTitle = () => {
    if (column.type === 'strongs' && column.data?.strongNum) {
      // Strip "Strong's " prefix if present to avoid "Strong's Strong's G2288"
      const num = column.data.strongNum.replace(/^Strong's\s*/i, '')
      return `Strong's ${num}`
    }
    if (column.type === 'search' && column.data?.query) {
      return `Search: "${column.data.query}"`
    }
    return columnTitles[column.type] || column.type
  }

  // Render content based on column type
  const renderContent = () => {
    switch (column.type) {
      case 'passage':
        return <BibleColumn columnId={column.id} data={column.data} />
      case 'strongs':
        return <StrongsColumn columnId={column.id} data={column.data} />
      case 'crossrefs':
        return <CrossRefsColumn columnId={column.id} data={column.data} />
      case 'notes':
        return <NotesColumn columnId={column.id} data={column.data} />
      case 'search':
        return <SearchColumn columnId={column.id} data={column.data} />
      case 'miracles':
        return <MiraclesColumn columnId={column.id} data={column.data} />
      case 'parables':
        return <ParablesColumn columnId={column.id} data={column.data} />
      case 'prayers':
        return <PrayersColumn columnId={column.id} data={column.data} />
      case 'namesofgod':
        return <NamesOfGodColumn columnId={column.id} data={column.data} />
      case 'quotations':
        return <QuotationsColumn columnId={column.id} data={column.data} />
      case 'covenants':
        return <CovenantsColumn columnId={column.id} data={column.data} />
      case 'festivals':
        return <FestivalsColumn columnId={column.id} data={column.data} />
      case 'familytrees':
        return <FamilyTreesColumn columnId={column.id} data={column.data} />
      case 'questions':
        return <QuestionsColumn columnId={column.id} data={column.data} />
      case 'glossary':
        return <GlossaryColumn columnId={column.id} data={column.data} />
      case 'converter':
        return <ConverterColumn columnId={column.id} data={column.data} />
      case 'timelines':
        return <TimelinesColumn columnId={column.id} data={column.data} />
      case 'maps':
        return <MapsColumn columnId={column.id} data={column.data} />
      case 'parallels':
        return <ParallelPassagesColumn columnId={column.id} data={column.data} />
      default:
        return <div className="window-content">Unknown column type: {column.type}</div>
    }
  }

  const classNames = ['window']
  if (isDragging) classNames.push('dragging')
  if (isDragOver) classNames.push('drag-over')

  return (
    <div
      className={classNames.join(' ')}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      <div className="window-titlebar">
        <div className="window-title">{getTitle()}</div>
        <div className="window-controls">
          <button
            className="window-btn close"
            onClick={() => closeColumn(column.id)}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
      {renderContent()}
    </div>
  )
}

export default Column
