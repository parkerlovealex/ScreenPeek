# Shared admin list controls

The shared panel supplies search, main-column filtering/sorting, 50-row pagination and filtered CSV exports. Exports require Owner/Editor and are bounded to 2000 filtered records; CSV strings that could become spreadsheet formulas are escaped. Access module/role checks run on the server. Operational/audit lists remain read-only; editable entities expose the appropriate editor.

Bulk operations accept at most five rows to fit the free-tier query budget. Each batch writes one actor-stamped audit record containing its IDs and before/after state, plus the delivery outbox. A database constraint guard aborts the whole transaction on concurrent changes. Bulk Undo also uses revision guards and current permission checks; permanent purge is not undoable.

Trash keeps rows for 30 days and offers restore. Referenced items show “used in N places” in the selected editor and require confirmation before deletion. Only Owner can purge immediately. Nightly sync expires up to 1000 entries per run within the remaining sync write budget; title purges retain 410 tombstones and add the never-import blocklist. Pending propagation remains visible; a static file updates at the next build. Logs exclude query strings from unknown public URLs.

Homepage sections have order, heading, enabled flag, auto/manual source, manual pins and start/end schedules. Four poster sections stay capped at six each; Top 10 has ten text entries. The list hub shares its manual Top 10 ordering. Collections support name, schedule and title membership. Taxonomy overrides support names, intro, order and hide. Deleting an override removes its customisation; the underlying source taxonomy is separate. Pin schedules are honoured by the homepage query.

Global Trash is linked from Change Log. Private configuration restoration is Owner-only and covered in BACKUPS.md. Full title/person field editors, diagnostics and Tools are completed in their numbered follow-up tasks. Production purge, private storage/access and scheduled execution remain on the deferred deployment list.
