import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Behavioral Interview Practice',
  description: 'Practice behavioral interviews with AI-powered coaching. Get personalized feedback on your STAR method responses and improve your interview storytelling skills.',
  keywords: [
    'behavioral interview',
    'STAR method',
    'interview practice',
    'behavioral questions',
    'interview coaching',
    'AI interview practice',
    'job interview preparation',
    'behavioral interview tips',
  ],
  openGraph: {
    title: 'Behavioral Interview Practice | TechReady',
    description: 'Master behavioral interviews with AI-powered feedback and STAR method coaching',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Behavioral Interview Practice | TechReady',
    description: 'Master behavioral interviews with AI-powered feedback and STAR method coaching',
  },
}

export default function BehavioralLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
