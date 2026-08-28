import './index.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Onboarding from './components/Onboarding';

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Onboarding />
      </main>
    </>
  );
}

export default App;
