$path = 'app\orders\[orderId]\page.tsx'
$lines = Get-Content -LiteralPath $path
$start = $lines.IndexOf('        {updatesVisible && (')
if ($start -lt 0) { Write-Error 'start not found'; exit 1 }
$end = $lines.IndexOf('        <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr] items-start">')
if ($end -lt 0) { Write-Error 'end not found'; exit 1 }
$new = @(
'        {updatesVisible && (',
'          <div className="fixed inset-0 z-50 sm:hidden">',
'            <button',
'              type="button"',
'              className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${',
'                updatesOpen ? "opacity-100" : "opacity-0"',
'              }`}',
'              onClick={closeUpdates}',
'              aria-label="Close updates"',
'            />',
'            <aside',
'              className={`absolute right-0 top-0 h-full w-[82%] max-w-xs bg-white border-l border-black/15 p-5 grid gap-4 transition-transform duration-200 ease-out ${',
'                updatesOpen ? "translate-x-0" : "translate-x-full"',
'              }`}',
'            >',
'              <div className="flex items-center justify-between">',
'                <div className="text-sm font-semibold">Order updates</div>',
'                <button type="button" className="btn btn-ghost px-3 py-1" onClick={closeUpdates}>',
'                  Close',
'                </button>',
'              </div>',
'              <div className="relative pl-5">',
'                <div className="absolute left-[6px] top-2 bottom-2 w-px bg-black/20" />',
'                <div className="grid gap-4">',
'                  {steps.map((step, idx) => {',
'                    const active = idx <= currentStep;',
'                    return (',
'                      <div key={step} className="relative flex items-start gap-3">',
'                        <span',
'                          className={`mt-1 w-3 h-3 rounded-full border ${',
'                            active ? "bg-black border-black" : "bg-white border-black/30"',
'                          }`}',
'                        />',
'                        <div className="text-sm">',
'                          <div className={active ? "font-semibold" : "text-[var(--muted)]"}>',
'                            {step}',
'                          </div>',
'                          <div className="text-xs text-[var(--muted)]">',
'                            {active ? "Completed" : "Pending"}',
'                          </div>',
'                        </div>',
'                      </div>',
'                    );',
'                  })}',
'                </div>',
'              </div>',
'            </aside>',
'          </div>',
'        )}',
''
)
$updated = @()
$updated += $lines[0..($start-1)]
$updated += $new
$updated += $lines[$end..($lines.Length-1)]
Set-Content -LiteralPath $path -Value $updated
