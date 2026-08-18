import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Brand } from "@/components/Brand";
import { racepulseImages, racepulseVideos } from "@/config/racepulse-media";

const heroMetrics = [
  ["GPS", "Transmissão do atleta"],
  ["BFF", "Credenciais protegidas"],
  ["GPX", "Rotas oficiais"],
  ["MAPA", "Acompanhamento público"],
] as const;

const productStats = [
  ["100%", "Foco em trail"],
  ["BFF", "Fluxo protegido"],
  ["GPS", "Tracking no celular"],
] as const;

const steps = [
  {
    num: "01",
    title: "Cadastre a prova",
    desc: "Crie a prova no painel admin, defina o percurso com routepoints e configure os atletas participantes.",
    image: racepulseImages.finishLine,
  },
  {
    num: "02",
    title: "Ative o tracking",
    desc: "Cada atleta recebe um código privado. Com ele, ativa o rastreamento no celular sem app extra necessário.",
    image: racepulseImages.phone,
  },
  {
    num: "03",
    title: "Acompanhe ao vivo",
    desc: "Qualquer pessoa com o código público acompanha a posição do atleta com mapa e progresso estimado.",
    image: racepulseImages.runner,
  },
] as const;

const accessCards = [
  {
    href: "/tracking",
    image: racepulseImages.hero,
    tag: "Público · Leitura",
    title: "Acompanhar prova",
    desc: "Acompanhe atletas ao vivo com mapa, progresso estimado e atualização em tempo real. Só precisa do código público.",
    cta: "Acompanhar agora",
    accent: true,
  },
  {
    href: "/athlete",
    image: racepulseImages.athlete,
    tag: "Atleta · Código privado",
    title: "Área do atleta",
    desc: "Entre com seu código de acesso para ativar o tracking e compartilhar sua posição durante a prova.",
    cta: "Entrar como atleta",
    accent: false,
  },
  {
    href: "/admin/login",
    image: racepulseImages.admin,
    tag: "Organizador · Login",
    title: "Área administrativa",
    desc: "Gerencie provas, atletas, rotas e sessões de tracking. Controle a operação no painel admin.",
    cta: "Acessar painel",
    accent: false,
  },
] as const;

function VideoBackground({ className = "" }: { className?: string }) {
  return (
    <video
      className={className}
      autoPlay
      muted
      loop
      playsInline
      poster={racepulseImages.hero}
    >
      {racepulseVideos.map((video) => (
        <source key={video} src={video} />
      ))}
    </video>
  );
}

export default function Home() {
  return (
    <main className="figma-home">
      <section className="figma-video-hero">
        <VideoBackground />
        <div className="figma-hero-overlay" />
        <div className="figma-hero-radial" />

        <nav className="figma-hero-nav" aria-label="Principal">
          <Brand />
          <div>
            <Link className="figma-nav-ghost" href="/tracking">
              Acompanhar prova
            </Link>
            <Link className="figma-nav-ghost" href="/athlete">
              Área do atleta
            </Link>
            <Link className="figma-nav-ghost figma-nav-admin" href="/admin/login">
              <LockKeyhole size={12} aria-hidden="true" />
              Admin
            </Link>
          </div>
        </nav>

        <div className="figma-hero-content">
          <div className="figma-live-badge">
            <span />
            <strong>Plataforma ao vivo</strong>
          </div>
          <h1>
            Tracking em
            <br />
            tempo real para
            <br />
            <span>provas de trail.</span>
          </h1>
          <p>
            Gerencie atletas, percursos e sessões de rastreamento com uma plataforma
            pensada para organizadores de corridas de montanha.
          </p>
          <div className="figma-hero-actions">
            <Link className="figma-primary-link" href="/tracking">
              Acompanhar prova ao vivo
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link className="figma-secondary-link" href="/admin/login">
              Entrar no sistema
            </Link>
          </div>
        </div>

        <div className="figma-stats-strip">
          {heroMetrics.map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="figma-about-section">
        <div>
          <p className="figma-section-tag">Sobre a RacePulse</p>
          <h2>
            A tecnologia que
            <br />a montanha exige.
          </h2>
          <p>
            A RacePulse nasceu da necessidade real de organizadores de trail running
            que precisavam acompanhar atletas em percursos remotos sem depender de
            rádio, papel ou planilha.
          </p>
          <p>
            Hoje, o MVP separa operação, transmissão e visualização pública: rotas
            oficiais ficam cadastradas no sistema e cada pessoa recebe apenas o acesso
            necessário para sua jornada.
          </p>
          <div className="figma-inline-stats">
            {productStats.map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <figure className="figma-about-image">
          <Image
            src={racepulseImages.startLine}
            alt="Atletas na largada de uma prova de trail"
            fill
            sizes="(min-width: 900px) 520px, 100vw"
          />
          <figcaption>📍 Largada — Prova de trail</figcaption>
        </figure>
      </section>

      <section className="figma-steps-section">
        <div className="figma-steps-inner">
          <div className="figma-section-heading">
            <p className="figma-section-tag">Como funciona</p>
            <h2>
              Simples para quem organiza.
              <br />
              Poderoso no campo.
            </h2>
          </div>
          <div className="figma-step-grid">
            {steps.map((step) => (
              <article className="figma-step-card" key={step.num}>
                <div className="figma-step-image">
                  <Image src={step.image} alt={step.title} fill sizes="(min-width: 900px) 33vw, 100vw" />
                  <span>{step.num}</span>
                </div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="figma-quote-video">
        <VideoBackground />
        <div />
        <figure>
          <blockquote>
            "Cada passo do atleta,
            <br />
            acompanhado em tempo real."
          </blockquote>
          <figcaption>RacePulse — Tracking operacional para trail running</figcaption>
        </figure>
      </section>

      <section className="figma-access-section" id="acesso">
        <div className="figma-section-heading">
          <p className="figma-section-tag">Acesse a plataforma</p>
          <h2>
            Escolha como
            <br />
            você quer entrar.
          </h2>
          <p>
            Três entradas, cada uma pensada para um perfil diferente: torcedor,
            atleta ou organizador.
          </p>
        </div>

        <div className="figma-access-grid">
          {accessCards.map((card) => (
            <Link
              key={card.href}
              className={card.accent ? "figma-access-card accent" : "figma-access-card"}
              href={card.href}
            >
              <div className="figma-access-image">
                <Image src={card.image} alt={card.title} fill sizes="(min-width: 900px) 33vw, 100vw" />
                <span>{card.tag}</span>
              </div>
              <div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
                <span className="figma-access-cta">
                  {card.cta}
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="figma-footer">
        <Brand />
        <p>© 2026 RacePulse · Plataforma de tracking para trail running</p>
        <div>
          <Link href="/tracking">Acompanhar</Link>
          <Link href="/athlete">Atletas</Link>
          <Link href="/admin/login">Admin</Link>
        </div>
      </footer>
    </main>
  );
}
