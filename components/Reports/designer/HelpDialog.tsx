import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import clsx from "clsx";
import { CircleHelp, X } from "lucide-react";
import { useState, type ReactNode } from "react";

/** Inline code. */
const C = ({ children }: { children: ReactNode }) => (
  <code className="px-1 py-0.5 rounded bg-background text-brand-purple text-[12px] whitespace-nowrap">{children}</code>
);

const Table = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => (
  <table className="w-full text-[13px] border-collapse my-2">
    <thead>
      <tr>
        {head.map((h) => (
          <th key={h} className="text-left font-bold text-gray-300 border-b border-border py-1.5 pr-3">
            {h}
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

const SECTIONS: { key: string; title: string; body: ReactNode }[] = [
  {
    key: "start",
    title: "Getting started",
    body: (
      <>
        <P>A report is one or more pages of elements (text, metrics, tables, charts, card grids, images and shapes) bound to data sources.</P>
        <Ul
          items={[
            <>
              <b className="text-gray-300">Data</b> tab: add a data source (what to query), then bind elements to it.
            </>,
            <>
              <b className="text-gray-300">Insert</b> tab: drag an element onto the page, or click it to drop it at the top left.
            </>,
            <>Select an element to edit it in the panel on the right; select several to align, distribute or style them together.</>,
            <>
              <b className="text-gray-300">Preview</b> (eye icon) shows the finished pages with live data, including the extra pages growing tables
              add.
            </>,
            <>Save, then use Schedules &amp; webhooks to deliver the report automatically.</>,
          ]}
        />
      </>
    ),
  },
  {
    key: "data",
    title: "Data sources",
    body: (
      <>
        <H>Query a dataset</H>
        <Ul
          items={[
            <>Pick a dataset (playback activity, library items, users...), filter it, and return either rows or a summary (group by + totals).</>,
            <>Both query engines run as SQL in the database and give the same results; Gridify also accepts a raw Gridify filter.</>,
            <>
              Filters can compare against a <b className="text-gray-300">parameter</b> (pick @name as the value), so viewers and schedules can change
              them.
            </>,
          ]}
        />
        <H>Calculated fields</H>
        <P>
          Row-level expressions computed in the database and usable anywhere a field is: <C>Duration / 3600.0</C>,{" "}
          <C>iif(CompletionPercentage &gt;= 90, &quot;Finished&quot;, &quot;Partial&quot;)</C>, <C>SeriesName ?? Name</C>, <C>DateCreated.Hour</C>.
          Write <C>3600.0</C> rather than <C>3600</C> for decimal division.
        </P>
        <H>After the query</H>
        <P>
          Steps applied to the result in order: filter, calculate a column, top N, pivot, running total, percent of total, rank, change from previous,
          fill missing dates, sort and limit. These work on totals too, e.g. &quot;users with at least 10 plays&quot;.
        </P>
        <H>Combine data sources</H>
        <Ul
          items={[
            <>
              <b className="text-gray-300">Join</b>: add another source&apos;s columns to matching rows (left, inner or full), e.g. this month next to
              last month per user.
            </>,
            <>
              <b className="text-gray-300">Union</b>: stack rows from several sources, optionally with a column naming each row&apos;s source.
            </>,
            <>Combined sources can build on other combined sources.</>,
          ]}
        />
      </>
    ),
  },
  {
    key: "tokens",
    title: "Placeholders & formats",
    body: (
      <>
        <P>
          Placeholders use double curly braces and work in text, headings, metric labels, card text lines and link URLs. Unknown ones are left as they
          are, so a typo shows up rather than breaking the report.
        </P>
        <Table
          head={["Placeholder", "Gives"]}
          rows={[
            [<C key="a">{"{{page.number}}"}</C>, "Current page number, counting the extra pages growing elements add"],
            [<C key="a">{"{{page.count}}"}</C>, "Total pages, including extra pages"],
            [<C key="a">{"{{report.name}}"}</C>, "The report's name"],
            [<C key="a">{"{{now}}"}</C>, "When the report was generated, in the report's time zone"],
            [<C key="a">{"{{param.NAME}}"}</C>, "A parameter's value"],
            [<C key="a">{"{{ds.SOURCE.FIELD}}"}</C>, "A column from the first row of a data source (by name or id)"],
            [<C key="a">{"{{ds.SOURCE.rowCount}}"}</C>, "How many rows a data source returned"],
            [<C key="a">{"{{row.FIELD}}"}</C>, "Card grid text and link URLs: a column of the card's (or table row's) own row"],
            [<C key="a">{"{{value}}"}</C>, "Hyperlink URL templates: the value being linked"],
          ]}
        />
        <P>
          Example footer: <C>{"Page {{page.number}} of {{page.count}}"}</C>
        </P>
        <H>Formats</H>
        <P>
          Add <C>|format</C> after a placeholder: <C>{"{{now|datetime}}"}</C>, <C>{"{{ds.Totals.watch|duration}}"}</C>,{" "}
          <C>{"{{row.Plays|integer}}"}</C>. The same formats are offered for table columns and metrics.
        </P>
        <Table
          head={["Format", "Example"]}
          rows={[
            [<C key="a">text</C>, "As is"],
            [<C key="a">number</C>, "1,234.57"],
            [<C key="a">integer</C>, "1,235"],
            [<C key="a">decimal</C>, "1,234.57 (always 2 decimals)"],
            [<C key="a">percent</C>, "42.5%"],
            [<C key="a">duration</C>, "1h 52m (from seconds)"],
            [<C key="a">bytes</C>, "1.4 GB"],
            [<C key="a">date</C>, "2026-10-29"],
            [<C key="a">datetime</C>, "2026-10-29 16:20"],
            [<C key="a">time</C>, "16:20"],
          ]}
        />
        <P>
          On the design canvas, <C>{"{{page.count}}"}</C> only counts design pages; Preview, the viewer and exports show the real total.
        </P>
      </>
    ),
  },
  {
    key: "flow",
    title: "Page flow",
    body: (
      <>
        <P>
          Turn on <b className="text-gray-300">Continue on new pages</b> (Pages section) for a table or card grid, and rows that don&apos;t fit go
          onto extra pages added after that page, with the table header repeated.
        </P>
        <Ul
          items={[
            <>
              A dashed green <b className="text-gray-300">Header</b> line appears; drag it (or set Header height). On the extra pages the table starts
              there.
            </>,
            <>
              Everything entirely <b className="text-gray-300">above the header line</b> or <b className="text-gray-300">below the table</b> repeats
              on every extra page, like page headers and footers: titles, logos, page numbers.
            </>,
            <>Everything in between (intro text, metrics, charts) appears on the first page only.</>,
            <>
              <b className="text-gray-300">First page only</b> keeps a header or footer element off the extra pages.
            </>,
          ]}
        />
        <P>The viewer, Preview and every export break pages in the same places. A report is capped at 500 pages.</P>
      </>
    ),
  },
  {
    key: "conditions",
    title: "Conditional formatting",
    body: (
      <>
        <P>
          Tables, metrics and card grids have a Conditional formatting section. Each rule is a column, an operator and a value, plus the styles to
          apply.
        </P>
        <Ul
          items={[
            <>
              <b className="text-gray-300">Tables</b>: style the whole row or one column, e.g. red text in Watch time when it&apos;s under 60.
            </>,
            <>
              <b className="text-gray-300">Metrics</b>: checked against the first row; styles the value and fill.
            </>,
            <>
              <b className="text-gray-300">Card grids</b>: checked per card; styles the card.
            </>,
            <>Rules apply in order; when two set the same thing, the later one wins.</>,
          ]}
        />
      </>
    ),
  },
  {
    key: "cards",
    title: "Card grids",
    body: (
      <>
        <P>
          One card per row: a poster, backdrop or user avatar, plus up to three text lines. Good for &quot;top 10 movies&quot; or &quot;most active
          users&quot;.
        </P>
        <Ul
          items={[
            <>
              <b className="text-gray-300">Media id column</b>: the column holding the item (or user) id, e.g. ItemId.
            </>,
            <>
              Text lines use <C>{"{{row.FIELD}}"}</C>, e.g. title <C>{"{{row.Name}}"}</C>, subtitle{" "}
              <C>{"{{row.UserName}} · {{row.DateCreated|date}}"}</C>, value <C>{"{{row.Duration|duration}}"}</C>. The &quot;+ column&quot; picker
              inserts one for you.
            </>,
            <>
              Set columns, card height, gap, fill, corner radius and a maximum number of cards. A card grid can continue on new pages like a table.
            </>,
            <>
              An optional link per card, e.g. <C>{"https://jellyfin.example/web/#/details?id={{row.ItemId}}"}</C>.
            </>,
          ]}
        />
      </>
    ),
  },
  {
    key: "links",
    title: "Hyperlinks",
    body: (
      <>
        <Ul
          items={[
            <>
              Table columns and metrics: choose the <b className="text-gray-300">Hyperlink</b> format. Leave the URL empty if the value already is a
              URL, or write a template with <C>{"{{value}}"}</C> and <C>{"{{row.FIELD}}"}</C>.
            </>,
            <>Text and images: set Link to make the whole element clickable. Placeholders work there too.</>,
            <>Values inserted after the start of a URL are URL-encoded automatically.</>,
            <>Only http, https and mailto links are created; anything else shows as plain text.</>,
            <>Links open in the viewer, HTML/SVG exports and server PDFs. Images (PNG) and in-browser PDFs can&apos;t hold links.</>,
          ]}
        />
      </>
    ),
  },
  {
    key: "params",
    title: "Parameters",
    body: (
      <>
        <P>Parameters (Data tab) are values the viewer or a schedule can change: text, a number, a date, yes/no, or a lookup.</P>
        <Ul
          items={[
            <>
              Use one in a filter by picking @name as the rule&apos;s value. An empty parameter switches its rule off, which is how optional filters
              work.
            </>,
            <>
              Show one in text with <C>{"{{param.NAME}}"}</C>.
            </>,
            <>
              A <b className="text-gray-300">lookup</b> is a dropdown of choices from a data source (value column + optional label column), optionally
              allowing several choices.
            </>,
          ]}
        />
      </>
    ),
  },
  {
    key: "export",
    title: "Exports & delivery",
    body: (
      <>
        <Table
          head={["Export", "Notes"]}
          rows={[
            ["PDF (server, vector)", "Sharp text, fonts embedded, clickable links. Best for sharing and schedules."],
            ["PNG / SVG of this page (server)", "One page as an image; SVG keeps links."],
            ["HTML (server)", "A standalone page with all pages, fonts and links."],
            ["Data as JSON (server)", "The data behind the report."],
            ["PNG / PDF (in browser)", "Captures what you see; no clickable links."],
            ["Report definition (.json)", "The design itself, to back up or import elsewhere."],
          ]}
        />
        <P>Saved reports can be delivered on a schedule or by webhook (generic, Discord or JSON) with Schedules &amp; webhooks in the toolbar.</P>
      </>
    ),
  },
  {
    key: "keys",
    title: "Keyboard shortcuts",
    body: (
      <Table
        head={["Keys", "Action"]}
        rows={[
          ["Ctrl+S", "Save"],
          ["Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z)", "Undo / redo"],
          ["Ctrl+C / Ctrl+X / Ctrl+V", "Copy / cut / paste"],
          ["Ctrl+D", "Duplicate"],
          ["Ctrl+A", "Select everything on the page"],
          ["Delete / Backspace", "Delete the selection"],
          ["Arrow keys (Shift for 10px)", "Nudge the selection"],
          ["Ctrl+] / Ctrl+[ (with Shift: to front / back)", "Bring forward / send backward"],
          ["Ctrl+= / Ctrl+- / Ctrl+0", "Zoom in / out / fit page"],
          ["Shift / Ctrl + click", "Add to the selection"],
          ["Alt while dragging", "Move without snapping"],
          ["Double-click text", "Edit in place (Ctrl+Enter to finish)"],
          ["Escape", "Clear the selection, leave Preview"],
          ["?", "Open this help"],
        ]}
      />
    ),
  },
];

/** Reference for the report designer: placeholders, formats, page flow and the rest. */
export default function HelpDialog({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState(SECTIONS[0].key);
  const section = SECTIONS.find((s) => s.key === active) ?? SECTIONS[0];

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-6">
        <DialogPanel className="w-full max-w-4xl h-full max-h-[86dvh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40 overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-white">
              <CircleHelp size={20} className="text-brand-purple" /> Report designer help
            </DialogTitle>
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white cursor-pointer" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
            <nav className="shrink-0 sm:w-52 border-b sm:border-b-0 sm:border-r border-border p-2 flex sm:flex-col gap-0.5 overflow-x-auto sm:overflow-y-auto">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActive(s.key)}
                  className={clsx(
                    "text-left whitespace-nowrap px-3 py-1.5 rounded-lg text-[13px] cursor-pointer",
                    s.key === active ? "bg-brand-purple/15 text-white font-bold" : "text-gray-400 hover:text-white hover:bg-surface-hover",
                  )}
                >
                  {s.title}
                </button>
              ))}
            </nav>
            <div className="flex-1 min-w-0 overflow-y-auto p-5">
              <h2 className="text-base font-black text-white mb-3">{section.title}</h2>
              {section.body}
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
