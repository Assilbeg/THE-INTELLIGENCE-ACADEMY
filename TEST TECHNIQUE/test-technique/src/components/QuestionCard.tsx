import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Question, getLevelLabel } from '@/lib/questions'
import { Clock, Video, FileText } from 'lucide-react'

interface QuestionCardProps {
  question: Question
  showAnswer?: boolean
}

export function QuestionCard({ question, showAnswer = false }: QuestionCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                Bloc {question.bloc} - {question.blocTitle}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {getLevelLabel(question.level)}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {question.points} pts
              </Badge>
            </div>
            <CardTitle className="text-xl">
              Q{question.number}. {question.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            {question.format === 'video' ? (
              <Video className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
            <span className="flex items-center gap-1 text-sm">
              <Clock className="h-4 w-4" />
              {question.duration}s
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <p className="text-lg">{question.question}</p>
        </div>
        
        {showAnswer && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-500 mb-2">🎯 Réponse attendue :</p>
            <p className="text-gray-700 dark:text-gray-300">{question.expectedAnswer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
