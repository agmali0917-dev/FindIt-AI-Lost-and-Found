/**
 * Admin Users Page
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Ban, CheckCircle, Shield, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { adminService } from '../../services'
import { Avatar, Badge, Skeleton } from '../../components/ui'
import { useDocumentTitle } from '../../hooks/index'
import { useDebounce } from '../../hooks/index'
import { format } from 'date-fns'

export default function AdminUsers() {
  useDocumentTitle('Admin – Users')
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch],
    queryFn:  () => adminService.getUsers({ search: debouncedSearch, limit: 50 }),
    select:   d => d.data.data,
  })

  const users = data?.users || []

  const banMutation = useMutation({
    mutationFn: ({ id, reason }) => adminService.banUser(id, { reason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User banned') },
  })

  const unbanMutation = useMutation({
    mutationFn: (id) => adminService.unbanUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User unbanned') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User deleted') },
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black">Users ({data?.pagination?.total || 0})</h1>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-100/40" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..." className="input input-sm pl-8 w-56" id="admin-user-search" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u._id} className="card flex items-center gap-4">
              <Avatar src={u.avatar?.url} name={u.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{u.name}</p>
                  {u.role === 'admin' && <Badge variant="primary">Admin</Badge>}
                  {u.isBanned && <Badge variant="danger">Banned</Badge>}
                </div>
                <p className="text-xs text-dark-100/40">{u.email} · Joined {format(new Date(u.createdAt), 'MMM yyyy')}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {u.isBanned ? (
                  <button onClick={() => unbanMutation.mutate(u._id)} className="btn btn-secondary btn-sm gap-1.5">
                    <CheckCircle size={12} /> Unban
                  </button>
                ) : (
                  <button onClick={() => banMutation.mutate({ id: u._id, reason: 'Admin action' })}
                    className="btn btn-ghost btn-sm gap-1.5 text-warning-400">
                    <Ban size={12} /> Ban
                  </button>
                )}
                <button onClick={() => {
                  if (confirm(`Delete ${u.name}? This cannot be undone.`)) deleteMutation.mutate(u._id)
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
