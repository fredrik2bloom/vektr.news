interface Project {
  title: string
  description: string
  href?: string
  imgSrc?: string
}

const projectsData: Project[] = [
  {
    title: 'vektr RSS Aggregator',
    description: `An intelligent system that aggregates cryptocurrency news from multiple trusted sources, 
    processes content with AI for better readability, and automatically publishes to this blog. 
    Built with Node.js, OpenAI, and Supabase.`,
    imgSrc: '/static/images/logo.png',
    href: 'https://github.com/yourusername/vektr',
  },
  {
    title: 'Real-time Crypto Analytics',
    description: `Advanced cryptocurrency market analysis powered by AI, providing insights into 
    price movements, market sentiment, and breaking news impact. Features automated 
    trading signals and portfolio recommendations.`,
    imgSrc: '/static/images/twitter-card.png',
    href: '#',
  },
]

export default projectsData
