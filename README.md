# Growth & Opportunity OS

**Enterprise growth, opportunity intelligence, tender management, and execution — in one modular operating system.**

Part of the **Enterprise Intelligence Suite**: a family of reusable, white-label products designed to move from strategy to execution across different organizations and sectors.

## Overview

Growth & Opportunity OS helps organizations discover, qualify, pursue, and execute growth opportunities through a unified workflow. It is designed to support marketing, business development, tendering, partnerships, and executive oversight without hard-coding a specific organization into the product core.

## Core capabilities

- Opportunity radar and qualification
- Tender and bid lifecycle management
- Business-development pipeline
- Task ownership and accountability
- Document and knowledge center
- Pricing and evaluation workflows
- Executive dashboards and reporting
- Lessons learned and institutional memory
- Role-based access control
- AI-assisted analysis and recommendations

## Product architecture

```text
Core Engine
├── Opportunity Intelligence
├── Tender & Bid Management
├── Workflow & Tasks
├── Documents & Knowledge
├── Analytics & Reporting
└── AI Assistance

Configuration Layer
├── Modules
├── Roles & Permissions
├── Integrations
└── Business Rules

Tenant Layer
├── Organization Data
├── Users & Teams
└── Operational Workflows

Brand Layer
├── Name & Logo
├── Theme & Typography
└── Domain & Locale
```

The product can integrate with an external ERP, identity provider, CRM, or data platform. Organization-specific integrations should remain isolated behind adapters and environment configuration.

## Technology

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase / serverless data services
- External ERP and identity integrations
- GitHub Actions
- Vercel-compatible deployment

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to your local environment file and provide your own deployment values. **Never commit credentials, service-role keys, API tokens, tenant secrets, or production identifiers.**

## White-label model

A production deployment should treat the organization as a **tenant/reference implementation**, not as part of the core source architecture. Branding, user directories, permissions, domains, and integration endpoints should be supplied through configuration.

## Enterprise Intelligence Suite

| Product | Focus |
|---|---|
| **Growth & Opportunity OS** | Growth, marketing, opportunities and tenders |
| [**Executive Office OS**](https://github.com/musu-deep/araak-ceo) | Executive office, decisions and follow-up |
| [**Strategy Execution OS**](https://github.com/musu-deep/araak-development-command-center) | Strategy, initiatives, KPIs and execution |
| [**Logistics Business Platform**](https://github.com/musu-deep/araak-logistics-website) | Logistics services and digital customer journeys |
| [**Learning & Academy OS**](https://github.com/musu-deep/Araak-university) | Learning, academies and capability development |
| [**Live Broadcast Studio**](https://github.com/musu-deep/SAKINAH-LIVE-Android) | Mobile live broadcasting and interactive content |

## Product status

**Generalization in progress.** The current implementation is being refactored from a single-organization deployment into a reusable multi-environment product.

See [`PRODUCT_STRATEGY.md`](./PRODUCT_STRATEGY.md) for the product-generalization direction.

## Security

No production secrets belong in this repository. Review [`SECURITY.md`](./SECURITY.md) before publishing or deploying a tenant implementation.
