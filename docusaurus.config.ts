import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Vali-Validation',
  tagline: '// fluent validation library for .NET',
  favicon: 'img/favicon.ico',

  url: 'https://vali-validation.dev',
  baseUrl: '/',

  organizationName: 'UBF21',
  projectName: 'vali-validation-docs',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    localeConfigs: {
      en: {
        label: 'English',
        direction: 'ltr',
        htmlLang: 'en-US',
      },
      es: {
        label: 'Español',
        direction: 'ltr',
        htmlLang: 'es-ES',
      },
    },
  },

  headTags: [
    {
      tagName: 'link',
      attributes: { rel: 'canonical', href: 'https://vali-validation.dev/' },
    },
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Vali-Validation',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        description: 'Fluent validation library for .NET with rule chaining, async validators, and ASP.NET Core / MediatR integration.',
        url: 'https://www.nuget.org/packages/Vali-Validation',
        downloadUrl: 'https://www.nuget.org/packages/Vali-Validation',
        author: {
          '@type': 'Person',
          name: 'Felipe Rafael Montenegro Morriberon',
          url: 'https://www.linkedin.com/in/felipe-rafael-montenegro-morriberon-a79a341b2/',
        },
        programmingLanguage: 'C#',
        license: 'https://opensource.org/licenses/MIT',
      }),
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/UBF21/Vali-Validation/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.png',
    metadata: [
      { name: 'description', content: 'Vali-Validation is a fluent validation library for .NET with rule chaining, async validators, ASP.NET Core integration, MediatR pipeline support, and full i18n.' },
      { name: 'keywords', content: 'Vali-Validation, dotnet, .NET validation, fluent validation, rule chaining, async validation, ASP.NET Core, MediatR, NuGet, C# validation library' },
      { name: 'author', content: 'Felipe Rafael Montenegro Morriberon' },
      { name: 'robots', content: 'index, follow, max-image-preview:large' },
      { name: 'theme-color', content: '#6366f1' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Vali-Validation Docs' },
      { property: 'og:title', content: 'Vali-Validation — Fluent Validation Library for .NET' },
      { property: 'og:description', content: 'Fluent validation library for .NET with rule chaining, async validators, ASP.NET Core integration, MediatR pipeline support, and multilingual error messages.' },
      { property: 'og:url', content: 'https://vali-validation.dev/' },
      { property: 'og:image', content: 'https://vali-validation.dev/img/logo.png' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:locale:alternate', content: 'es_ES' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Vali-Validation — Fluent Validation Library for .NET' },
      { name: 'twitter:description', content: 'Fluent .NET validation with rule chaining, async validators, ASP.NET Core and MediatR pipeline support. Available on NuGet.' },
      { name: 'twitter:image', content: 'https://vali-validation.dev/img/logo.png' },
    ],
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
    navbar: {
      title: 'Vali-Validation',
      logo: {
        alt: 'Vali-Validation Logo',
        src: 'img/logo.png',
        width: 32,
        height: 32,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://www.nuget.org/packages/Vali-Validation',
          label: 'NuGet',
          position: 'right',
        },
        {
          href: 'https://github.com/UBF21/Vali-Validation',
          label: 'GitHub',
          position: 'right',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Introduction',
              to: '/docs/introduction',
            },
            {
              label: 'Quick Start',
              to: '/docs/quick-start',
            },
            {
              label: 'Basic Rules',
              to: '/docs/basic-rules',
            },
          ],
        },
        {
          title: 'Packages',
          items: [
            {
              label: 'Vali-Validation (NuGet)',
              href: 'https://www.nuget.org/packages/Vali-Validation/',
            },
            {
              label: 'Vali-Validation.AspNetCore',
              href: 'https://www.nuget.org/packages/Vali-Validation.AspNetCore/',
            },
            {
              label: 'Vali-Validation.MediatR',
              href: 'https://www.nuget.org/packages/Vali-Validation.MediatR/',
            },
            {
              label: 'Vali-Validation.ValiMediator',
              href: 'https://www.nuget.org/packages/Vali-Validation.ValiMediator/',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/UBF21',
            },
            {
              label: 'Vali-Mediator',
              href: 'https://www.nuget.org/packages/Vali-Mediator/',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Vali-Validation. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.oneLight,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ['csharp', 'bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
