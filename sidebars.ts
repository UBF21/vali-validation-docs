import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'index',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'introduction',
        'installation',
        'quick-start',
      ],
    },
    {
      type: 'category',
      label: 'Validators & Rules',
      items: [
        'validators',
        'basic-rules',
        'advanced-rules',
        'modifiers',
        'cascade-mode',
      ],
    },
    {
      type: 'category',
      label: 'Results & Errors',
      items: [
        'validation-result',
        'exceptions',
      ],
    },
    {
      type: 'category',
      label: 'Integration & DI',
      items: [
        'dependency-injection',
        'aspnetcore-integration',
        'mediatr-integration',
        'valimediator-integration',
      ],
    },
    {
      type: 'category',
      label: 'Advanced Patterns',
      items: [
        'advanced-patterns',
        'switch-case',
      ],
    },
  ],
};

export default sidebars;
