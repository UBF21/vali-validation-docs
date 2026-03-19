import type { ReactNode } from 'react';
import { useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';

// ─── Feature data ─────────────────────────────────────────────────────────────

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    title: 'Fluent API',
    icon: '⛓',
    description:
      'Chain rules in a readable, expressive way. RuleFor, RuleForEach, SetValidator — compose validators at any depth.',
  },
  {
    title: 'Zero Dependencies',
    icon: '◎',
    description:
      'No external packages. Only Microsoft.Extensions.DependencyInjection.Abstractions for DI — keeps your dependency tree clean.',
  },
  {
    title: 'Async First',
    icon: '⚡',
    description:
      'MustAsync, DependentRuleAsync, ValidateAsync — full async/await support. Query databases inside validators without deadlocks.',
  },
  {
    title: 'ASP.NET Core Ready',
    icon: '🌐',
    description:
      'Middleware, endpoint filters and action filters. Delivers RFC 7807 problem+json responses out of the box.',
  },
  {
    title: 'Mediator Integration',
    icon: '↔',
    description:
      'First-class pipeline behaviors for MediatR and Vali-Mediator. Validation failures return Result<T>.Fail instead of throwing.',
  },
  {
    title: '80+ Built-in Rules',
    icon: '✓',
    description:
      'Strings, numbers, dates, collections, passwords, IBAN, GUID, IP, IBAN, RuleSwitch, SwitchOn — all included.',
  },
];

// ─── Package data ─────────────────────────────────────────────────────────────

interface Package {
  name: string;
  description: string;
  install: string;
  badge: string;
  nuget: string;
}

const packages: Package[] = [
  {
    name: 'Vali-Validation',
    description: 'Core library. All rules, validators, and DI registration.',
    install: 'dotnet add package Vali-Validation',
    badge: 'Core',
    nuget: 'https://www.nuget.org/packages/Vali-Validation',
  },
  {
    name: 'Vali-Validation.AspNetCore',
    description: 'Middleware, Minimal API filters, MVC action filters.',
    install: 'dotnet add package Vali-Validation.AspNetCore',
    badge: 'ASP.NET Core',
    nuget: 'https://www.nuget.org/packages/Vali-Validation.AspNetCore',
  },
  {
    name: 'Vali-Validation.MediatR',
    description: 'MediatR pipeline behavior. Throws on validation failure.',
    install: 'dotnet add package Vali-Validation.MediatR',
    badge: 'MediatR',
    nuget: 'https://www.nuget.org/packages/Vali-Validation.MediatR',
  },
  {
    name: 'Vali-Validation.ValiMediator',
    description: 'Vali-Mediator behavior. Returns Result<T>.Fail instead of throwing.',
    install: 'dotnet add package Vali-Validation.ValiMediator',
    badge: 'Vali-Mediator',
    nuget: 'https://www.nuget.org/packages/Vali-Validation.ValiMediator',
  },
];

// ─── Hero section ─────────────────────────────────────────────────────────────

function HeroSection() {
  const [copied, setCopied] = useState(false);
  const cmd = 'dotnet add package Vali-Validation';
  function handleCopy() {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <header className={styles.hero}>
      <div className={styles.heroGrid} />
      <div className={styles.heroOrb1} />
      <div className={styles.heroOrb2} />
      <div className={styles.heroOrb3} />
      <div className={styles.heroInner}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgePulse} />
          .NET 7 · .NET 8 · .NET 9
        </div>
        <h1 className={styles.heroTitle}>Vali-Validation</h1>
        <p className={styles.heroTagline}>
          <span className={styles.heroTaglineComment}>//</span>{' '}fluent validation for .NET
        </p>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatValue}>4</span>
            <span className={styles.heroStatLabel}>packages</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatValue}>80+</span>
            <span className={styles.heroStatLabel}>built-in rules</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatValue}>.NET</span>
            <span className={styles.heroStatLabel}>7 · 8 · 9</span>
          </div>
        </div>
        <div className={styles.heroCta}>
          <Link className={styles.btnPrimary} to="/docs/quick-start">
            Get started →
          </Link>
          <Link className={styles.btnSecondary} to="/docs/introduction">
            Read the docs
          </Link>
        </div>
        <div className={styles.heroInstallWrap}>
          <div className={styles.heroInstall}>
            <span className={styles.heroInstallPrompt}>$</span>
            <code className={styles.heroInstallCode}>{cmd}</code>
            <button className={styles.heroInstallCopy} onClick={handleCopy} title={copied ? 'Copied!' : 'Copy'}>
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Syntax-highlighted C# code ───────────────────────────────────────────────

type Token = { text: string; cls: string };

const CODE_TOKENS: Token[][] = [
  [{ text: 'builder', cls: 'cVar' }, { text: '.', cls: 'cPunc' }, { text: 'Services', cls: 'cType' }, { text: '.', cls: 'cPunc' }, { text: 'AddValidatorsFromAssembly', cls: 'cMethod' }, { text: '(', cls: 'cPunc' }, { text: 'typeof', cls: 'cKw' }, { text: '(', cls: 'cPunc' }, { text: 'Program', cls: 'cType' }, { text: ').', cls: 'cPunc' }, { text: 'Assembly', cls: 'cProp' }, { text: ');', cls: 'cPunc' }],
  [],
  [{ text: 'public', cls: 'cKw' }, { text: ' ', cls: 'cPunc' }, { text: 'class', cls: 'cKw' }, { text: ' ', cls: 'cPunc' }, { text: 'CreateUserValidator', cls: 'cType' }, { text: ' : ', cls: 'cPunc' }, { text: 'AbstractValidator', cls: 'cType' }, { text: '<', cls: 'cPunc' }, { text: 'CreateUserCommand', cls: 'cType' }, { text: '>', cls: 'cPunc' }],
  [{ text: '{', cls: 'cPunc' }],
  [{ text: '    ', cls: 'cPunc' }, { text: 'public', cls: 'cKw' }, { text: ' ', cls: 'cPunc' }, { text: 'CreateUserValidator', cls: 'cMethod' }, { text: '()', cls: 'cPunc' }],
  [{ text: '    {', cls: 'cPunc' }],
  [{ text: '        ', cls: 'cPunc' }, { text: 'RuleFor', cls: 'cMethod' }, { text: '(x => x.', cls: 'cPunc' }, { text: 'Email', cls: 'cProp' }, { text: ')', cls: 'cPunc' }],
  [{ text: '            .', cls: 'cPunc' }, { text: 'NotEmpty', cls: 'cMethod' }, { text: '()', cls: 'cPunc' }],
  [{ text: '            .', cls: 'cPunc' }, { text: 'EmailAddress', cls: 'cMethod' }, { text: '()', cls: 'cPunc' }],
  [{ text: '            .', cls: 'cPunc' }, { text: 'MaxLength', cls: 'cMethod' }, { text: '(', cls: 'cPunc' }, { text: '256', cls: 'cNum' }, { text: ');', cls: 'cPunc' }],
  [{ text: '        ', cls: 'cPunc' }, { text: 'RuleFor', cls: 'cMethod' }, { text: '(x => x.', cls: 'cPunc' }, { text: 'Age', cls: 'cProp' }, { text: ')', cls: 'cPunc' }],
  [{ text: '            .', cls: 'cPunc' }, { text: 'GreaterThan', cls: 'cMethod' }, { text: '(', cls: 'cPunc' }, { text: '17', cls: 'cNum' }, { text: ');', cls: 'cPunc' }],
  [{ text: '        ', cls: 'cPunc' }, { text: 'RuleFor', cls: 'cMethod' }, { text: '(x => x.', cls: 'cPunc' }, { text: 'Password', cls: 'cProp' }, { text: ')', cls: 'cPunc' }],
  [{ text: '            .', cls: 'cPunc' }, { text: 'NotEmpty', cls: 'cMethod' }, { text: '()', cls: 'cPunc' }],
  [{ text: '            .', cls: 'cPunc' }, { text: 'Password', cls: 'cMethod' }, { text: '();', cls: 'cPunc' }],
  [{ text: '    }', cls: 'cPunc' }],
  [{ text: '}', cls: 'cPunc' }],
];

function CodeBlock(): ReactNode {
  const [copied, setCopied] = useState(false);
  const raw = `builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

public class CreateUserValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaxLength(256);
        RuleFor(x => x.Age)
            .GreaterThan(17);
        RuleFor(x => x.Password)
            .NotEmpty()
            .Password();
    }
}`;

  return (
    <div className={styles.codeCard}>
      {/* Window chrome */}
      <div className={styles.codeChrome}>
        <span className={styles.chromeDot} data-color="red" />
        <span className={styles.chromeDot} data-color="yellow" />
        <span className={styles.chromeDot} data-color="green" />
        <span className={styles.codeFile}>CreateUserValidator.cs</span>
        <button
          className={styles.codeCopyBtn}
          onClick={() => {
            navigator.clipboard.writeText(raw).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
          aria-label="Copy code"
        >
          {copied ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>

      {/* Code */}
      <div className={styles.codeBody}>
        <div className={styles.codeLineNumbers}>
          {CODE_TOKENS.map((_, i) => (
            <span key={i} className={styles.codeLineNum}>{i + 1}</span>
          ))}
        </div>
        <pre className={styles.codePre}>
          <code>
            {CODE_TOKENS.map((line, li) => (
              <div key={li} className={styles.codeLine}>
                {line.map((tok, ti) => (
                  <span key={ti} className={styles[tok.cls]}>{tok.text}</span>
                ))}
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* Bottom glow bar */}
      <div className={styles.codeGlowBar} />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeatureCard({ icon, title, description, index }: Feature & { index: number }): ReactNode {
  const num = String(index + 1).padStart(2, '0');
  return (
    <div className={styles.featureCard} style={{ animationDelay: `${index * 80}ms` }}>
      <span className={styles.featureNumber}>{num}</span>
      <div className={styles.featureIconWrap}>
        <span className={styles.featureIconGlyph}>{icon}</span>
      </div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
    </div>
  );
}

function CopyButton({ text }: { text: string }): ReactNode {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={styles.copyButton}
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
      }
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

function PackageCard({ name, description, install, badge, nuget }: Package): ReactNode {
  return (
    <div className={styles.packageCard}>
      <div className={styles.packageAccent} aria-hidden="true" />
      <div className={styles.packageHeader}>
        <span className={styles.packageBadgeLabel}>{badge}</span>
        {nuget ? (
          <a href={nuget} target="_blank" rel="noopener noreferrer" className={styles.packageName}>
            <span className={styles.packageChip}>{name}</span>
          </a>
        ) : (
          <span className={styles.packageChip}>{name}</span>
        )}
      </div>
      <p className={styles.packageDescription}>{description}</p>
      <div className={styles.packageInstall}>
        <code className={styles.packageInstallCode}>{install}</code>
        <CopyButton text={install} />
      </div>
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function FeaturesSection(): ReactNode {
  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Everything you need for validation</h2>
          <p className={styles.sectionSubtitle}>
            Built for .NET developers who value clarity and correctness.
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickExampleSection(): ReactNode {
  return (
    <section className={styles.exampleSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Simple, expressive API</h2>
          <p className={styles.sectionSubtitle}>
            Register once, compose freely. Each rule is chainable and independently testable.
          </p>
        </div>
        <div className={styles.exampleCodeWrap}>
          <CodeBlock />
        </div>
      </div>
    </section>
  );
}

function PackagesSection(): ReactNode {
  return (
    <section className={styles.packagesSection}>
      <div className={styles.packagesDivider} aria-hidden="true" />
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Choose your integration</h2>
          <p className={styles.sectionSubtitle}>
            4 NuGet packages — install only what you need.
          </p>
        </div>
        <div className={styles.packagesGrid}>
          {packages.map((p) => (
            <PackageCard key={p.name} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AuthorSection(): ReactNode {
  return (
    <section className={styles.authorSection}>
      <div className={styles.authorDivider} aria-hidden="true" />
      <div className="container">
        <div className={styles.authorCard}>
          <div className={styles.avatarRingWrap}>
            <div className={styles.avatarRing} aria-hidden="true" />
            <div className={styles.authorAvatar}>
              <span className={styles.authorAvatarInitials}>FM</span>
            </div>
          </div>
          <div className={styles.authorInfo}>
            <p className={styles.authorBuiltBy}>Built by</p>
            <a
              href="https://github.com/UBF21"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.authorName}
            >
              Felipe Montenegro
            </a>
            <p className={styles.authorBio}>
              .NET developer and open-source contributor. Also the author of{' '}
              <a
                href="https://github.com/UBF21/Vali-Mediator"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.authorLink}
              >
                Vali-Mediator
              </a>
              .
            </p>
          </div>
          <div className={styles.authorLinks}>
            <a
              href="https://github.com/UBF21"
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(styles.authorSocialLink, styles.authorSocialLinkGithub)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>
            <a
              href="https://www.nuget.org/profiles/UBF21"
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(styles.authorSocialLink, styles.authorSocialLinkNuget)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L20 8.5v7L12 19.82 4 15.5v-7L12 4.18z" />
              </svg>
              NuGet
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Lightweight fluent validation library for .NET 7/8/9 — zero external dependencies"
    >
      <HeroSection />
      <main>
        <FeaturesSection />
        <QuickExampleSection />
        <PackagesSection />
        <AuthorSection />
      </main>
    </Layout>
  );
}
