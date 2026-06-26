import { useState, useRef } from 'react';
import { useAuthoring } from '../hooks/useAuthoring';
import { downloadExport, validateImport, parseImportItems, generateContentFilesOutput } from '../engine/exportImport';

export function ExportImportPanel() {
  const { saveItem, refresh } = useAuthoring();
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; warnings: string[]; errors: string[] } | null>(null);
  const [contentFilesOutput, setContentFilesOutput] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadExport();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = validateImport(text);
      setImportResult(result);

      if (result.success) {
        const items = parseImportItems(text);
        for (const item of items) {
          saveItem(item);
        }
        refresh();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopyContentFiles = () => {
    const output = generateContentFilesOutput();
    setContentFilesOutput(output);
    navigator.clipboard.writeText(output).catch(() => {});
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-5)',
      }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 500, marginBottom: 'var(--space-3)' }}>
          Export
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
          Download your authored content as JSON. Private notes are <strong>not included</strong>.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            onClick={handleExport}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Export content.json
          </button>
          <button
            onClick={handleCopyContentFiles}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'transparent',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Copy as content files
          </button>
        </div>
        {contentFilesOutput !== null && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', marginBottom: 'var(--space-1)' }}>
              Copied to clipboard. Paste into src/content/ files.
            </div>
            <pre style={{
              fontSize: 'var(--text-xs)',
              background: 'var(--bg-tertiary)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'auto',
              maxHeight: 200,
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {contentFilesOutput.slice(0, 500)}
              {contentFilesOutput.length > 500 ? '\n...' : ''}
            </pre>
          </div>
        )}
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-5)',
      }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 500, marginBottom: 'var(--space-3)' }}>
          Import
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
          Load a previously exported content.json into your draft.
        </p>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          onClick={handleImportClick}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            background: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Choose file...
        </button>

        {importResult && (
          <div style={{
            marginTop: 'var(--space-3)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            background: importResult.success ? 'var(--success-subtle)' : '#fef2f2',
            border: `1px solid ${importResult.success ? 'var(--success)' : '#ef4444'}`,
            fontSize: 'var(--text-sm)',
          }}>
            {importResult.success ? (
              <div style={{ color: 'var(--success)' }}>
                Imported {importResult.imported} items into draft.
              </div>
            ) : (
              <div style={{ color: '#ef4444' }}>
                {importResult.errors.join('; ')}
              </div>
            )}
            {importResult.warnings.length > 0 && (
              <div style={{ color: 'var(--warning)', marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
                Warnings: {importResult.warnings.join('; ')}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-5)',
      }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>
          How to publish
        </h3>
        <ol style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', paddingLeft: 'var(--space-5)', lineHeight: 1.8 }}>
          <li>Export your content (button above)</li>
          <li>Run: <code style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: 2 }}>
            node scripts/apply-content.mjs content.export.json
          </code></li>
          <li>Commit the generated files and push</li>
          <li>The site redeploys automatically</li>
        </ol>
      </div>
    </div>
  );
}
