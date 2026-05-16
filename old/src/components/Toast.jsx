import { useApp } from '../context/AppContext'

function Toast() {
  const { toast } = useApp()

  if (!toast.show) return null

  return (
    <div className="toast">
      {toast.message}
    </div>
  )
}

export default Toast
