import clsx from "clsx";
import { CircleHelp, X } from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal, ModalPanel, ModalTitle } from "@/components/ui";
import { dt } from "./i18n";

/** Inline code. */
const C = ({ children }: { children: ReactNode }) => (
  <code className="px-1 py-0.5 rounded bg-background text-primary-soft text-xs whitespace-nowrap">{children}</code>
);

/**
 * A translated sentence with **bold** words and {0}, {1}... slots for inline code, so translators
 * see whole sentences. {{tokens}} in the text are shown as written.
 */
function rich(key: string, text: string, slots: ReactNode[] = []): ReactNode {
  return dt(`reports.designer.help.${key}`, text)
    .split(/(\{\d+\}|\*\*[^*]+\*\*)/)
    .map((part, i) => {
      const slot = /^\{(\d+)\}$/.exec(part);
      if (slot) return <Fragment key={i}>{slots[Number(slot[1])]}</Fragment>;
      const bold = /^\*\*(.+)\*\*$/.exec(part);
      if (bold)
        return (
          <b key={i} className="text-gray-300">
            {bold[1]}
          </b>
        );
      return part;
    });
}
const h = (key: string, text: string) => dt(`reports.designer.help.${key}`, text);

const Table = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => (
  <table className="w-full text-[13px] border-collapse my-2">
    <thead>
      <tr>
        {head.map((cell) => (
          <th key={cell} className="text-left font-bold text-gray-300 border-b border-border py-1.5 pr-3">
            {cell}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((r, i) => (
        <tr key={i} className="align-top">
          {r.map((cell, j) => (
            <td key={j} className="border-b border-border/50 py-1.5 pr-3 text-gray-400">
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const H = ({ children }: { children: ReactNode }) => <h3 className="text-sm font-bold text-white mt-5 mb-1.5 first:mt-0">{children}</h3>;
const P = ({ children }: { children: ReactNode }) => <p className="text-[13px] text-gray-400 leading-relaxed mb-2">{children}</p>;
const Ul = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc pl-5 space-y-1 text-[13px] text-gray-400 mb-2">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

// Built on each render so the text follows the current language.
const sections = (): { key: string; title: string; body: ReactNode }[] => [
  {
    key: "start",
    title: h("start_title", "Getting started"),
    body: (
      <>
        <P>
          {rich(
            "start_intro",
            "A report is one or more pages of elements (text, metrics, tables, charts, card grids, images and shapes) bound to data sources.",
          )}
        </P>
        <Ul
          items={[
            rich("start_data", "**Data** tab: add a data source (what to query), then bind elements to it."),
            rich("start_insert", "**Insert** tab: drag an element onto the page, or click it to drop it at the top left."),
            rich("start_select", "Select an element to edit it in the panel on the right; select several to align, distribute or style them together."),
            rich(
              "start_preview",
              "**Preview** (eye icon) shows the finished pages with live data, including the extra pages growing tables add.",
            ),
            rich("start_save", "Save, then use Schedules & webhooks to deliver the report automatically."),
          ]}
        />
      </>
    ),
  },
  {
    key: "data",
    title: h("data_title", "Data sources"),
    body: (
      <>
        <H>{h("data_query", "Query a dataset")}</H>
        <Ul
          items={[
            rich(
              "data_pick",
              "Pick a dataset (playback activity, library items, users...), filter it, and return either rows or a summary (group by + totals).",
            ),
            rich(
              "data_params",
              "Filters can compare against a **parameter** (pick @name as the value), so viewers and schedules can change them.",
            ),
          ]}
        />
        <H>{h("data_calculated", "Calculated fields")}</H>
        <P>
          {rich(
            "data_calculated_body",
            "Row-level expressions computed in the database and usable anywhere a field is: {0}, {1}, {2}, {3}. Write {4} rather than {5} for decimal division.",
            [
              <C key="0">Duration / 3600.0</C>,
              <C key="1">iif(CompletionPercentage &gt;= 90, &quot;Finished&quot;, &quot;Partial&quot;)</C>,
              <C key="2">SeriesName ?? Name</C>,
              <C key="3">DateCreated.Hour</C>,
              <C key="4">3600.0</C>,
              <C key="5">3600</C>,
            ],
          )}
        </P>
        <H>{h("data_after", "After the query")}</H>
        <P>
          {rich(
            "data_after_body",
            'Steps applied to the result in order: filter, calculate a column, top N, pivot, running total, percent of total, rank, change from previous, fill missing dates, sort and limit. These work on totals too, e.g. "users with at least 10 plays".',
          )}
        </P>
        <H>{h("data_combine", "Combine data sources")}</H>
        <Ul
          items={[
            rich(
              "data_join",
              "**Join**: add another source's columns to matching rows (left, inner or full), e.g. this month next to last month per user.",
            ),
            rich("data_union", "**Union**: stack rows from several sources, optionally with a column naming each row's source."),
            rich("data_nested", "Combined sources can build on other combined sources."),
          ]}
        />
      </>
    ),
  },
  {
    key: "tokens",
    title: h("tokens_title", "Placeholders & formats"),
    body: (
      <>
        <P>
          {rich(
            "tokens_intro",
            "Placeholders use double curly braces and work in text, headings, metric labels, card text lines and link URLs. Unknown ones are left as they are, so a typo shows up rather than breaking the report.",
          )}
        </P>
        <Table
          head={[h("tokens_col_placeholder", "Placeholder"), h("tokens_col_gives", "Gives")]}
          rows={[
            [<C key="a">{"{{page.number}}"}</C>, h("tokens_page_number", "Current page number, counting the extra pages growing elements add")],
            [<C key="a">{"{{page.count}}"}</C>, h("tokens_page_count", "Total pages, including extra pages")],
            [<C key="a">{"{{report.name}}"}</C>, h("tokens_report_name", "The report's name")],
            [<C key="a">{"{{now}}"}</C>, h("tokens_now", "When the report was generated, in the report's time zone")],
            [<C key="a">{"{{param.NAME}}"}</C>, h("tokens_param", "A parameter's value")],
            [<C key="a">{"{{ds.SOURCE.FIELD}}"}</C>, h("tokens_ds_field", "A column from the first row of a data source (by name or id)")],
            [<C key="a">{"{{ds.SOURCE.rowCount}}"}</C>, h("tokens_ds_count", "How many rows a data source returned")],
            [<C key="a">{"{{row.FIELD}}"}</C>, h("tokens_row", "Card grid text and link URLs: a column of the card's (or table row's) own row")],
            [<C key="a">{"{{value}}"}</C>, h("tokens_value", "Hyperlink URL templates: the value being linked")],
          ]}
        />
        <P>{rich("tokens_footer_example", "Example footer: {0}", [<C key="0">{"Page {{page.number}} of {{page.count}}"}</C>])}</P>
        <H>{h("formats_title", "Formats")}</H>
        <P>
          {rich(
            "formats_body",
            "Add {0} after a placeholder: {1}, {2}, {3}. The same formats are offered for table columns and metrics.",
            [
              <C key="0">|format</C>,
              <C key="1">{"{{now|datetime}}"}</C>,
              <C key="2">{"{{ds.Totals.watch|duration}}"}</C>,
              <C key="3">{"{{row.Plays|integer}}"}</C>,
            ],
          )}
        </P>
        <Table
          head={[h("formats_col_format", "Format"), h("formats_col_example", "Example")]}
          rows={[
            [<C key="a">text</C>, h("formats_as_is", "As is")],
            [<C key="a">number</C>, "1,234.57"],
            [<C key="a">integer</C>, "1,235"],
            [<C key="a">decimal</C>, h("formats_decimal", "1,234.57 (always 2 decimals)")],
            [<C key="a">percent</C>, "42.5%"],
            [<C key="a">duration</C>, h("formats_duration", "1h 52m (from seconds)")],
            [<C key="a">bytes</C>, "1.4 GB"],
            [<C key="a">date</C>, "2026-10-29"],
            [<C key="a">datetime</C>, "2026-10-29 16:20"],
            [<C key="a">time</C>, "16:20"],
          ]}
        />
        <P>
          {rich(
            "formats_canvas_count",
            "On the design canvas, {0} only counts design pages; Preview, the viewer and exports show the real total.",
            [<C key="0">{"{{page.count}}"}</C>],
          )}
        </P>
      </>
    ),
  },
  {
    key: "flow",
    title: h("flow_title", "Page flow"),
    body: (
      <>
        <P>
          {rich(
            "flow_intro",
            "Turn on **Continue on new pages** (Pages section) for a table or card grid, and rows that don't fit go onto extra pages added after that page, with the table header repeated.",
          )}
        </P>
        <Ul
          items={[
            rich(
              "flow_header",
              "A dashed green **Header** line appears; drag it (or set Header height). On the extra pages the table starts there.",
            ),
            rich(
              "flow_repeat",
              "Everything entirely **above the header line** or **below the table** repeats on every extra page, like page headers and footers: titles, logos, page numbers.",
            ),
            rich("flow_between", "Everything in between (intro text, metrics, charts) appears on the first page only."),
            rich("flow_first_only", "**First page only** keeps a header or footer element off the extra pages."),
          ]}
        />
        <P>{rich("flow_same_breaks", "The viewer, Preview and every export break pages in the same places. A report is capped at 500 pages.")}</P>
      </>
    ),
  },
  {
    key: "conditions",
    title: h("conditions_title", "Conditional formatting"),
    body: (
      <>
        <P>
          {rich(
            "conditions_intro",
            "Tables, metrics and card grids have a Conditional formatting section. Each rule is a column, an operator and a value, plus the styles to apply.",
          )}
        </P>
        <Ul
          items={[
            rich("conditions_tables", "**Tables**: style the whole row or one column, e.g. red text in Watch time when it's under 60."),
            rich("conditions_metrics", "**Metrics**: checked against the first row; styles the value and fill."),
            rich("conditions_cards", "**Card grids**: checked per card; styles the card."),
            rich("conditions_order", "Rules apply in order; when two set the same thing, the later one wins."),
          ]}
        />
      </>
    ),
  },
  {
    key: "cards",
    title: h("cards_title", "Card grids"),
    body: (
      <>
        <P>
          {rich(
            "cards_intro",
            'One card per row: a poster, backdrop or user avatar, plus up to three text lines. Good for "top 10 movies" or "most active users".',
          )}
        </P>
        <Ul
          items={[
            rich("cards_media_id", "**Media id column**: the column holding the item (or user) id, e.g. ItemId."),
            rich(
              "cards_text_lines",
              'Text lines use {0}, e.g. title {1}, subtitle {2}, value {3}. The "+ column" picker inserts one for you.',
              [
                <C key="0">{"{{row.FIELD}}"}</C>,
                <C key="1">{"{{row.Name}}"}</C>,
                <C key="2">{"{{row.UserName}} · {{row.DateCreated|date}}"}</C>,
                <C key="3">{"{{row.Duration|duration}}"}</C>,
              ],
            ),
            rich(
              "cards_layout",
              "Set columns, card height, gap, fill, corner radius and a maximum number of cards. A card grid can continue on new pages like a table.",
            ),
            rich("cards_link", "An optional link per card, e.g. {0}.", [
              <C key="0">{"https://jellyfin.example/web/#/details?id={{row.ItemId}}"}</C>,
            ]),
          ]}
        />
      </>
    ),
  },
  {
    key: "links",
    title: h("links_title", "Hyperlinks"),
    body: (
      <>
        <Ul
          items={[
            rich(
              "links_columns",
              "Table columns and metrics: choose the **Hyperlink** format. Leave the URL empty if the value already is a URL, or write a template with {0} and {1}.",
              [<C key="0">{"{{value}}"}</C>, <C key="1">{"{{row.FIELD}}"}</C>],
            ),
            rich("links_elements", "Text and images: set Link to make the whole element clickable. Placeholders work there too."),
            rich("links_encoded", "Values inserted after the start of a URL are URL-encoded automatically."),
            rich("links_schemes", "Only http, https and mailto links are created; anything else shows as plain text."),
            rich(
              "links_where",
              "Links open in the viewer, HTML/SVG exports and server PDFs. Images (PNG) and in-browser PDFs can't hold links.",
            ),
          ]}
        />
      </>
    ),
  },
  {
    key: "params",
    title: h("params_title", "Parameters"),
    body: (
      <>
        <P>
          {rich(
            "params_intro",
            "Parameters (Data tab) are values the viewer or a schedule can change: text, a number, a date, yes/no, or a lookup.",
          )}
        </P>
        <Ul
          items={[
            rich(
              "params_filter",
              "Use one in a filter by picking @name as the rule's value. An empty parameter switches its rule off, which is how optional filters work.",
            ),
            rich("params_text", "Show one in text with {0}.", [<C key="0">{"{{param.NAME}}"}</C>]),
            rich(
              "params_lookup",
              "A **lookup** is a dropdown of choices from a data source (value column + optional label column), optionally allowing several choices.",
            ),
          ]}
        />
      </>
    ),
  },
  {
    key: "export",
    title: h("export_title", "Exports & delivery"),
    body: (
      <>
        <Table
          head={[h("export_col_export", "Export"), h("export_col_notes", "Notes")]}
          rows={[
            [
              dt("reports.designer.pdf_server_vector", "PDF (server, vector)"),
              h("export_pdf", "Sharp text, fonts embedded, clickable links. Best for sharing and schedules."),
            ],
            [h("export_png_svg_name", "PNG / SVG of this page (server)"), h("export_png_svg", "One page as an image; SVG keeps links.")],
            [dt("reports.designer.html_server", "HTML (server)"), h("export_html", "A standalone page with all pages, fonts and links.")],
            [dt("reports.designer.data_as_json_server", "Data as JSON (server)"), h("export_json", "The data behind the report.")],
            [h("export_browser_name", "PNG / PDF (in browser)"), h("export_browser", "Captures what you see; no clickable links.")],
            [
              dt("reports.designer.report_definition_json", "Report definition (.json)"),
              h(
                "export_definition",
                "The design itself, to back up or import elsewhere. Also on the Reports screen. Imports are checked first, and schedules aren't included.",
              ),
            ],
          ]}
        />
        <P>
          {rich(
            "export_delivery",
            "Saved reports can be delivered on a schedule or by webhook (generic, Discord or JSON) with Schedules & webhooks in the toolbar.",
          )}
        </P>
      </>
    ),
  },
  {
    key: "keys",
    title: h("keys_title", "Keyboard shortcuts"),
    body: (
      <Table
        head={[h("keys_col_keys", "Keys"), h("keys_col_action", "Action")]}
        rows={[
          ["Ctrl+S", h("keys_save", "Save")],
          [h("keys_undo_keys", "Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z)"), h("keys_undo", "Undo / redo")],
          ["Ctrl+C / Ctrl+X / Ctrl+V", h("keys_clipboard", "Copy / cut / paste")],
          ["Ctrl+D", h("keys_duplicate", "Duplicate")],
          ["Ctrl+A", h("keys_select_all", "Select everything on the page")],
          [h("keys_delete_keys", "Delete / Backspace"), h("keys_delete", "Delete the selection")],
          [h("keys_arrows_keys", "Arrow keys (Shift for 10px)"), h("keys_arrows", "Nudge the selection")],
          [h("keys_order_keys", "Ctrl+] / Ctrl+[ (with Shift: to front / back)"), h("keys_order", "Bring forward / send backward")],
          ["Ctrl+= / Ctrl+- / Ctrl+0", h("keys_zoom", "Zoom in / out / fit page")],
          [h("keys_add_keys", "Shift / Ctrl + click"), h("keys_add", "Add to the selection")],
          [h("keys_alt_keys", "Alt while dragging"), h("keys_alt", "Move without snapping")],
          [h("keys_edit_keys", "Double-click text"), h("keys_edit", "Edit in place (Ctrl+Enter to finish)")],
          [h("keys_escape_keys", "Escape"), h("keys_escape", "Clear the selection, leave Preview")],
          ["?", h("keys_help", "Open this help")],
        ]}
      />
    ),
  },
];

/** Reference for the report designer: placeholders, formats, page flow and the rest. */
export default function HelpDialog({ onClose }: { onClose: () => void }) {
  useTranslation(); // re-render when the language changes
  const all = sections();
  const [active, setActive] = useState(all[0].key);
  const section = all.find((s) => s.key === active) ?? all[0];

  return (
    <Modal open onClose={onClose}>
        <ModalPanel className="p-0 md:p-0 max-w-4xl h-full max-h-[86dvh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border">
            <ModalTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <CircleHelp size={20} className="text-primary" /> {h("title", "Report designer help")}
            </ModalTitle>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white cursor-pointer"
              aria-label={dt("reports.designer.close", "Close")}
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
            <nav className="shrink-0 sm:w-52 border-b sm:border-b-0 sm:border-r border-border p-2 flex sm:flex-col gap-0.5 overflow-x-auto sm:overflow-y-auto">
              {all.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActive(s.key)}
                  className={clsx(
                    "text-left whitespace-nowrap px-3 py-1.5 rounded-lg text-[13px] cursor-pointer",
                    s.key === active ? "bg-primary/15 text-white font-bold" : "text-gray-400 hover:text-white hover:bg-surface-hover",
                  )}
                >
                  {s.title}
                </button>
              ))}
            </nav>
            <div className="flex-1 min-w-0 overflow-y-auto p-5">
              <h2 className="text-base font-bold text-white mb-3">{section.title}</h2>
              {section.body}
            </div>
          </div>
        </ModalPanel>
    </Modal>
  );
}
