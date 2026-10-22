import Portfolio from './portfolio';
import projects from '../lib/projects';
export default function Home() { return <Portfolio projects={projects.filter(p => p.category === 'Development').slice(0, 3)} />; }
