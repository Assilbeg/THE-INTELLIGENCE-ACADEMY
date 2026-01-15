'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Plus, Eye, Link2, Trash2, Loader2, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { totalQuestions } from '@/lib/questions'

interface SessionWithCount {
  id: string
  token: string
  candidate_name: string
  candidate_email: string
  started_at: string | null
  completed_at: string | null
  current_question: number
  created_at: string
  responses_count: number
}

export default function AdminPage() {
  const [sessions, setSessions] = useState<SessionWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    // Vérifier si déjà authentifié
    const auth = sessionStorage.getItem('admin_auth')
    if (auth === 'true') {
      setAuthenticated(true)
      fetchSessions()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Mot de passe simple pour la démo
    if (password === 'intelligence2026') {
      sessionStorage.setItem('admin_auth', 'true')
      setAuthenticated(true)
      fetchSessions()
    } else {
      alert('Mot de passe incorrect')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/sessions?id=${id}`, { method: 'DELETE' })
      setSessions(prev => prev.filter(s => s.id !== id))
      setDeleteDialog(null)
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const copyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/test/${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStatus = (session: SessionWithCount) => {
    if (session.completed_at) {
      return { label: 'Terminé', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
    if (session.started_at) {
      return { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Clock }
    }
    return { label: 'Non commencé', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-ia-cream">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Administration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" className="w-full">
                Connexion
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Stats
  const totalCandidates = sessions.length
  const completedTests = sessions.filter(s => s.completed_at).length
  const inProgressTests = sessions.filter(s => s.started_at && !s.completed_at).length

  return (
    <div className="min-h-screen bg-ia-cream">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Administration - Test Technique</h1>
            <Link href="/admin/new">
              <Button className="bg-ia-teal hover:bg-ia-teal-light">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau candidat
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-ia-teal/10 rounded-lg">
                  <Users className="h-6 w-6 text-ia-teal" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total candidats</p>
                  <p className="text-2xl font-bold">{totalCandidates}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tests terminés</p>
                  <p className="text-2xl font-bold">{completedTests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Clock className="h-6 w-6 text-amber-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">En cours</p>
                  <p className="text-2xl font-bold">{inProgressTests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-ia-dark">Candidats</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">Aucun candidat pour le moment</p>
                <Link href="/admin/new">
                  <Button className="bg-ia-teal hover:bg-ia-teal-light">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un candidat
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidat</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map(session => {
                    const status = getStatus(session)
                    const StatusIcon = status.icon
                    return (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          {session.candidate_name}
                        </TableCell>
                        <TableCell>{session.candidate_email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-ia-teal h-2 rounded-full transition-all"
                                style={{ width: `${(session.responses_count / totalQuestions) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500">
                              {session.responses_count}/{totalQuestions}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(session.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/${session.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyLink(session.token, session.id)}
                            >
                              {copiedId === session.id ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Link2 className="h-4 w-4" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setDeleteDialog(session.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce candidat ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes les réponses vidéo seront également supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => deleteDialog && handleDelete(deleteDialog)}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
