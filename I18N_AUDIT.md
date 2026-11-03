# i18n Audit: UI text not using translations

Date: 2026-11-03 · Scope: `pages/`, `components/`, `lib/` (tests and stories excluded) · Locales: `en-US`, `de-DE` (`public/locales/*/common.json`)

## Summary

| # | Problem | Count | Effect for German users |
|---|---|---|---|
| A | Keys used in code with an inline default but **missing from both locale files** | 172 keys in 22 files | English shown |
| B | Keys present in `en-US` but **missing from `de-DE`** | 10 | English shown |
| C | **Hardcoded strings** rendered without `t()` / `dt()` | ~45 strings in ~20 files | English shown, can't be translated |

Most of the UI is well covered. The biggest gap is **A**. Those calls are written correctly (`t("key", "Default")`), but `npm run extract` was never re-run after the following features were added: the Reports list/view pages, API keys, webhooks, IP lookup, the tasks table, bulk activity delete, edit server and the hour-format setting. Running the extractor fills `en-US` from the inline defaults; `de-DE` then needs real translations.

---

## A. Keys missing from both locale files

Fix: run `npm run extract`, then translate the new `de-DE` entries.

- `pages/reports/designer.tsx` (1): `reports.admin_only`
- `pages/reports/index.tsx` (17): `reports.error_load`, `nav.reports`, `reports.subtitle`, `reports.import`, `reports.from_template`, `reports.new`, `reports.empty`, `reports.empty_hint`, `reports.updated`, `reports.schedules`, `reports.edit`, `reports.more`, `reports.schedule`, `reports.duplicate`, `reports.export`, `reports.delete_title`, `reports.delete_confirm`
- `pages/reports/view.tsx` (4): `nav.reports`, `reports.back`, `reports.schedule`, `reports.edit`
- `pages/settings/index.tsx` (11): `settings.tab_servers_users`, `settings.hour_format`, `settings.hour_format_desc`, `settings.hour_format_12`, `settings.hour_format_24`, `settings.hour_format_auto`, `settings.version_title`, `settings.api_update_available`, `settings.latest`, `settings.ui_tag`, `settings.update_available`
- `pages/users/index.tsx` (3): `users.tracking_enabled`, `users.tracking_disabled`, `users.tracking_failed`
- `components/ActivityTable/ActivityTable.tsx` (8): `activity.deleted`, `activity.delete_failed`, `activity.select_row`, `activity.delete_selected`, `activity.confirm_delete_title`, `activity.confirm_delete_desc`, `activity.clear_selection`, `activity.select_page`
- `components/ActivityTable/IpLookUpModal.tsx` (16): `ip_lookup.city`, `ip_lookup.region`, `ip_lookup.country`, `ip_lookup.postcode`, `ip_lookup.isp`, `ip_lookup.accuracy`, `ip_lookup.within_km`, `ip_lookup.lookup`, `ip_lookup.title`, `ip_lookup.not_configured`, `ip_lookup.failed`, `ip_lookup.not_configured_desc`, `common.retry`, `ip_lookup.no_details`, `ip_lookup.map`, `ip_lookup.open_map`
- `components/ActivityTable/LibraryFilter.tsx` (4): `activity.all_libraries`, `activity.one_library`, `activity.n_libraries`, `activity.show_all_libraries`
- `components/ItemPage/ItemOptionsTab.tsx` (2): `item.not_archived`, `library.delete_archived_failed`
- `components/LibraryPage/LibraryOptionsTab.tsx` (2): `library.not_archived`, `library.delete_archived_failed`
- `components/Settings/ApiKeys/ApiKeysPage.tsx` (14): `settings.error_load_api_keys`, `settings.error_delete_api_key`, `settings.api_keys_title`, `settings.api_keys_subtitle`, `settings.api_keys`, `settings.add_api_key`, `settings.no_api_keys`, `settings.api_key_admin`, `settings.api_key_read_only`, `settings.api_key_created_at`, `settings.api_key_last_used`, `settings.api_key_never_used`, `settings.delete_api_key`, `settings.confirm_delete_api_key`
- `components/Settings/ApiKeys/CreateApiKey.tsx` (23): `settings.error_api_key_name_required`, `settings.error_api_key_server_required`, `settings.error_create_api_key`, `settings.error_copy_api_key`, `settings.api_key_created`, `settings.api_key_copy_warning`, `common.copied`, `common.copy`, `settings.api_key_usage`, `common.done`, `settings.api_key_read_only`, `settings.api_key_read_only_desc`, `settings.api_key_admin`, `settings.api_key_admin_desc`, `settings.add_api_key`, `settings.add_api_key_desc`, `settings.api_key_name`, `settings.placeholder_api_key_name`, `settings.api_key_access`, `settings.api_key_server`, `settings.api_key_admin_warning`, `settings.creating_api_key`, `settings.create_api_key`
- `components/Settings/Backups/BackupsPage.tsx` (5): `settings.backup_deleted`, `settings.backup_delete_failed`, `settings.backup_download_failed`, `settings.backups_confirm_restore_title`, `settings.backups_confirm_restore_desc`
- `components/Settings/Servers/EditServer.tsx` (11): `settings.toast_server_updated`, `settings.error_update_server`, `settings.edit_server`, `settings.edit_server_desc`, `settings.label_server_name`, `settings.server_name_note`, `settings.placeholder_external_url`, `settings.placeholder_api_key_keep`, `settings.edit_server_verify_note`, `settings.saving_server`, `common.save`
- `components/Settings/Servers/ServerSettings.tsx` (5): `settings.toast_remote_auth_on`, `settings.toast_remote_auth_off`, `settings.remote_auth_on_hint`, `settings.remote_auth_off_hint`, `settings.remote_auth_short`
- `components/Settings/Tasks/TaskActions.tsx` (8): `tasks.enabled`, `tasks.disabled`, `tasks.interval_updated`, `tasks.col_task`, `tasks.col_interval`, `tasks.col_enabled`, `tasks.col_status`, `tasks.col_actions`
- `components/Settings/Tasks/TaskLogs.tsx` (5): `tasks.col_task`, `tasks.col_date`, `tasks.col_duration`, `tasks.col_status`, `tasks.total_logs`
- `components/Settings/Users/UpdateUser.tsx` (5): `settings.error_update_user`, `settings.default_server`, `settings.default_server_desc`, `settings.no_default_server`, `settings.placeholder_new_password`
- `components/Settings/Users/UsersSettings.tsx` (1): `settings.error_delete_user`
- `components/Settings/Webhooks/WebhookEditor.tsx` (20): `settings.webhook_type_discord`, `settings.webhook_type_generic`, `settings.webhook_all_servers`, `settings.webhook_saved`, `settings.error_save_webhook`, `settings.edit_webhook`, `settings.add_webhook`, `settings.webhook_name`, `settings.webhook_type`, `settings.webhook_url`, `settings.webhook_events`, `settings.webhook_server`, `settings.webhook_secret_saved`, `settings.webhook_secret`, `settings.webhook_headers`, `settings.webhook_add_header`, `settings.webhook_custom_payload`, `settings.webhook_template_help`, `settings.webhook_enabled`, `settings.save_webhook`
- `components/Settings/Webhooks/WebhooksPage.tsx` (19): `settings.error_load_webhooks`, `settings.webhook_test_sent`, `settings.webhook_test_failed`, `settings.error_save_webhook`, `settings.error_delete_webhook`, `settings.webhook_all_servers`, `settings.webhooks_title`, `settings.webhooks_subtitle`, `settings.webhooks`, `settings.add_webhook`, `settings.no_webhooks`, `settings.webhook_on`, `settings.webhook_off`, `settings.webhook_last_sent`, `settings.webhook_never_sent`, `settings.webhook_test_hint`, `settings.webhook_test`, `settings.delete_webhook`, `settings.confirm_delete_webhook`
- `components/SideNav/SideNav.tsx` (1): `nav.reports`

## B. Keys in en-US missing from de-DE

`activity.view_stream_info`, `common.confirm_password`, `common.error_confirm_password_required`, `common.error_password_mismatch`, `settings.update_user`, `settings.update_user_desc`, `settings.updating_user`, `settings.toast_user_updated`, `user.deleteUser`, `user.confirmDeleteUser`

(Used by `ActivityTable.tsx`, `Settings/Users/UpdateUser.tsx` and `Settings/Users/UsersSettings.tsx`.)

The ~60 de-DE values that match en-US exactly were reviewed. They are valid German or technical terms (Filter, Server, Episode, Name, Status, URL, HDR, Backups…), so no action is needed.

---

## C. Hardcoded strings

> **Status (2026-11-03): fixed**, except the items below that were left on purpose. Every string in C1 and C2 now goes through `t()` / `dt()` with its English text as the inline default, so `npm run extract` will pick it up. Existing keys are reused where the text matches exactly (`common.unknown`, `common.transcode`, `common.clear`, `statistics.play_count`, and `reports.designer.{custom,text,image,other,count,…}`, including the operator labels). The locale JSON files were not touched.
>
> Left on purpose:
> - `"Yes"` / `"No"` in `lib/reports/format.ts:171`. It mirrors the server's `ReportFormatting.cs`, so translating only the client would make the viewer disagree with server exports. Change both together.
> - The report content defaults: the starter template, "Activity summary", "Imported report", and the `"Untitled report"` saved name in `ReportDesigner.tsx:149`.
>
> Also fixed: in `Inspector.tsx:98` the "Custom" page-size option had `value` and `label` swapped, so in German its value became the translated word and never matched `"Custom"`.
>
> Wording to settle during the dedupe: the filter operators show "in" / "not in", but the parameter hint in `DataPanel.tsx:90` calls them "is one of".

### C1. Main app

| Location | Text | Notes |
|---|---|---|
| [MediaGrid.tsx:161](components/MediaGrid/MediaGrid.tsx:161) | `aria-label="Toggle Sort Direction"` | screen-reader label |
| [StatsCard.tsx:152](components/StatsCard/StatsCard.tsx:152) | `aria-label="Toggle Stats Settings"` | screen-reader label |
| [GenreStatCard.tsx:49](components/GenreStatCards/GenreStatCard.tsx:49) | `name="Play Count"` | Radar series name, shows in the tooltip; a `play_count` key already exists |
| [SessionCard.tsx:44](components/Sessions/SessionCard.tsx:44), [:97](components/Sessions/SessionCard.tsx:97), [:102](components/Sessions/SessionCard.tsx:102) | `"Transcode"` / `"Direct Play"` | shown in the session's audio/video lines; a `transcode` key exists |
| [users/index.tsx:125](pages/users/index.tsx:125) | `"Unknown"` | fallback item name for last activity |
| [Field.tsx:41](components/ui/primitives/Field.tsx:41) | `(required)` | sr-only text on every required field |
| [Select.tsx:34](components/ui/inputs/Select.tsx:34), [:37](components/ui/inputs/Select.tsx:37) | `'Select'`, `'No options available'` | UI-kit defaults, shown when a caller passes no prop |
| [Popover.tsx:31](components/ui/overlay/Popover.tsx:31) | `clearLabel = 'Clear'` | UI-kit default |
| [setup/index.tsx:194](pages/setup/index.tsx:194) | `"Login succeeded but failed to persist token"` | thrown, then shown as the setup error |
| [_app.tsx:85](pages/_app.tsx:85), [setup/index.tsx:56](pages/setup/index.tsx:56) | `"Unknown error"` | error fallback |
| [reports/index.tsx:122](pages/reports/index.tsx:122), [reports/designer.tsx:56](pages/reports/designer.tsx:56) | `"Failed to load the report"` | toast/error fallback |

### C2. Report designer and renderer (missed by the designer i18n pass)

| Location | Text | Notes |
|---|---|---|
| [FilterBuilder.tsx:7-30](components/Reports/designer/FilterBuilder.tsx:7) | `OPERATOR_LABELS`: 22 labels ("equals", "does not equal", "in the last N days", "is this month"…) | operator dropdown, used at :251 |
| [conditions.ts:6-17](lib/reports/conditions.ts:6) | `CONDITION_OPERATORS` labels (10) | conditional-formatting dropdown in `FlowSettings.tsx:103` |
| [TransformsEditor.tsx:31](components/Reports/designer/TransformsEditor.tsx:31), [:37](components/Reports/designer/TransformsEditor.tsx:37) | `"equals"`, `"contains"` | the only two entries in `FILTER_OPERATORS` not wrapped in `dt()` |
| [TransformsEditor.tsx:165](components/Reports/designer/TransformsEditor.tsx:165), [:303](components/Reports/designer/TransformsEditor.tsx:303) | `optional="Whole result"` | |
| [TransformsEditor.tsx:50](components/Reports/designer/TransformsEditor.tsx:50) | `otherLabel: "Other"` | default value for the Top-N "other" bucket (ends up in report data) |
| [FlowSettings.tsx:173](components/Reports/designer/FlowSettings.tsx:173) | `ROW_TOKEN_HELP` sentence | help text under the card template |
| [format.ts:192-199](lib/reports/format.ts:192) | `TOKEN_HELP` descriptions ("Report name", "Number of rows", "Page numbers"…) | rendered in `Inspector.tsx:69` |
| [format.ts:170](lib/reports/format.ts:170) | `"Yes"` / `"No"` | boolean cell formatting in rendered reports |
| [columns.ts:123](lib/reports/columns.ts:123) | `"Count"`, `` `${fn} of ${field}` `` | auto-generated aggregate column labels |
| [ReportElementView.tsx](components/Reports/render/ReportElementView.tsx:141) :141, :206, :248, :252, :254, :269, :277, :385 | "No data source", "No rows", "Choose a category and at least one series", "No data", "Image" | canvas placeholders |
| [MediaImage.tsx:92](components/Reports/render/MediaImage.tsx:92) | "No image id", "Image not available" | |
| [ReportDesigner.tsx:509](components/Reports/designer/ReportDesigner.tsx:509) | `unsaved` | toolbar badge |
| [ReportDesigner.tsx:149](components/Reports/designer/ReportDesigner.tsx:149) | `"Untitled report"` | default saved name |
| [LayersPanel.tsx:36](components/Reports/designer/LayersPanel.tsx:36) | `"Text"` plus the capitalised element type ("Rect", "Chart"…) | layer list names |
| [Inspector.tsx:98](components/Reports/designer/Inspector.tsx:98) | `label: "Custom"` | page-size option (the value `"Custom"` can stay) |
| [clientExport.ts:46](lib/reports/clientExport.ts:46), [:56](lib/reports/clientExport.ts:56), [:67](lib/reports/clientExport.ts:67) | export error messages | shown in the export-failed toast |

**Content defaults (lower priority, product decision):** the starter template in [defaults.ts:325-551](lib/reports/defaults.ts:325) ("Overview", "Top users", "Daily plays", "Watch time", the column headers When/User/Title/Client/Watched…), `"Activity summary"` in [designer.tsx:41](pages/reports/designer.tsx:41) and `"Imported report"` in [transfer.ts:29](lib/reports/transfer.ts:29). These become saved report content, so translating them means creating the template in the user's language at creation time.

### Not flagged (intentional)

Brand and product names (Jellystat, Jellyfin, Emby, Discord), language names in `LanguageSwitcher`, key names (`Escape`, `Enter`, `Ctrl+D`), placeholder examples (`https://...`, `{{row.Name}}`, `Authorization`, `Bearer ...`), the format tokens in `HelpDialog`, API field and enum values (`"Video"`, `"Primary"`, `"Backdrop"`, `"Backup"`), and developer-only errors (`useDesigner must be used inside DesignerProvider`).

---

## Method

1. Flattened both locale JSON files and diffed their key sets (B).
2. Extracted every `t("…")` / `dt("…")` / `i18nKey` key in the source and checked whether it exists in each locale (A). The only dynamic keys are `` reports.designer.help.${key} `` in `HelpDialog.tsx`, and they resolve.
3. Scanned every `.tsx`/`.ts` file for JSX text nodes, literal UI props (`title`, `label`, `placeholder`, `aria-label`, `text`, `alt`…), toast and error strings, and English string literals. Then checked each hit by hand, discarding multi-line `t(key,\n default)` calls and non-UI values (C).

Limits: this was a static scan, not a run through the app in German. Text built at runtime from server data, and messages returned by the API, aren't covered.


---

## D. Key consolidation (2026-11-03)

`public/locales/en-US/common.json` was regenerated from the code with `npm run extract` (en-US only; `de-DE` was not touched). It went from 1,109 keys to 1,224. That count includes 26 `_one`/`_other` plural forms and the 172 keys that were previously missing. The code now uses **1,210 distinct keys, down from 1,291**, and no two keys in the same namespace group share a text.

**Rules used**
- The report designer (`reports.designer.*`, including `help.*`) is deduplicated only within itself. Every other shared text moved to `common.*`.
- Texts count as the same when they differ only in case, whitespace or a trailing `.`/`…`. A few same-meaning texts were merged by hand (placeholders, confirm-password validation, the "signing secret saved" hint).
- The current JSON text is kept wherever the code's default had drifted from it, so what users see doesn't change. Call-site defaults were updated to match the JSON.
- These stay separate on purpose: `settings.backups_restore_phrase` (the word typed to confirm a restore), `tasks.enabled`/`tasks.disabled` and `settings.api_key_never_used` (lowercase, inside sentences), and `common.no_items_message`.

**Visible text changes (intended)**
- **Shown uppercased by CSS:** all-caps labels such as "VIDEO" and "CODEC" are now stored in normal case. They look the same on screen.
- **Bug fixes:**
  - The archived library/items confirm texts were swapped, and the dialog repeated its own title.
  - The backups table's "File" column showed "Title".
  - The Update User modal title showed "Update".
  - The archived-item section text now describes the action instead of repeating the dialog's question.
- **Wording unified:**
  - "No users found", "No activity found", "All libraries", "Not linked"
  - "On" / "Off" badges
  - "Enter server API key"
  - "Choose a username" / "Create a secure password" on the add-user form
  - "Confirm password is required"
  - one signing-secret hint
  - "No items in your library" as the empty-state message

**Extractor fixes** (`i18next-parser.config.js`)
- `defaultValue` used the old signature, so every new key got its own key name as its value.
- `dt()` and `rich()` weren't scanned. Running `npm run extract` would have deleted about 550 designer keys.
- Tests are now excluded.

Code changes that make keys visible to the parser:
- `HelpDialog` now passes full literal keys.
- `StatsCard`'s periods use literal `t()` calls.
- `TaskActions` no longer nests `t()` inside another call's options. The parser skips nested calls.

The fully commented-out `components/WatchStatCard/WatchStatCard.tsx` was deleted; it fed an unused `stat_card.most_viewed` key to the extractor. Every key in en-US is now referenced in code, and every key the code uses exists in en-US.

**Before regenerating de-DE:** the merged and renamed keys below have no German text yet, so they fall back to English. Running `npm run extract` as-is also rewrites `de-DE`. It keeps translations for keys that still exist, fills new keys with English and drops the rest.

### Merged keys

| Key now | Text | Replaces |
|---|---|---|
| `common.actions` | Actions | `tasks.col_actions` |
| `common.activity_delete_failed` | Failed to delete activity: {{error}} | `activity.delete_failed`, `settings.migration_delete_failed` |
| `common.activity_delete_title` | Delete selected activity? | `activity.confirm_delete_title`, `settings.migration_confirm_delete_title` |
| `common.activity_deleted` | Deleted {{count}} activity records | `activity.deleted`, `settings.migration_deleted` |
| `common.activity_migration` | Activity Migration | `settings.tab_migrations`, `settings.migration_title` |
| `common.add_server` | Add Server | `settings.add_server`, `setup.btn_add_server` |
| `common.all` | All | `settings.migration_filter_all` |
| `common.all_libraries` | All libraries | `activity.all_libraries`, `settings.migration_all_libraries` |
| `common.archived` | Archived | `media_grid.filter_archived` |
| `common.back_to_reports` | Back to reports | `reports.back_to_reports`, `reports.back` |
| `common.background_tasks` | Background Tasks | `settings.tab_tasks`, `tasks.background_tasks_title` |
| `common.backups` | Backups | `settings.tab_backups`, `settings.backups_title` |
| `common.client` | Client | `session.client` |
| `common.confirm_password` | Confirm Password | `setup.label_confirm_password` |
| `common.create` | Create | `settings.create_api_key`, `settings.create_user` |
| `common.creating` | Creating | `settings.creating_api_key`, `settings.creating_user` |
| `common.date` | Date | `tasks.col_date` |
| `common.device` | Device | `activity.device`, `session.device` |
| `common.duration` | Duration | `tasks.col_duration`, `stats_card.duration` |
| `common.edit` | Edit | `reports.edit` |
| `common.enabled` | Enabled | `reports.schedule_enabled`, `tasks.col_enabled`, `settings.webhook_enabled` |
| `common.episode` | Episode | `item.episode`, `settings.migration_col_episode` |
| `common.episode_count` | {{episodeCount}} Episodes | `timeline.episodes`, `item.episodes` |
| `common.error_confirm_password_required` | Confirm password is required | `setup.error_confirm_password` |
| `common.error_load_libraries` | Failed to load libraries | `libraries.failed_load`, `settings.error_load_libraries` |
| `common.error_password_mismatch` | Passwords do not match | `setup.error_passwords_mismatch` |
| `common.failed` | Failed | `settings.migration_status_failed`, `tasks.failed` |
| `common.failed_to_load` | Failed to load | `error_cards.failed_to_load` |
| `common.file` | File | `common.title` |
| `common.ip_address` | IP Address | `activity.ip`, `session.ip_address` |
| `common.language` | Language | `settings.language`, `stream.language` |
| `common.last_watched` | Last Watched | `users.last_watched`, `last_watched.title` |
| `common.libraries` | Libraries | `nav.libraries`, `library.overview_title` |
| `common.library` | Library | `item.library`, `settings.tab_library`, `settings.migration_col_library` |
| `common.media` | Media | `stream.media` |
| `common.name` | Name | `reports.schedule_name`, `settings.migration_col_name`, `settings.api_key_name`, `settings.label_server_name`, `settings.webhook_name` |
| `common.no_activity_title` | No activity found | `activity.no_activity` |
| `common.no_data` | No Data | `error_cards.no_data_title` |
| `common.no_users` | No users found | `users.no_users`, `settings.no_users` |
| `common.not_linked` | Not linked | `settings.migration_status_not_linked`, `settings.migration_filter_not_linked` |
| `common.off` | Off | `reports.schedule_off`, `settings.webhook_off` |
| `common.on` | On | `reports.schedule_on`, `settings.webhook_on` |
| `common.password` | Password | `login.password_placeholder` |
| `common.placeholder_api_key` | Enter server API key | `settings.placeholder_api_key`, `setup.placeholder_api_key` |
| `common.placeholder_create_password` | Create a secure password | `settings.placeholder_password`, `setup.placeholder_password` |
| `common.placeholder_username` | Choose a username | `settings.placeholder_username`, `setup.placeholder_username` |
| `common.ready` | Ready | `settings.migration_status_ready`, `settings.migration_filter_ready` |
| `common.select_page` | Select all on this page | `activity.select_page`, `settings.migration_select_page` |
| `common.series` | Series | `settings.migration_type_series`, `settings.migration_col_series` |
| `common.server` | Server | `login.server`, `settings.api_key_server`, `settings.webhook_server` |
| `common.signing_secret` | Signing secret (optional) | `reports.schedule_secret_optional`, `settings.webhook_secret` |
| `common.signing_secret_saved` | Signing secret (saved; type to replace, clear the box and save to remove) | `reports.schedule_secret_saved`, `settings.webhook_secret_saved` |
| `common.size` | Size | `media_grid.sort_size` |
| `common.status` | Status | `settings.migration_col_status`, `tasks.col_status` |
| `common.title` | Title | `activity.title_col` |
| `common.type` | Type | `filter.number_type`, `settings.migration_col_type`, `settings.webhook_type` |
| `common.unit.users` | Users | `nav.users` |
| `common.unknown_error` | Unknown error | `settings.migration_unknown_error` |
| `common.update` | Update | `settings.update_user` |
| `common.url` | URL | `settings.webhook_url` |
| `common.username` | Username | `login.username_placeholder` |
| `common.webhooks` | Webhooks | `settings.webhooks_title`, `settings.webhooks` |
| `item.deleteArchivedItemDescription` | Delete this archived item and its contents. This action cannot be rolled back. | `item.confirmDeleteArchivedItemDescription` |
| `reports.designer.after_the_query` | After the query | `reports.designer.help.data_after` |
| `reports.designer.calculated_fields` | Calculated fields | `reports.designer.help.data_calculated` |
| `reports.designer.combine_data_sources` | Combine data sources | `reports.designer.help.data_combine` |
| `reports.designer.conditional_formatting` | Conditional formatting | `reports.designer.help.conditions_title` |
| `reports.designer.data_sources` | Data sources | `reports.designer.help.data_title` |
| `reports.designer.duplicate` | Duplicate | `reports.designer.help.keys_duplicate` |
| `reports.designer.ellipse` | Ellipse | `reports.designer.tool_ellipse` |
| `reports.designer.export` | Export | `reports.designer.help.export_col_export` |
| `reports.designer.format` | Format | `reports.designer.help.formats_col_format` |
| `reports.designer.image` | Image | `reports.designer.tool_image` |
| `reports.designer.line` | Line | `reports.designer.tool_line` |
| `reports.designer.metric` | Metric | `reports.designer.tool_metric` |
| `reports.designer.parameters` | Parameters | `reports.designer.help.params_title` |
| `reports.designer.query_a_dataset` | Query a dataset | `reports.designer.help.data_query` |
| `reports.designer.rectangle` | Rectangle | `reports.designer.tool_rectangle` |
| `reports.designer.save` | Save | `reports.designer.help.keys_save` |
| `reports.designer.table` | Table | `reports.designer.tool_table` |
| `reports.designer.text` | Text | `reports.designer.tool_text` |

### Follow-up: plurals and message namespaces

- **Plural pairs:** no `_one` / `_other` pair repeats its text any more. Nine messages now pass a real English singular through `defaultValue_one` (e.g. "Deleted {{count}} activity record"). Four that read the same either way ("Clear filters ({{n}})", "Delete ({{n}})", "{{n}} selected", "{{n}} unlinked") use `n` instead of `count`, so i18next doesn't pluralise them. `activity.one_library` was replaced by the singular form of `activity.n_libraries`.
- **New namespaces:** error messages (load, save and delete failures, validation, not found, connection) moved to `errors.*` (83 keys). Empty and no-data states moved to `empty.*` (36). The report designer's own messages moved to `reports.designer.errors.*` (9) and `reports.designer.empty.*` (6). Keys are named from their text, cut at a word boundary within 40 characters. Confirm-dialog descriptions, status badges and option labels like "No default server" were left where they were.
- **Remaining duplicate texts:** 30 report-designer keys repeat a word found elsewhere ("Save", "Cancel", …). They're kept so the designer stays separate.

### Follow-up: designer duplicates

- **Merged:** the 28 report-designer texts that also existed elsewhere ("Save", "Cancel", "Back to reports", "Export", …) now use one `common.*` key. Non-designer keys like `reports.export`, `reports.duplicate`, `reports.schedules_title`, `filter.number_range` and `watch_stat_cards.days` moved to `common.*` too. "Loading" / "Loading...", "No Data" / "No data", "Choose" / "Choose..." and "Custom" / "Custom..." were merged the same way.
- **Five texts still appear twice, on purpose:**
  - "Series": a TV series vs a chart data series.
  - "Keys": API keys vs keyboard keys.
  - "Enabled" / "enabled", "Never" / "never": the lowercase ones sit inside a sentence.
  - "Restore" / "restore": the lowercase one is the word you type to confirm.

  Each pair needs a different German translation.
