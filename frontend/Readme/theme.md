# VendorBridge Frontend Design System & AI Agent Guidelines

## 1. Core Stack

* **Framework:** React + Vite
* **Styling:** Tailwind CSS
* **Component Library:** shadcn/ui (Radix UI primitives)
* **Icons:** `lucide-react` (Strictly use this; do not use MUI or other icon libraries)
* **Animation:** `framer-motion`

## 2. Global Aesthetics (Light Theme)

The application must look sophisticated, clean, and enterprise-ready. Avoid highly rounded corners or playful UI elements.

* **Theme:** Light Mode (Strict).
* **Borders:** Subtle and crisp (e.g., `border-slate-200`).
* **Shadows:** Very soft, large spread for modals/cards (e.g., `shadow-sm` for standard cards, `shadow-xl` for dropdowns).
* **Border Radius:** Minimal (`rounded-md` or `rounded-lg`).

## 3. Color Palette (Tailwind Classes)

* **Background:** `bg-slate-50` (Main app background for subtle contrast against white cards).
* **Surface/Cards:** `bg-white` (Used for all data tables, sidebars, and widgets).
* **Primary Text:** `text-slate-900` (Headings, primary data).
* **Secondary Text:** `text-slate-500` (Subtitles, table headers, helper text).
* **Primary Brand/Accent:** `bg-emerald-600` / `text-emerald-600` (Used for primary buttons, active states, and highlighting lowest prices or approved statuses).
* **Secondary Brand:** `bg-indigo-600` / `text-indigo-600` (Used for secondary actions or distinct interactive elements).
* **Danger/Reject:** `bg-rose-500` / `text-rose-600`.
* **Warning/Pending:** `bg-amber-500` / `text-amber-600`.

## 4. Typography

* **Font Family:** 'Roboto', sans-serif.
* **Hierarchy & Weights:**
  * **Page Titles:** `text-2xl font-bold tracking-tight text-slate-900`
  * **Card Headers:** `text-lg font-semibold text-slate-800`
  * **Table Headers:** `text-xs font-medium uppercase tracking-wider text-slate-500`
  * **Body/Data:** `text-sm font-normal text-slate-700`

## 5. Animation (Framer Motion Defaults)

Keep animations subtle and professional.

* **Page Transitions:** Fade in and slide up slightly.
  * `<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} />`
* **List Items/Table Rows:** Staggered fade-ins.
* **Hover States:** Tailwind standard transitions (`transition-colors duration-200`) instead of complex framer-motion variants.

## 6. Layout Conventions

* **Sidebar:** Fixed left, white background, right border (`border-r border-slate-200`).
* **Top Navigation/Header:** Fixed top, bottom border, minimal height.
* **Main Content Area:** `p-6` or `p-8` spacing, responsive grid layouts (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`).
* **Tables:** Full width, borders between rows (`divide-y divide-slate-200`), hover effect on rows (`hover:bg-slate-50`).

## 7. AI Generation Directives

* Always output complete, copy-pasteable React components.
* Assume `shadcn/ui` components (like `Button`, `Card`, `Table`, `Input`, `Badge`) are available in `@/components/ui/`.
* Do not hallucinate CSS files; use exclusively Tailwind classes.
