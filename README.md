# AI4S Smart HR

## Overview
AI4S Smart HR is a comprehensive Next.js based Single Page Application (SPA) designed for Human Resources management. It features a robust layout, dynamic dashboards for different roles, structural role-based access control (RBAC), and various administrative modules including employees, payroll, attendance, leave management, audits, interviews, and more.

## Architecture & Codebase

The application is built using modern web development practices:
- **Framework**: Next.js (App Router)
- **Styling**: Global CSS (`globals.css`)
- **State Management & Data**: Context API (`AppContext.js`) combined with mock data for local development (`mockData.js`).
- **Authorization**: Custom Role-Based Access Control logic (`rbac.js`).

### Application Structure (`app/` Directory)
The `app/` folder uses the Next.js App Router paradigm. Each folder represents a route or a module:
- `globals.css`: Contains all of the global styling and utility classes.
- `layout.js` & `page.js`: The root layout and index page of the application.
- `ClientProviders.js`: Global context providers wrapper component for client-side state.
- `login/`: The authentication and login page functionality.
- `dashboard/`: The main authenticated application interface, which aggregates all core HR features:
  - **Administration & Roles**: `admin/`, `superadmin/`, `manager/`, `roles/`, `security/`, `settings/`
  - **Employee Lifecycle**: `onboarding/`, `offboarding/`, `employees/`, `employee/`
  - **Operational & Day-to-Day**: `attendance/`, `leaves/`, `payroll/`, `loans/`, `approvals/`
  - **Performance & Engagement**: `okr/`, `feedback/`, `interviews/`
  - **Record Keeping**: `audit/`, `profile/`

### Components (`components/` Directory)
Houses reusable UI components used throughout the application to maintain a consistent presentation:
- `DashboardLayout.js`: The central layout component that wraps dashboard routes, combining the sidebar and top header.
- `Sidebar.js`: Navigation menu granting access to different sections based on user roles and permissions.
- `TopHeader.js`: The top navigation bar containing global actions, user profile settings, and notifications.

### Libraries & Utilities (`lib/` Directory)
Centralized repository for business logic, constants, and helper utilities:
- `AppContext.js`: React Context providing global state (e.g. current user info, theme, global variables) to all components.
- `mockData.js`: A set of structured mock data used to populate tables, lists, and profiles while the backend is not yet fully integrated.
- `rbac.js`: Logic for mapping roles to permissions, and checking user authorization before rendering specific modules or components.

## Local Configuration
The root contains standard Node/Next.js configuration files:
- `next.config.js`: Configuration for the Next.js compiler, runtime settings, and plugins.
- `package.json` & `package-lock.json`: Stores all project dependencies, scripts (e.g., `npm run dev`), build configurations, and version locks.
- `jsconfig.json`: Configured for better IDE support, handling absolute imports, and path aliases.

## Getting Started

1. **Install dependencies**: run `npm install` or `npm ci`
2. **Run local dev server**: `npm run dev`
3. **Open browser**: Visit `http://localhost:3000` to interact with the application.
4. Log in using available mock credentials to explore different RBAC dashboard views.

> **Note**: This environment is populated with mock data; certain actions will not persist upon a hard refresh until backend integration is finalized.
