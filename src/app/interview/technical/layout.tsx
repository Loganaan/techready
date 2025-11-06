import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Technical Interview Practice',
  description: 'Master technical interviews with coding challenges, system design questions, and AI-powered feedback. Practice LeetCode-style problems and multiple-choice questions.',
  keywords: [
    'technical interview',
    'coding interview',
    'LeetCode practice',
    'system design',
    'coding challenges',
    'programming interview',
    'technical questions',
    'AI coding feedback',
    'interview preparation',
    'software engineering interview',
  ],
  openGraph: {
    title: 'Technical Interview Practice | TechReady',
    description: 'Master technical interviews with coding challenges and AI-powered feedback',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Technical Interview Practice | TechReady',
    description: 'Master technical interviews with coding challenges and AI-powered feedback',
  },
}

export default function TechnicalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
