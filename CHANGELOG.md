# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha] - 2026-05-11

### Added
- Initial Alpha Skeleton of BMI University Management System
- 100% open-source architecture defined (Ollama, PocketBase, Hono.js, React)
- Dockerized development environment with Caddy and service orchestration
- Backend API initialized with Hono.js
- PocketBase integration for Database and Auth
- Basic Student and Staff management (API-connected)
- Dashboard skeleton with mock/initial data
- AI integration foundation via local Ollama LLM
- JWT-based authentication infrastructure

### Fixed
- Removed Tailwind Play CDN to prevent production CSS breakage
- Cleaned up frontend dependencies (removed backend-specific packages)
- Fixed Makefile to support full-stack development (`make dev`)
- Created truthful Implementation Checklist

### Planned
- Role-based access control (RBAC) full integration
- Audit logging for all critical operations
- Grade recording and transcript generation
- Certificate generation with QR code verification
- Finance module transaction verification
- Comprehensive test suite and CI/CD
- Mobile application and PWA support

### Documentation
- Complete README with quick start guide
- Architecture documentation
- Security policy
- Contributing guidelines
- API documentation
- Deployment guides

## [Unreleased]

### Planned
- Mobile application
- Advanced analytics and reporting
- Email notifications
- SMS integration
- Backup and restore functionality
- Multi-language support
- Dark mode
- Advanced search and filtering
- Bulk operations
- Custom report builder

---

[1.0.0]: https://github.com/KIAI-JOSEPH/BMI-PORTAL/releases/tag/v1.0.0
