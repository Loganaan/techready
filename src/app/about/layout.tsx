import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About TechReady',
  description: 'Learn about TechReady, the AI-powered interview preparation platform helping job seekers master behavioral and technical interviews with personalized feedback.',
  keywords: [
    'about TechReady',
    'interview preparation platform',
    'AI interview coach',
    'career development',
    'job interview help',
  ],
  openGraph: {
    title: 'About TechReady | AI Interview Coach',
    description: 'Learn about our AI-powered interview preparation platform',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About TechReady | AI Interview Coach',
    description: 'Learn about our AI-powered interview preparation platform',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
