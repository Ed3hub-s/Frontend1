import './live-classes.css';
import LiveClassShell from './components/LiveClassShell';

export default function LiveClassesLayout({ children }: { children: React.ReactNode }) {
  return <LiveClassShell>{children}</LiveClassShell>;
}
