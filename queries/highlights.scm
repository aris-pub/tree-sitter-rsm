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

;; Section titles — ## syntax (title field, no tag)
(section
  title: (text) @markup.heading.2)

;; Section titles — :section: syntax (tag field, no title)
(section
  tag: _ @keyword)

;; Subsection titles — ### syntax
(subsection
  title: (text) @markup.heading.3)

;; Subsection titles — :subsection: syntax
(subsection
  tag: _ @keyword)

;; Subsubsection titles — #### syntax
(subsubsection
  title: (text) @markup.heading.4)

;; Subsubsection titles — :subsubsection: syntax
(subsubsection
  tag: _ @keyword)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Block Tags (Mathematical Constructs)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Theorem-like environments
[(theorem) (lemma) (corollary) (proposition)] @keyword

;; Proof environments
[(proof) (sketch) (subproof)] @keyword.function

;; Definitions and examples
[(definition) (remark) (example) (exercise) (problem) (porism)] @keyword

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

[(draft) (note) (aside) (span)] @keyword.modifier

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Special Inlines
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Math, code and raw HTML: both delimiters and the content. The closing $
;; and the closing backtick are the anonymous nodes "math" and "code", not the
;; tag field.
(specialinline [(math) (code) (html) "math" "code"] @operator)
(specialinline
  tag: (math)
  (asis_text) @markup.math)
(specialinline
  tag: [(code) (html)]
  (asis_text) @markup.raw)

(specialblock
  tag: (htmlblock) @keyword.directive
  (asis_text) @markup.raw)

;; References
(ref) @function.builtin
(specialinline
  tag: (ref)
  target: (text) @string.special)

;; Note and aside calls
(specialinline
  tag: [(note) (aside)]
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

;; Emphasis and strong, opening and closing
(spanemphas) @operator
(spanstrong) @operator
(specialinline ["*" "**"] @operator)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Special Blocks
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Block tags without a node of their own
[":paragraph:" ":mathblock:" ":codeblock:"] @keyword.directive
[(calc) (notation) (tab) (tabs)] @keyword.directive

;; Math blocks
(mathblock
  (asis_text) @markup.math)

;; Code blocks. The ``` fences are anonymous "code" nodes.
(codeblock "code" @operator)
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

[":table:" ":thead:" ":tbody:" ":tr:" ":td:"] @keyword.directive

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Document Structure
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Abstract, author, config
[(abstract) (author) (config)] @keyword.directive

;; Figures and media
[(figure) (video)] @keyword.directive

;; Lists
[(enumerate) (itemize)] @keyword.directive
[":-:" ":--:" ":---:"] @operator

;; Captions
":caption:" @keyword.modifier

;; Appendix
(appendix) @keyword.directive

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

;; Meta keys
[
  (metakey_bool) (metakey_date) (metakey_list) (metakey_number)
  (metakey_path) (metakey_text) (metakey_title) (metakey_word)
] @property

;; Meta keys - unknown keys, which RSM logs and ignores. The pair is named in
;; the pattern because an unknown tag in body text also parses as metakey_unknown
;; inside an ERROR, and it is not a key there.
(pair (metakey_unknown) @property)

;; Meta values
[
  (metaval_date) (metaval_list) (metaval_number) (metaval_path)
  (metaval_text) (metaval_title) (metaval_unknown) (metaval_word)
] @string

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
