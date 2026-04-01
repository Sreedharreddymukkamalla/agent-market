"use client"

import Link from 'next/link'
import React from 'react'
import { AGENTS } from './ui'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default function AgentMarketPage() {
    return (
        <DashboardLayout>
            <main className="max-w-6xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6 text-default-900">MCP Market</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {AGENTS.map((a) => (
                        <div key={a.id} className="bg-surface border border-divider rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                            <div className="flex gap-3">
                                <span className="text-2xl shrink-0 leading-none pt-0.5" aria-hidden>{a.icon}</span>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-semibold text-default-900">{a.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                                <Link href={`/agent-market/${a.id}`} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Explore</Link>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </DashboardLayout>
    )
}
