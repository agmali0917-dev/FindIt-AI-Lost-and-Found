/**
 * Admin Items Page
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Star, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { adminService } from '../../services'
import { Badge, Skeleton, Select } from '../../components/ui'
import { useDocumentTitle } from '../../hooks/index'

export default function AdminItems() {
  useDocumentTitle('Admin – Items')
  const queryClient = useQueryClient()
  const [type, setType] = useState('lost')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-items', type],
    queryFn:  () => adminService.getItems({ type, limit: 50 }),
    select:   d => d.data.data,
  })

  const items = data?.items || []

  const verifyMutation = useMutation({
    mutationFn: (id) => adminService.verifyItem(id, type),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-items'] }); toast.success('Item verified') },
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteItem(id, type),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-items'] }); toast.success('Item deleted') },
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black">Items ({data?.pagination?.total || 0})</h1>
        <div className="flex gap-2">
          {['lost', 'found'].map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`btn btn-sm capitalize ${type === t ? 'btn-primary' : 'btn-secondary'}`}>
              {t} items
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item._id} className="card flex items-center gap-4">
              <img src={item.images?.[0]?.url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{item.title}</p>
                  {item.isVerified && <Badge variant="success">Verified</Badge>}
                  {item.isFeatured && <Badge variant="warning">Featured</Badge>}
                </div>
                <p className="text-xs text-dark-100/40">
                  {item.category} · by {item.reportedBy?.name} · {item.status}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!item.isVerified && (
                  <button onClick={() => verifyMutation.mutate(item._id)} className="btn btn-secondary btn-sm gap-1.5">
                    <CheckCircle size={12} /> Verify
                  </button>
                )}
                <button onClick={() => {
                  if (confirm('Delete this item?')) deleteMutation.mutate(item._id)
                }} className="btn btn-ghost btn-icon btn-sm text-danger-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
