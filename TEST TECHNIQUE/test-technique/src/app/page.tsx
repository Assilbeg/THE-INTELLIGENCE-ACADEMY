import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Users, Video, CheckCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-ia-cream">
      <main className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-ia-teal/10 rounded-full mb-6">
            <GraduationCap className="h-8 w-8 text-ia-teal" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-ia-dark font-heading">
            Test Technique Formateurs
          </h1>
          <p className="text-xl text-ia-teal mb-8 font-heading">
            Intelligence Academy
          </p>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Plateforme de test technique pour les candidats formateurs.
            36 questions pour évaluer les compétences en IA générative.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <Video className="h-8 w-8 text-ia-teal mb-2" />
              <CardTitle className="text-lg text-ia-dark">Réponses vidéo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Enregistrez vos réponses directement via webcam pour une évaluation authentique.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CheckCircle className="h-8 w-8 text-ia-teal mb-2" />
              <CardTitle className="text-lg text-ia-dark">36 questions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                6 blocs thématiques couvrant tous les aspects de l&apos;IA générative.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <Users className="h-8 w-8 text-ia-teal mb-2" />
              <CardTitle className="text-lg text-ia-dark">Profils B2C/B2B</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Identification automatique du profil selon les résultats obtenus.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            Vous êtes évaluateur ?
          </p>
          <Link href="/admin">
            <Button size="lg" className="bg-ia-teal hover:bg-ia-teal-light text-white">
              Accéder à l&apos;administration
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>© 2026 Intelligence Academy - Tous droits réservés</p>
        </footer>
      </main>
    </div>
  )
}
