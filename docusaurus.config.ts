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
