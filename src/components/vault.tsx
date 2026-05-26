'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Search, Lock, FileText, Image, AudioLines, ScrollText,
  BookOpen, Tag, Eye, Calendar, Trash2, Shield,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import {
  useVaultDocuments, useCreateVaultDocument, useDeleteVaultDocument,
} from '@/lib/hooks'
import { toast } from 'sonner'

const typeIcons: Record<string, React.ElementType> = {
  note: FileText,
  pdf: ScrollText,
  image: Image,
  audio: AudioLines,
  contract: ScrollText,
  rule: BookOpen,
}

const typeColors: Record<string, string> = {
  note: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  pdf: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400',
  image: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-400',
  audio: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-400',
  contract: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-400',
  rule: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400',
}

const priorityColors: Record<string, string> = {
  low: 'border-l-gray-400',
  medium: 'border-l-amber-400',
  high: 'border-l-red-400',
}

export function Vault() {
  const { currentWorkspace } = useAppStore()
  const wsId = currentWorkspace?.id ?? ''

  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDoc, setDetailDoc] = useState<{ id: string; title: string; type: string; content: string; priority: string; scope: string; visibility: string | null; tags: string | null; createdAt: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  // Form state
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('note')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState('medium')
  const [scope, setScope] = useState('workspace')
  const [visibility, setVisibility] = useState('')
  const [tags, setTags] = useState('')

  const { data: vaultData, isLoading } = useVaultDocuments(wsId)
  const createDoc = useCreateVaultDocument(wsId)
  const deleteDoc = useDeleteVaultDocument(wsId)

  const documents = vaultData?.documents ?? []

  const filteredDocs = documents.filter((doc: { title: string; type: string; content?: string }) => {
    const matchesSearch = searchQuery === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.content && doc.content.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = filterType === 'all' || doc.type === filterType
    return matchesSearch && matchesType
  })

  const handleCreate = async () => {
    if (!title.trim()) { toast.error('Title is required'); return }
    try {
      await createDoc.mutateAsync({
        title: title.trim(),
        type: docType,
        content: content.trim() || undefined,
        priority,
        scope,
        visibility: visibility.trim() || undefined,
        tags: tags.trim() || undefined,
      })
      toast.success('Document added to Vault!')
      setDialogOpen(false)
      setTitle(''); setContent(''); setTags(''); setVisibility('')
    } catch {
      toast.error('Failed to create document')
    }
  }

  const handleDelete = async (docId: string) => {
    try {
      await deleteDoc.mutateAsync(docId)
      toast.success('Document removed from Vault')
      setDetailDoc(null)
    } catch {
      toast.error('Failed to delete document')
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-600" />
            Knowledge Vault
          </h1>
          <p className="text-muted-foreground text-sm">Single source of truth for AI reasoning</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Add to Knowledge Vault</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="rule">Rule / Policy</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="pdf">PDF Reference</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="audio">Audio Transcript</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter document content, notes, rules, or references..."
                  className="mt-1"
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Scope</Label>
                  <Select value={scope} onValueChange={setScope}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workspace">Workspace</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Visibility (comma-separated aliases)</Label>
                  <Input value={visibility} onChange={(e) => setVisibility(e.target.value)} placeholder="Ayah, Ibu" className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="finance, budget, important" className="mt-1" />
              </div>
              <Button onClick={handleCreate} disabled={createDoc.isPending} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                {createDoc.isPending ? 'Adding...' : 'Add to Vault'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vault Intelligence Indicator */}
      <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Vault Intelligence Active</p>
            <p className="text-xs text-muted-foreground">AI references Vault as primary source: Vault &gt; Memory &gt; Assumption</p>
          </div>
          <Badge className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400">
            {documents.length} docs
          </Badge>
        </CardContent>
      </Card>

      {/* Search & Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vault documents..."
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="note">Notes</SelectItem>
            <SelectItem value="rule">Rules</SelectItem>
            <SelectItem value="contract">Contracts</SelectItem>
            <SelectItem value="pdf">PDFs</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Document Grid */}
      {filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDocs.map((doc: { id: string; title: string; type: string; content: string; priority: string; scope: string; tags: string | null; createdAt: string }, i: number) => {
            const IconComp = typeIcons[doc.type] || FileText
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={`border-l-4 ${priorityColors[doc.priority] || 'border-l-gray-300'} hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => setDetailDoc(doc)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${typeColors[doc.type] || 'bg-muted'}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={`text-[10px] ${typeColors[doc.type] || ''}`}>{doc.type}</Badge>
                          <Badge variant="outline" className="text-[10px]">{doc.scope}</Badge>
                        </div>
                        {doc.content && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{doc.content}</p>
                        )}
                        {doc.tags && (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            <Tag className="w-3 h-3 text-muted-foreground" />
                            {doc.tags.split(',').slice(0, 3).map((tag: string, j: number) => (
                              <span key={j} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{tag.trim()}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Lock className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-30" />
            <p className="text-muted-foreground text-sm">
              {searchQuery || filterType !== 'all'
                ? 'No documents match your search criteria'
                : 'Your Knowledge Vault is empty. Add documents to give AI context for better decisions.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Document Detail Dialog */}
      <Dialog open={!!detailDoc} onOpenChange={(open) => !open && setDetailDoc(null)}>
        <DialogContent className="sm:max-w-lg">
          {detailDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => { const Ic = typeIcons[detailDoc.type] || FileText; return <Ic className="w-5 h-5" /> })()}
                  {detailDoc.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs ${typeColors[detailDoc.type] || ''}`}>{detailDoc.type}</Badge>
                  <Badge variant="outline" className="text-xs">{detailDoc.priority} priority</Badge>
                  <Badge variant="outline" className="text-xs">{detailDoc.scope}</Badge>
                </div>
                {detailDoc.visibility && (
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Visible to: {detailDoc.visibility}</span>
                  </div>
                )}
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm whitespace-pre-wrap">{detailDoc.content || 'No content'}</p>
                </div>
                {detailDoc.tags && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    {detailDoc.tags.split(',').map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{tag.trim()}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Created: {new Date(detailDoc.createdAt).toLocaleString()}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(detailDoc.id)}
                    disabled={deleteDoc.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
