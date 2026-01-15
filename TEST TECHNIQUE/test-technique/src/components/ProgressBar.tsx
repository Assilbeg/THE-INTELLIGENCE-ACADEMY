'use client'

import { Progress } from '@/components/ui/progress'
import { totalQuestions } from '@/lib/questions'

interface ProgressBarProps {
  currentQuestion: number
  totalAnswered: number
}

export function ProgressBar({ currentQuestion, totalAnswered }: ProgressBarProps) {
  const progressPercent = (totalAnswered / totalQuestions) * 100

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-gray-500">
        <span>Question {currentQuestion} / {totalQuestions}</span>
        <span>{totalAnswered} répondue{totalAnswered > 1 ? 's' : ''}</span>
      </div>
      <Progress value={progressPercent} className="h-2" />
    </div>
  )
}
