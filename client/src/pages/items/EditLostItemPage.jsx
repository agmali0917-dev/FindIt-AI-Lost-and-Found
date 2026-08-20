import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Edit2, ArrowLeft, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Input, Textarea, Select, Button, Skeleton } from '../../components/ui'
import { lostItemService } from '../../services'
import { useDocumentTitle } from '../../hooks/index'
import { ITEM_CATEGORIES } from '../../utils/constants'


const editSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(1, 'Please select a category'),
  brand: z.string().optional(),
  color: z.string().optional(),
  description: z.string().min(10, 'Please provide a description (min 10 chars)'),
  status: z.enum(['active', 'recovered', 'closed']),
})

export default function EditLostItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  useDocumentTitle('Edit Lost Item')

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(editSchema),
  })

  const { data: item, isLoading } = useQuery({
    queryKey: ['lostItem', id],
    queryFn: () => lostItemService.getById(id),
    select: d => d.data.data,
  })

  useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        category: item.category,
        brand: item.brand || '',
        color: item.color || '',
        description: item.description,
        status: item.status,
      })
    }
  }, [item, reset])

  const updateMutation = useMutation({
    mutationFn: (data) => lostItemService.update(id, data),
    onSuccess: () => {
      toast.success('Item updated successfully')
      queryClient.invalidateQueries(['lostItem', id])
      navigate(`/items/lost/${id}`)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update item')
    }
  })

  const onSubmit = (data) => {
    updateMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48 mb-6" />
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}
      </div>
    )
  }

  if (!item) return <div className="p-6 text-center text-dark-100/50">Item not found</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-dark-100/50 hover:text-dark-100 mb-6 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
          <Edit2 size={24} className="text-primary-400" />
          Edit Lost Item
        </h1>
        <p className="text-dark-100/50 text-sm">Update the details of your lost item.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input label="Item Title *" placeholder="e.g. Black AirPods Pro Case"
          error={errors.title?.message} id="edit-title" {...register('title')} />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Category *" error={errors.category?.message} id="edit-category" {...register('category')}>
            <option value="">Select category...</option>
            {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Color" placeholder="e.g. Black, Silver"
            error={errors.color?.message} id="edit-color" {...register('color')} />
        </div>

        <Input label="Brand / Model" placeholder="e.g. Apple, Samsung"
          error={errors.brand?.message} id="edit-brand" {...register('brand')} />

        <Textarea label="Description *" placeholder="Describe identifying features..."
          rows={4} error={errors.description?.message} id="edit-description" {...register('description')} />

        <Select label="Status *" error={errors.status?.message} id="edit-status" {...register('status')}>
          <option value="active">Active</option>
          <option value="recovered">Recovered</option>
          <option value="closed">Closed</option>
        </Select>

        <div className="flex items-center gap-3 pt-6 border-t border-white/5">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <div className="flex-1" />
          <Button type="submit" loading={updateMutation.isPending} className="btn-primary gap-2" icon={<Save size={16}/>}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
