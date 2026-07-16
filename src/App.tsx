import { useMemo, useRef, useState } from 'react';
import { buildDiff, getSummary, type DataValue, type DiffNode } from './diff';
import { formatDocument, parseDocument, type Format } from './parser';

const sampleBefore = `{
  "project": "Atlas",
  "version": 2,
  "features": {
    "analytics": true,
    "exports": false,
    "theme": "midnight"
  },
  "team": ["Maya", "Leo"],
  "region": "eu-west"
}`;

const sampleAfter = `{
  "project": "Atlas",
  "version": 3,
  "features": {
    "analytics": true,
    "exports": true,
    "theme": "aurora",
    "realtime": true
  },
  "team": ["Maya", "Leo", "Noor"],
  "release": "2026.07"
}`;

type ViewMode = 'tree' | 'split';

const Icon = ({ name }: { name: 'spark' | 'shield' | 'upload' | 'swap' | 'download' | 'search' }) => {
  const paths = {
    spark: <path d="m12 3-1.2 4.2L7 9l3.8 1.8L12 15l1.2-4.2L17 9l-3.8-1.8L12 3Zm-6 9-.7 2.3L3 15l2.3.7L6 18l.7-2.3L9 15l-2.3-.7L6 12Zm11 3-.8 2.2L14 18l2.2.8L17 21l.8-2.2L20 18l-2.2-.8L17 15Z" />,
    shield: <path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Zm-1 12-3-3 1.4-1.4L11 12.2l3.6-3.6L16 10l-5 5Z" />,
    upload: <path d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14" />,
    swap: <path d="m7 7-3 3 3 3m-3-3h14m-1 7 3-3-3-3m3 3H6" />,
    download: <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" />,
    search: <path d="m20 20-4.5-4.5m2-5A7 7 0 1 1 3.5 10.5a7 7 0 0 1 14 0Z" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24">{paths[name]}</svg>;
};

const valueLabel = (value: DataValue | undefined) => {
  if (value === undefined) return '';
  if (typeof value === 'string') return `“${value}”`;
  return JSON.stringify(value);
};

function TreeNode({ node, level, query, changesOnly }: { node: DiffNode; level: number; query: string; changesOnly: boolean }) {
  const matches = !query || node.path.toLowerCase().includes(query.toLowerCase());
  const visibleChildren = node.children?.filter((child) => {
    if (query && (child.path.toLowerCase().includes(query.toLowerCase()) || child.children)) return true;
    return !changesOnly || child.status !== 'unchanged';
  });

  if ((!matches && !visibleChildren?.length) || (changesOnly && node.status === 'unchanged')) return null;

  return (
    <div className="tree-node">
      <div className={`tree-row status-${node.status}`} style={{ '--level': level } as React.CSSProperties}>
        <span className="status-dot" />
        <code className="node-path">{node.key}</code>
        <span className="status-label">{node.status === 'nested' ? 'modified' : node.status}</span>
        {!node.children && node.status === 'changed' && (
          <span className="value-change"><del>{valueLabel(node.before)}</del><span>→</span><ins>{valueLabel(node.after)}</ins></span>
        )}
        {!node.children && node.status === 'added' && <ins className="single-value">{valueLabel(node.after)}</ins>}
        {!node.children && node.status === 'removed' && <del className="single-value">{valueLabel(node.before)}</del>}
        {!node.children && node.status === 'unchanged' && <span className="single-value muted">{valueLabel(node.after)}</span>}
      </div>
      {visibleChildren?.map((child) => <TreeNode key={child.path} node={child} level={level + 1} query={query} changesOnly={changesOnly} />)}
    </div>
  );
}

function App() {
  const [before, setBefore] = useState(sampleBefore);
  const [after, setAfter] = useState(sampleAfter);
  const [format, setFormat] = useState<Format>('auto');
  const [view, setView] = useState<ViewMode>('tree');
  const [query, setQuery] = useState('');
  const [changesOnly, setChangesOnly] = useState(false);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState<{ before: DataValue; after: DataValue } | null>(() => ({
    before: JSON.parse(sampleBefore), after: JSON.parse(sampleAfter),
  }));
  const beforeInput = useRef<HTMLInputElement>(null);
  const afterInput = useRef<HTMLInputElement>(null);

  const nodes = useMemo(() => documents ? buildDiff(documents.before, documents.after) : [], [documents]);
  const summary = useMemo(() => getSummary(nodes), [nodes]);

  const compare = () => {
    try {
      setDocuments({ before: parseDocument(before, format), after: parseDocument(after, format) });
      setError('');
    } catch (problem) {
      setDocuments(null);
      setError(problem instanceof Error ? problem.message : 'Unable to parse the documents.');
    }
  };

  const loadFile = (file: File | undefined, setter: (value: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result));
    reader.readAsText(file);
  };

  const download = () => {
    const report = JSON.stringify({ generatedAt: new Date().toISOString(), summary, changes: nodes }, null, 2);
    const url = URL.createObjectURL(new Blob([report], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'difference-report.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="Difference Finder home"><span>Δ</span> Difference Finder</a>
        <div className="privacy"><Icon name="shield" /> Runs locally in your browser</div>
        <a className="github-link" href="https://github.com/F1nsky/difference-finder-web">View source ↗</a>
      </nav>

      <header id="top" className="hero shell">
        <div className="eyebrow"><Icon name="spark" /> A clearer way to compare structured data</div>
        <h1>See the change.<br /><span>Understand the impact.</span></h1>
        <p>Compare JSON or YAML instantly. Explore every addition, removal, and update without sending your data anywhere.</p>
        <div className="hero-stats"><span><strong>100%</strong> client-side</span><span><strong>2</strong> formats</span><span><strong>0</strong> uploads to a server</span></div>
      </header>

      <section className="workspace shell" aria-label="Difference comparison workspace">
        <div className="workspace-topbar">
          <div className="format-picker" aria-label="Input format">
            {(['auto', 'json', 'yaml'] as Format[]).map((item) => (
              <button className={format === item ? 'active' : ''} onClick={() => setFormat(item)} key={item}>{item.toUpperCase()}</button>
            ))}
          </div>
          <button className="ghost-button" onClick={() => { setBefore(after); setAfter(before); }}><Icon name="swap" /> Swap documents</button>
        </div>

        <div className="editors">
          {([
            { label: 'Original', value: before, setValue: setBefore, input: beforeInput },
            { label: 'Updated', value: after, setValue: setAfter, input: afterInput },
          ] as const).map((editor, index) => (
            <div className="editor" key={editor.label}>
              <div className="editor-head">
                <div><span className={`file-index index-${index}`}>{String(index + 1).padStart(2, '0')}</span><strong>{editor.label}</strong></div>
                <button onClick={() => editor.input.current?.click()}><Icon name="upload" /> Open file</button>
                <input ref={editor.input} type="file" accept=".json,.yaml,.yml,.txt" onChange={(event) => loadFile(event.target.files?.[0], editor.setValue)} />
              </div>
              <textarea spellCheck="false" value={editor.value} onChange={(event) => editor.setValue(event.target.value)} aria-label={`${editor.label} document`} />
              <div className="editor-foot"><span>{editor.value.split('\n').length} lines</span><span>{editor.value.length} characters</span></div>
            </div>
          ))}
        </div>

        {error && <div className="error" role="alert"><strong>Check the syntax</strong><span>{error}</span></div>}
        <button className="compare-button" onClick={compare}><span>Compare documents</span><span className="button-arrow">↗</span></button>
      </section>

      {documents && (
        <section className="results shell" aria-live="polite">
          <div className="results-heading">
            <div><span className="section-number">02 / RESULT</span><h2>What changed</h2></div>
            <button className="ghost-button" onClick={download}><Icon name="download" /> Export report</button>
          </div>

          <div className="summary-grid">
            <article className="summary total"><span>Fields scanned</span><strong>{summary.total}</strong><small>Complete comparison</small></article>
            <article className="summary added"><span>Added</span><strong>+{summary.added}</strong><small>New values</small></article>
            <article className="summary changed"><span>Changed</span><strong>~{summary.changed}</strong><small>Updated values</small></article>
            <article className="summary removed"><span>Removed</span><strong>−{summary.removed}</strong><small>Missing values</small></article>
          </div>

          <div className="result-panel">
            <div className="result-toolbar">
              <div className="view-toggle">
                <button className={view === 'tree' ? 'active' : ''} onClick={() => setView('tree')}>Smart tree</button>
                <button className={view === 'split' ? 'active' : ''} onClick={() => setView('split')}>Side by side</button>
              </div>
              <label className="search"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search paths…" /></label>
              <label className="check"><input type="checkbox" checked={changesOnly} onChange={(event) => setChangesOnly(event.target.checked)} /> Changes only</label>
            </div>
            {view === 'tree' ? (
              <div className="tree" role="tree">{nodes.map((node) => <TreeNode key={node.path} node={node} level={0} query={query} changesOnly={changesOnly} />)}</div>
            ) : (
              <div className="split-view"><pre>{formatDocument(documents.before)}</pre><pre>{formatDocument(documents.after)}</pre></div>
            )}
          </div>
        </section>
      )}

      <footer className="shell"><span>Difference Finder</span><p>Designed and built by Vasiliy Winter · QA × Frontend</p><a href="#top">Back to top ↑</a></footer>
    </main>
  );
}

export default App;
