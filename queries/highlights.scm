;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; RSM Tree-sitter Syntax Highlighting Queries
;;
;; This file is the single source of truth for RSM syntax highlighting, used by:
;; 1. Direct tree-sitter editors (Neovim, Emacs, Helix)
;; 2. LSP semantic tokens provider (Studio via CodeMirror)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Headings and Sections
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Document title
(source_file
  title: (text) @markup.heading.1)

;; Section titles (## or :section:)
(section
  tag: _ @keyword
  title: (text)? @markup.heading.2)

;; Subsection titles (### or :subsection:)
(subsection
  tag: _ @keyword
  title: (text)? @markup.heading.3)

;; Subsubsection titles (#### or :subsubsection:)
(subsubsection
  tag: _ @keyword
  title: (text)? @markup.heading.4)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Block Tags (Mathematical Constructs)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Theorem-like environments
[(theorem) (lemma) (corollary) (proposition)] @keyword

;; Proof environments
[(proof) (sketch) (subproof)] @keyword.function

;; Definitions and examples
[(definition) (remark) (example)] @keyword

;; Proof steps
[(step)] @keyword.modifier

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Construct Tags (Proof Language)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Proof constructs (assume, claim, let, etc.)
[
  (assume) (case) (claim) (define) (let) (new) (pick) (prove)
  (st) (suffices) (suppose) (then) (wlog) (write)
] @keyword.function

;; QED marker
(qed) @constant.builtin

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Inline Tags
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

[(draft) (note) (span)] @keyword.modifier

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Special Inlines
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Math delimiters and content
(specialinline
  tag: (math) @operator
  (asis_text) @markup.math)

;; Code delimiters and content
(specialinline
  tag: (code) @operator
  (asis_text) @markup.raw)

;; References
(ref) @function.builtin
(specialinline
  tag: (ref)
  target: (text) @string.special)

;; Citations
(cite) @function.builtin
(specialinline
  tag: (cite)
  targetlabels: (text) @string.special)

;; URLs
(url) @function.builtin
(specialinline
  tag: (url)
  target: (text) @markup.link.url)

;; Previous references
[(previous) (prev) (prev2) (prev3)] @function.builtin

;; Emphasis and strong
(spanemphas) @operator
(spanstrong) @operator

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Special Blocks
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Math blocks
(mathblock
  (asis_text) @markup.math)

;; Code blocks
(codeblock
  (asis_text) @markup.raw.block)

;; Algorithm blocks
(algorithm) @keyword
(specialblock
  tag: (algorithm)
  (asis_text) @markup.raw.block)

;; Table of contents
(toc) @keyword.directive

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Tables
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

[(thead) (tbody) (tr)] @keyword.directive

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Document Structure
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Abstract, author, config
[(abstract) (author) (config)] @keyword.directive

;; Figures and media
[(figure) (video)] @keyword.directive

;; Lists
[(enumerate) (itemize)] @keyword.directive
":-:" @operator

;; Captions
":caption:" @keyword.modifier

;; Appendix
(appendix) @keyword.directive

;; HTML embedding
(html) @keyword.directive

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Bibliography
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

":references:" @keyword.directive

(bibitem
  "@" @punctuation.special
  kind: (kind) @type)

(bibitem
  label: (label) @string.special)

(bibitempair
  (key) @property
  (value) @string)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Metadata
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Meta keys - text values
[
  (affiliation) (alt) (author_note) (email) (goal) (icon)
  (label) (lang) (name) (orcid) (reftext) (title)
] @property

;; Meta keys - boolean values
[(emphas) (isclaim) (nonum) (strong)] @property

;; Meta keys - list values
[(keywords) (msc) (class)] @property

;; Meta keys - any values
[
  (accent) (dark) (typography) (author_display_first)
  (author_display_last) (numbering) (override_date)
  (path) (scale) (static) (theme) (toc_depth)
] @property

;; Meta values
(metaval_text) @string
(metaval_list_item) @string

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Delimiters and Operators
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Halmos (block/inline terminator)
"::" @operator

;; Meta braces
"{" @punctuation.bracket
"}" @punctuation.bracket

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Comments
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(comment) @comment
