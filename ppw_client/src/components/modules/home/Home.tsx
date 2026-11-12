import { FeatureCard } from '../../cards/FeatureCards';
import { LeadForm } from './LeadForm';

export default function Home() {
  const feature = [
    { title: 'React', description: 'Aprenda a criar interfaces de usuário com React.' },
    { title: 'Nest', description: 'Arquitetura de aplicações com NestJS.' },
    { title: 'Shadcn', description: 'Componentes prontos para React.' },
  ];

  return (
    <main className="container mx-auto py-12 px-4 text-center space-y-12">
      <section>
        <h1>Curso: Tecnologia em Sistemas para Internet</h1>
        <p>Cadastre-se para receber novidade</p>
        <LeadForm></LeadForm>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {feature.map((f, index) => (
          <FeatureCard key={index} title={f.title} description={f.description} />
        ))}
      </section>
    </main>
  );
}
