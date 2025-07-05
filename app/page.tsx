// filepath: /app/page.tsx
import { Header } from "./(landingpage)/_components/Header";
import { Hero } from "./(landingpage)/_components/Hero";
import { LogoCloud } from "./(landingpage)/_components/LogoCloud";
import { Testimonials } from "./(landingpage)/_components/Testimonials";
import { Gallery } from "./(landingpage)/_components/Gallery";
import { CTA } from "./(landingpage)/_components/CTA";
import { Footer } from "./(landingpage)/_components/Footer";
import { Tools } from "./(landingpage)/_components/Tools";

function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Tools />
      <Gallery />
      <CTA />
      <Footer />
    </div>
  );
}

export default HomePage;
