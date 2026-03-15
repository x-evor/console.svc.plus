'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Terminal,
    LayoutDashboard,
    Rocket,
    Database,
    Key,
    Activity,
    Settings,
    Plus,
} from 'lucide-react'
import { SidebarHeader, SidebarContent, SidebarFooter } from './layout/SidebarRoot'

const navItems = [
    { href: '/panel', label: 'Console', icon: LayoutDashboard },
    { href: '/deployments', label: 'Deployments', icon: Rocket },
    { href: '/resources', label: 'Resources', icon: Database },
    { href: '/api-keys', label: 'API Keys', icon: Key },
    { href: '/panel/observability', label: 'Observability', icon: Activity },
    { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppSidebarContent() {
    const pathname = usePathname()

    return (
        <>
            <SidebarHeader className="mb-8">
                <div className="flex items-center gap-3 px-2">
                    <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <Terminal className="size-5" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-text dark:text-heading text-base font-bold leading-tight">console.svc.plus</h1>
                        <p className="text-primary text-xs font-medium uppercase tracking-wider">Eye-Care Mode</p>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <nav className="flex flex-col gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium ${pathname === item.href
                                ? 'bg-primary/10 text-primary'
                                : 'text-text-muted hover:bg-background-muted'
                                }`}
                        >
                            <item.icon className="size-5" />
                            <span className="text-sm">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </SidebarContent>

            <SidebarFooter>
                <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-sm hover:opacity-90 transition-opacity">
                    <Plus className="size-5" />
                    <span>New Project</span>
                </button>
            </SidebarFooter>
        </>
    )
}
