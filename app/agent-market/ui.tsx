"use client"

import React, { useState, useRef } from 'react'

// Shared types
export type MCPContentItem =
    | { type: 'text'; text: string }
    | { type: 'image'; data: string; mimeType: string }
    | { type: 'resource' }

type StreamEvent =
    | { type: 'status'; data: string }
    | { type: 'result'; data: MCPContentItem[] }
    | { type: 'error'; data: string }
    | { type: 'done'; data: null }

// Reusable streaming hook
export function useStreamingCall(endpoint: string) {
    const [loading, setLoading] = useState(false)
    const [statusMessages, setStatusMessages] = useState<string[]>([])
    const [result, setResult] = useState<MCPContentItem[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    const call = async (body: Record<string, unknown>) => {
        if (abortRef.current) abortRef.current.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setLoading(true)
        setStatusMessages([])
        setResult(null)
        setError(null)

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal,
            })

            if (!response.body) {
                setError('No response stream')
                setLoading(false)
                return
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n\n')
                buffer = lines.pop() ?? ''
                for (const line of lines) {
                    const stripped = line.replace(/^data: /, '').trim()
                    if (!stripped) continue
                    try {
                        const event: StreamEvent = JSON.parse(stripped)
                        if (event.type === 'status') setStatusMessages((p) => [...p, event.data as string])
                        else if (event.type === 'result') setResult(event.data as MCPContentItem[])
                        else if (event.type === 'error') setError(event.data as string)
                        else if (event.type === 'done') setLoading(false)
                    } catch { /* skip */ }
                }
            }
        } catch (err) {
            if ((err as Error).name === 'AbortError') return
            setError(err instanceof Error ? err.message : 'Request failed')
        } finally {
            setLoading(false)
        }
    }

    const reset = () => {
        if (abortRef.current) abortRef.current.abort()
        setLoading(false)
        setStatusMessages([])
        setResult(null)
        setError(null)
    }

    return { loading, statusMessages, result, error, call, reset }
}

/** Renders MCP stream items so text and images are visible in light/dark mode. */
/** Result panel with header + clear; use for all streaming agent tabs. */
export function MCPResultSection({
  result,
  onClear,
  loading,
}: {
  result: MCPContentItem[] | null;
  onClear: () => void;
  loading: boolean;
}) {
  if (!result || loading) return null;
  return (
    <div className="bg-surface border border-divider rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-divider/50 bg-muted/30">
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          <span className="text-emerald-600 dark:text-emerald-400" aria-hidden>
            {'\u2713'}
          </span>{' '}
          Result
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground transition"
        >
          Clear
        </button>
      </div>
      <div className="p-5 max-h-[34rem] overflow-y-auto">
        <MCPResultRenderer result={result} />
      </div>
    </div>
  );
}

export function MCPResultRenderer({ result }: { result: MCPContentItem[] }) {
  const hasRenderable = result.some(
    (item) => item.type === "text" || item.type === "image",
  );
  if (!hasRenderable) {
    return (
      <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono text-default-900">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  }
  return (
    <div className="space-y-4">
      {result.map((item, i) => {
        if (item.type === "text") {
          return (
            <p
              key={i}
              className="whitespace-pre-wrap text-sm leading-relaxed text-default-900"
            >
              {item.text}
            </p>
          );
        }
        if (item.type === "image") {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={`data:${item.mimeType};base64,${item.data}`}
              alt="Result"
              className="max-h-[min(70vh,32rem)] max-w-full rounded-xl border border-divider bg-[var(--surface-secondary)] object-contain shadow-sm"
            />
          );
        }
        return (
          <pre
            key={i}
            className="rounded-lg bg-[var(--tool-code-bg)] p-3 text-xs text-default-800"
          >
            {JSON.stringify(item, null, 2)}
          </pre>
        );
      })}
      <details className="rounded-lg border border-divider bg-[var(--surface-secondary)] text-xs text-default-600">
        <summary className="cursor-pointer px-3 py-2 font-medium text-default-800">
          Raw JSON
        </summary>
        <pre className="max-h-48 overflow-auto border-t border-divider p-3 font-mono text-[11px] text-default-900">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export function StatusStream({ loading, messages }: { loading: boolean; messages: string[] }) {
    if (!loading && messages.length === 0) return null
    return (
        <div className="space-y-1.5">
            {messages.map((msg, i) => {
                const isLast = loading && i === messages.length - 1
                return (
                    <div
                        key={i}
                        className={`flex items-center gap-2.5 text-sm px-4 py-2.5 rounded-lg border transition-all ${isLast
                            ? 'text-foreground bg-muted/60 border-divider'
                            : 'text-muted-foreground bg-muted/30 border-divider/30'
                            }`}
                    >
                        {isLast ? (
                            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-500 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
                            </span>
                        ) : (
                            <span className="text-emerald-600 dark:text-emerald-500 text-xs font-bold flex-shrink-0">{'\u0003'}</span>
                        )}
                        {msg}
                    </div>
                )
            })}
        </div>
    )
}

export function ErrorBox({ error }: { error: string }) {
    return (
        <div className="rounded-xl border border-danger/35 bg-danger/10 px-5 py-4 text-sm text-danger flex items-start gap-3 dark:border-danger/40 dark:bg-danger/15">
            <span className="text-lg flex-shrink-0">{'\u26A0\uFE0F'}</span>
            <div>
                <div className="font-semibold mb-1">Error</div>
                <div>{error}</div>
            </div>
        </div>
    )
}

export function YouTubeTab() {
    const [url, setUrl] = useState('')
    const [lang, setLang] = useState('')
    const { loading, statusMessages, result, error, call, reset } = useStreamingCall('/api/agent-market/youtube')

    const runAction = (action: string) => {
        if (!url.trim()) return
        call({ url: url.trim(), action, lang: lang.trim() || undefined })
    }

    const EXAMPLE_URLS = [
        { label: 'Rick Astley – Never Gonna Give You Up', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { label: 'TED: The power of vulnerability', url: 'https://www.youtube.com/watch?v=iCvmsMzlF7o' },
        { label: 'Fireship – 100s of TypeScript', url: 'https://www.youtube.com/watch?v=zQnBQ4tB3ZA' },
    ]

    const YT_ACTIONS = [
        { id: 'get_video_info', label: 'Video Info', icon: '\u{1F3AC}', description: 'Title, author, description & metadata' },
        { id: 'get_transcript', label: 'Transcript', icon: '\u{1F4DD}', description: 'Full plain-text transcript' },
        { id: 'get_timed_transcript', label: 'Timed Transcript', icon: '\u23F1\uFE0F', description: 'Transcript with timestamps' },
    ]

    return (
        <div className="space-y-6">
            <div className="bg-surface border border-divider rounded-2xl p-6 space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="yt-url">YouTube URL</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none pointer-events-none">{'\u{1F517}'}</span>
                        <input
                            id="yt-url"
                            type="url"
                            value={url}
                            onChange={(e) => { setUrl(e.target.value); reset() }}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full bg-muted/70 border border-divider rounded-xl pl-9 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background transition"
                            disabled={loading}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                        {EXAMPLE_URLS.map((ex) => (
                            <button
                                key={ex.url}
                                onClick={() => { setUrl(ex.url); reset() }}
                                className="text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted border border-divider rounded-full px-3 py-1 transition"
                            >
                                {ex.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="lang">
                        Language{' '}
                        <span className="text-muted-foreground font-normal">(optional — e.g. <code className="text-xs">en</code>, <code className="text-xs">es</code>)</span>
                    </label>
                    <input
                        id="lang"
                        type="text"
                        value={lang}
                        onChange={(e) => setLang(e.target.value)}
                        placeholder="en"
                        maxLength={10}
                        className="w-28 bg-muted/70 border border-divider rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background transition"
                        disabled={loading}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {YT_ACTIONS.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => runAction(action.id)}
                            disabled={loading || !url.trim()}
                            className="rounded-xl border border-divider bg-surface p-4 text-left text-foreground transition-colors hover:bg-muted/60 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed dark:hover:bg-muted/40"
                        >
                            <div className="text-2xl mb-2" aria-hidden>{action.icon}</div>
                            <div className="font-semibold text-sm text-default-900">{action.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{action.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            <StatusStream loading={loading} messages={statusMessages} />
            {error && <ErrorBox error={error} />}

            <MCPResultSection result={result} onClear={reset} loading={loading} />

        </div>
    )
}

// Generic panel used for non-YouTube agents
// Perplexity types
type PerplexityTool = 'perplexity_ask' | 'perplexity_reason' | 'perplexity_research'

const PERPLEXITY_TOOLS: { id: PerplexityTool; label: string; icon: string; description: string }[] = [
    { id: 'perplexity_ask', label: 'Ask', icon: '\u{1F50D}', description: 'Fast web-grounded answer' },
    { id: 'perplexity_reason', label: 'Reason', icon: '\u{1F9E0}', description: 'Deep reasoning over your question' },
    { id: 'perplexity_research', label: 'Research', icon: '\u{1F4DA}', description: 'In-depth multi-source research' },
]

const PERPLEXITY_EXAMPLE_QUERIES = [
    'What are the latest breakthroughs in quantum computing?',
    'Explain the differences between React Server Components and Client Components',
    'What is the current state of fusion energy research?',
]

// Wikipedia types
type WikipediaTool =
    | 'search_wikipedia'
    | 'get_summary'
    | 'get_article'
    | 'extract_key_facts'
    | 'get_related_topics'
    | 'summarize_article_for_query'

const WIKIPEDIA_TOOLS: { id: WikipediaTool; label: string; icon: string; description: string; argLabel: string; argPlaceholder: string }[] = [
    { id: 'search_wikipedia', label: 'Search', icon: '\u{1F50E}', description: 'Search Wikipedia for articles', argLabel: 'Search query', argPlaceholder: 'e.g. Quantum computing' },
    { id: 'get_summary', label: 'Summary', icon: '\u{1F4C4}', description: 'Get a concise summary of an article', argLabel: 'Article title', argPlaceholder: 'e.g. Albert Einstein' },
    { id: 'get_article', label: 'Full Article', icon: '\u{1F4DA}', description: 'Retrieve the full article content', argLabel: 'Article title', argPlaceholder: 'e.g. JavaScript' },
    { id: 'extract_key_facts', label: 'Key Facts', icon: '\u{1F9E0}', description: 'Extract key facts from an article', argLabel: 'Article title', argPlaceholder: 'e.g. Black hole' },
    { id: 'get_related_topics', label: 'Related Topics', icon: '\u{1F517}', description: 'Get related topics via links & categories', argLabel: 'Article title', argPlaceholder: 'e.g. Machine learning' },
    { id: 'summarize_article_for_query', label: 'Query Summary', icon: '\u{1F4AC}', description: 'Article snippet focused on your specific query', argLabel: 'Topic & query', argPlaceholder: 'e.g. Einstein relativity' },
]

const WIKIPEDIA_EXAMPLES: { tool: WikipediaTool; label: string; value: string }[] = [
    { tool: 'search_wikipedia', label: 'Search: TypeScript', value: 'TypeScript programming language' },
    { tool: 'get_summary', label: 'Summary: Marie Curie', value: 'Marie Curie' },
    { tool: 'get_article', label: 'Article: React (web)', value: 'React (software)' },
    { tool: 'extract_key_facts', label: 'Facts: Black hole', value: 'Black hole' },
    { tool: 'get_related_topics', label: 'Related: Deep learning', value: 'Deep learning' },
]

// Airbnb types
type AirbnbTool = 'airbnb_search' | 'airbnb_listing_details'

const AIRBNB_TOOLS: { id: AirbnbTool; label: string; icon: string; description: string }[] = [
    { id: 'airbnb_search', label: 'Search Listings', icon: '\u{1F50D}', description: 'Search by location with filters' },
    { id: 'airbnb_listing_details', label: 'Listing Details', icon: '\u{1F3E0}', description: 'Full details for a specific listing ID' },
]

const AIRBNB_LOCATION_EXAMPLES = [
    'New York, NY',
    'Paris, France',
    'Tokyo, Japan',
    'Barcelona, Spain',
]

// HackerNews types
type HackerNewsTool = 'search_stories' | 'get_stories' | 'get_story_info' | 'get_user_info'

const HN_TOOLS: { id: HackerNewsTool; label: string; icon: string; description: string }[] = [
    { id: 'search_stories', label: 'Search Stories', icon: '\u{1F50D}', description: 'Search stories by keyword' },
    { id: 'get_stories', label: 'Browse Stories', icon: '\u{1F4CB}', description: 'Top, new, Ask HN or Show HN stories' },
    { id: 'get_story_info', label: 'Story Details', icon: '\u{1F4AC}', description: 'Full story and comments by ID' },
    { id: 'get_user_info', label: 'User Profile', icon: '\u{1F464}', description: 'Profile and submitted stories for a user' },
]

const HN_STORY_TYPES = [
    { id: 'top', label: '\uD83D\uDD25 Top' },
    { id: 'new', label: '\u2728 New' },
    { id: 'ask_hn', label: '\u2753 Ask HN' },
    { id: 'show_hn', label: '\uD83D\uDE80 Show HN' },
]

const HN_EXAMPLES: { tool: HackerNewsTool; label: string; value: string }[] = [
    { tool: 'search_stories', label: 'Search: Next.js 15', value: 'Next.js 15' },
    { tool: 'search_stories', label: 'Search: AI agents', value: 'AI agents' },
    { tool: 'get_user_info', label: 'User: dang', value: 'dang' },
    { tool: 'get_user_info', label: 'User: pg', value: 'pg' },
]

// Paper Search types
type PaperMode = 'search' | 'read' | 'download'
type PaperSource = 'arxiv' | 'pubmed' | 'biorxiv' | 'medrxiv' | 'semantic' | 'crossref' | 'google_scholar' | 'iacr'

const PAPER_MODES: { id: PaperMode; label: string; icon: string; description: string }[] = [
    { id: 'search', label: 'Search', icon: '\u{1F50D}', description: 'Search by keyword across a database' },
    { id: 'read', label: 'Read Paper', icon: '\u{1F4C4}', description: 'Extract full text from a paper by ID' },
    { id: 'download', label: 'Download PDF', icon: '\u{1F4E5}', description: 'Download PDF of a paper by ID' },
]

const PAPER_SOURCES: { id: PaperSource; label: string; modesSupported: PaperMode[] }[] = [
    { id: 'arxiv', label: 'arXiv', modesSupported: ['search', 'read', 'download'] },
    { id: 'pubmed', label: 'PubMed', modesSupported: ['search', 'read', 'download'] },
    { id: 'semantic', label: 'Semantic Scholar', modesSupported: ['search', 'read', 'download'] },
    { id: 'biorxiv', label: 'bioRxiv', modesSupported: ['search', 'read', 'download'] },
    { id: 'medrxiv', label: 'medRxiv', modesSupported: ['search', 'read', 'download'] },
    { id: 'crossref', label: 'CrossRef', modesSupported: ['search', 'read', 'download'] },
    { id: 'google_scholar', label: 'Google Scholar', modesSupported: ['search'] },
    { id: 'iacr', label: 'IACR ePrint', modesSupported: ['search', 'read', 'download'] },
]

const PAPER_SEARCH_EXAMPLES = [
    'large language models',
    'CRISPR gene editing',
    'transformer architecture attention',
    'quantum error correction',
]

// Perplexity panel
export function PerplexityTab() {
    const [query, setQuery] = useState('')
    const [tool, setTool] = useState<PerplexityTool>('perplexity_ask')
    const { loading, statusMessages, result, error, call, reset } = useStreamingCall('/api/agent-market/perplexity')

    const ask = () => {
        if (!query.trim()) return
        call({ query: query.trim(), tool })
    }

    return (
        <div className="space-y-6">
            <div className="bg-surface border border-divider rounded-2xl p-6 space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Ask anything</label>
                    <textarea
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); reset() }}
                        placeholder="What would you like to know?"
                        rows={3}
                        className="w-full bg-muted/70 border border-divider rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none"
                        disabled={loading}
                    />
                    <div className="flex flex-wrap gap-2">
                        {PERPLEXITY_EXAMPLE_QUERIES.map((q) => (
                            <button key={q} onClick={() => { setQuery(q); reset() }} className="text-xs text-muted-foreground hover:text-foreground bg-muted border border-divider rounded-full px-3 py-1">{q.length > 52 ? q.slice(0, 51) + '\u2026' : q}</button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Mode</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {PERPLEXITY_TOOLS.map((t) => (
                            <button key={t.id} onClick={() => { setTool(t.id); reset() }} disabled={loading} className={`rounded-xl border border-divider p-4 text-left transition-colors ${tool === t.id ? 'bg-default ring-2 ring-focus' : 'bg-surface hover:bg-muted/50 dark:hover:bg-muted/30'}`}>
                                <div className="text-2xl mb-2" aria-hidden>{t.icon}</div>
                                <div className="font-semibold text-sm text-default-900">{t.label}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={ask} disabled={loading || !query.trim()} className="w-full rounded-xl py-3.5 font-semibold text-sm bg-primary text-primary-foreground disabled:opacity-50"> {loading ? 'Running...' : `${PERPLEXITY_TOOLS.find((p) => p.id === tool)?.icon} ${PERPLEXITY_TOOLS.find((p) => p.id === tool)?.label} with Perplexity`}</button>
            </div>

            <StatusStream loading={loading} messages={statusMessages} />
            {error && <ErrorBox error={error} />}

            <MCPResultSection result={result} onClear={reset} loading={loading} />
        </div>
    )
}

// Wikipedia panel
export function WikipediaTab() {
    const [tool, setTool] = useState<WikipediaTool>('search_wikipedia')
    const [input, setInput] = useState('')
    const { loading, statusMessages, result, error, call, reset } = useStreamingCall('/api/agent-market/wikipedia')

    const run = () => {
        if (!input.trim()) return
        call({ query: input.trim(), tool })
    }

    const selected = WIKIPEDIA_TOOLS.find((t) => t.id === tool)!

    return (
        <div className="space-y-6">
            <div className="bg-surface border border-divider rounded-2xl p-6 space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tool</label>
                    <div className="grid grid-cols-2 gap-3">
                        {WIKIPEDIA_TOOLS.map((t) => (
                            <button key={t.id} onClick={() => { setTool(t.id); reset() }} disabled={loading} className={`rounded-xl border border-divider p-3 text-left transition-colors ${tool === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                <div className="font-semibold text-sm"><span aria-hidden>{t.icon}</span> {t.label}</div>
                                <div className={`text-xs mt-0.5 ${tool === t.id ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>{t.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground">{selected.argLabel}</label>
                    <input value={input} onChange={(e) => { setInput(e.target.value); reset() }} placeholder={selected.argPlaceholder} className="w-full bg-muted/70 border border-divider rounded-xl px-4 py-2 text-sm" disabled={loading} />
                    <div className="flex flex-wrap gap-2 mt-2">
                        {WIKIPEDIA_EXAMPLES.map((ex) => (
                            <button type="button" key={ex.label} onClick={() => { setInput(ex.value); reset() }} className="text-xs text-foreground bg-muted border border-divider rounded-full px-3 py-1 hover:bg-muted/80">{ex.label}</button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={run} disabled={loading || !input.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Run</button>
                    <button type="button" onClick={reset} className="px-3 py-2 rounded-lg border border-divider text-foreground hover:bg-muted/50 transition">Clear</button>
                </div>
            </div>

            <StatusStream loading={loading} messages={statusMessages} />
            {error && <ErrorBox error={error} />}

            <MCPResultSection result={result} onClear={reset} loading={loading} />
        </div>
    )
}

// Airbnb panel
export function AirbnbTab() {
    const [tool, setTool] = useState<AirbnbTool>('airbnb_search')
    const [location, setLocation] = useState('')
    const [listingId, setListingId] = useState('')
    const { loading, statusMessages, result, error, call, reset } = useStreamingCall('/api/agent-market/airbnb')

    const isSearch = tool === 'airbnb_search'

    const run = () => {
        if (isSearch) {
            if (!location.trim()) return
            call({ tool, location: location.trim() })
        } else {
            if (!listingId.trim()) return
            call({ tool, id: listingId.trim() })
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-surface border border-divider rounded-2xl p-6 space-y-4">
                <div>
                    <label className="text-sm font-medium text-foreground">Tool</label>
                    <div className="grid grid-cols-2 gap-3">
                        {AIRBNB_TOOLS.map((t) => (
                            <button key={t.id} onClick={() => { setTool(t.id); reset() }} disabled={loading} className={`rounded-xl border border-divider p-3 text-left transition-colors ${tool === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                <div className="font-semibold text-sm"><span aria-hidden>{t.icon}</span> {t.label}</div>
                                <div className={`text-xs mt-0.5 ${tool === t.id ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>{t.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {isSearch ? (
                    <div>
                        <label className="text-sm font-medium text-foreground">Location</label>
                        <input value={location} onChange={(e) => { setLocation(e.target.value); reset() }} placeholder="e.g. Paris, France" className="w-full bg-muted/70 border border-divider rounded-xl px-4 py-2 text-sm" disabled={loading} />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {AIRBNB_LOCATION_EXAMPLES.map((loc) => (
                                <button type="button" key={loc} onClick={() => { setLocation(loc); reset() }} className="text-xs text-foreground bg-muted border border-divider rounded-full px-3 py-1 hover:bg-muted/80">{loc}</button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="text-sm font-medium text-foreground">Listing ID</label>
                        <input value={listingId} onChange={(e) => { setListingId(e.target.value); reset() }} placeholder="e.g. 12345678" className="w-full bg-muted/70 border border-divider rounded-xl px-4 py-2 text-sm" disabled={loading} />
                    </div>
                )}

                <div className="flex gap-2">
                    <button onClick={run} disabled={loading} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Run</button>
                    <button type="button" onClick={reset} className="px-3 py-2 rounded-lg border border-divider text-foreground hover:bg-muted/50 transition">Clear</button>
                </div>
            </div>

            <StatusStream loading={loading} messages={statusMessages} />
            {error && <ErrorBox error={error} />}

            <MCPResultSection result={result} onClear={reset} loading={loading} />
        </div>
    )
}

// HackerNews panel
export function HackerNewsTab() {
    const [tool, setTool] = useState<HackerNewsTool>('search_stories')
    const [query, setQuery] = useState('')
    const [storyType, setStoryType] = useState('top')
    const { loading, statusMessages, result, error, call, reset } = useStreamingCall('/api/agent-market/hackernews')

    const run = () => {
        if (tool === 'get_stories') {
            call({ tool, story_type: storyType })
        } else if (!query.trim()) return
        else call({ tool, query: query.trim() })
    }

    return (
        <div className="space-y-6">
            <div className="bg-surface border border-divider rounded-2xl p-6 space-y-4">
                <div>
                    <label className="text-sm font-medium text-foreground">Tool</label>
                    <div className="grid grid-cols-2 gap-3">
                        {HN_TOOLS.map((t) => (
                            <button key={t.id} onClick={() => { setTool(t.id); reset() }} disabled={loading} className={`rounded-xl border border-divider p-3 text-left transition-colors ${tool === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                <div className="font-semibold text-sm"><span aria-hidden>{t.icon}</span> {t.label}</div>
                                <div className={`text-xs mt-0.5 ${tool === t.id ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>{t.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {tool === 'get_stories' ? (
                    <div>
                        <label className="text-sm font-medium text-foreground">Story Type</label>
                        <div className="flex gap-2 mt-2">
                            {HN_STORY_TYPES.map((s) => (
                                <button key={s.id} type="button" onClick={() => setStoryType(s.id)} className={`text-xs px-3 py-1 rounded-full border border-divider ${storyType === s.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>{s.label}</button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="text-sm font-medium text-foreground">Query / ID / Username</label>
                        <input value={query} onChange={(e) => { setQuery(e.target.value); reset() }} placeholder="e.g. TypeScript, 39827987, dang" className="w-full bg-muted/70 border border-divider rounded-xl px-4 py-2 text-sm" disabled={loading} />
                    </div>
                )}

                <div className="flex gap-2">
                    <button onClick={run} disabled={loading || (tool !== 'get_stories' && !query.trim())} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Run</button>
                    <button type="button" onClick={reset} className="px-3 py-2 rounded-lg border border-divider text-foreground hover:bg-muted/50 transition">Clear</button>
                </div>
            </div>

            <StatusStream loading={loading} messages={statusMessages} />
            {error && <ErrorBox error={error} />}

            <MCPResultSection result={result} onClear={reset} loading={loading} />
        </div>
    )
}

// Paper search panel
export function PaperSearchTab() {
    const [mode, setMode] = useState<PaperMode>('search')
    const [source, setSource] = useState<PaperSource>('arxiv')
    const [query, setQuery] = useState('')
    const { loading, statusMessages, result, error, call, reset } = useStreamingCall('/api/agent-market/paper-search')

    const run = () => {
        if (!query.trim()) return
        call({ mode, source, query: query.trim() })
    }

    return (
        <div className="space-y-6">
            <div className="bg-surface border border-divider rounded-2xl p-6 space-y-4">
                <div>
                    <label className="text-sm font-medium text-foreground">Mode</label>
                    <div className="flex gap-2 mt-2">
                        {PAPER_MODES.map((m) => (
                            <button key={m.id} type="button" onClick={() => setMode(m.id)} className={`text-xs px-3 py-1 rounded-full border border-divider ${mode === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>{m.label}</button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground">Source</label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {PAPER_SOURCES.map((s) => (
                            <button key={s.id} type="button" onClick={() => setSource(s.id)} className={`text-xs px-3 py-1 rounded-full border border-divider ${source === s.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>{s.label}</button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground">Query or ID</label>
                    <input value={query} onChange={(e) => { setQuery(e.target.value); reset() }} placeholder="e.g. transformer attention" className="w-full bg-muted/70 border border-divider rounded-xl px-4 py-2 text-sm" disabled={loading} />
                    <div className="flex flex-wrap gap-2 mt-2">
                        {PAPER_SEARCH_EXAMPLES.map((ex) => (
                            <button type="button" key={ex} onClick={() => { setQuery(ex); reset() }} className="text-xs text-foreground bg-muted border border-divider rounded-full px-3 py-1 hover:bg-muted/80">{ex}</button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={run} disabled={loading || !query.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Run</button>
                    <button type="button" onClick={reset} className="px-3 py-2 rounded-lg border border-divider text-foreground hover:bg-muted/50 transition">Clear</button>
                </div>
            </div>

            <StatusStream loading={loading} messages={statusMessages} />
            {error && <ErrorBox error={error} />}

            <MCPResultSection result={result} onClear={reset} loading={loading} />
        </div>
    )
}

export function GenericAgentPanel({ title, endpoint, example, placeholder, agentId }: { title: string; endpoint: string; example?: string; placeholder?: string; agentId?: string }) {
    const [input, setInput] = useState(example ?? '')
    const [tools, setTools] = useState<string[] | null>(null)
    const [selectedTool, setSelectedTool] = useState<string | null>(null)
    const { loading, statusMessages, result, error, call, reset } = useStreamingCall(endpoint)

    React.useEffect(() => {
        if (!agentId) return
        let mounted = true
        ;(async () => {
            try {
                const res = await fetch(`/api/agent-market/tools/${agentId}`)
                if (!res.ok) return
                const data = await res.json()
                if (mounted && data && Array.isArray(data.tools)) {
                    setTools(data.tools)
                }
            } catch {
                // ignore
            }
        })()
        return () => { mounted = false }
    }, [agentId])

    const run = () => {
        if (!input || !input.trim()) return
        const body: Record<string, unknown> = {}
        if (endpoint.includes('youtube')) body.url = input.trim()
        else if (endpoint.includes('airbnb')) {
            body.location = input.trim()
            body.tool = selectedTool ?? 'airbnb_search'
        } else if (endpoint.includes('perplexity')) {
            body.query = input.trim()
            if (selectedTool) body.tool = selectedTool
        } else if (endpoint.includes('hackernews')) {
            body.query = input.trim()
            if (selectedTool) body.tool = selectedTool
        } else if (endpoint.includes('paper-search')) {
            body.query = input.trim()
            if (selectedTool) body.mode = selectedTool
        } else if (endpoint.includes('wikipedia')) {
            body.query = input.trim()
            if (selectedTool) body.tool = selectedTool
        } else if (endpoint.includes('imagegen')) {
            body.prompt = input.trim()
            if (selectedTool) body.tool = selectedTool
        }
        call(body)
    }

    return (
        <div className="space-y-6">
            <div className="bg-surface border border-divider rounded-2xl p-6 space-y-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-default-900">{title}</h3>
                    <div className="text-xs sm:text-sm text-muted-foreground font-mono break-all">{endpoint}</div>
                </div>

                {tools && tools.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {tools.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setSelectedTool(t)}
                                className={`text-xs px-3 py-1 rounded-full border border-divider ${selectedTool === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                    <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder ?? 'Enter input'} className="flex-1 bg-muted/70 border border-divider rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" disabled={loading} />
                    <div className="flex gap-2 shrink-0">
                        <button type="button" onClick={run} disabled={loading} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50">Run</button>
                        <button type="button" onClick={reset} className="px-3 py-2 rounded-lg border border-divider text-foreground hover:bg-muted/50 transition" disabled={loading}>Clear</button>
                    </div>
                </div>

                <StatusStream loading={loading} messages={statusMessages} />
                {error && <ErrorBox error={error} />}
            </div>

            <MCPResultSection result={result} onClear={reset} loading={loading} />
        </div>
    )
}

export const AGENTS: { id: string; title: string; description: string; icon: string }[] = [
    { id: 'youtube', title: 'YouTube', description: 'Extract transcripts & metadata from YouTube videos', icon: '\u{1F3AC}' },
    { id: 'perplexity', title: 'Perplexity', description: 'Web-grounded Q&A and research', icon: '\u{1F50D}' },
    { id: 'airbnb', title: 'Airbnb', description: 'Search listings and fetch listing details', icon: '\u{1F3E0}' },
    { id: 'hackernews', title: 'Hacker News', description: 'Search and browse Hacker News stories', icon: '\u{1F4CB}' },
    { id: 'paper-search', title: 'Paper Search', description: 'Search and read academic papers', icon: '\u{1F4DA}' },
    { id: 'wikipedia', title: 'Wikipedia', description: 'Search and summarize Wikipedia articles', icon: '\u{1F4D6}' },
    { id: 'imagegen', title: 'ImageGen', description: 'Generate images from prompts', icon: '\u{1F3A8}' },
]

export const AgentPanels: Record<string, React.FC<Record<string, unknown>>> = {
    youtube: () => <YouTubeTab />,
    perplexity: () => <PerplexityTab />,
    airbnb: () => <AirbnbTab />,
    hackernews: () => <HackerNewsTab />,
    ['paper-search']: () => <PaperSearchTab />,
    wikipedia: () => <WikipediaTab />,
    imagegen: () => <GenericAgentPanel title="Image Gen" endpoint="/api/agent-market/imagegen" agentId="imagegen" example={undefined} placeholder="Image prompt" />,
    
}

export default null
