/**
 * @file rsm mark-up language
 * @author leotrs <leo@leotrs.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Block meta and inline meta are written the same way. A value runs to the
// next key or to the closing brace, and newlines count as spaces. A comma after
// a pair is optional, also after the last one: after a value it is part of the
// value's text (see _metaval), and after a key with no value it is this ','.
// A meta may be empty ({}).
function metaBody($) {
  return seq(
    '{',
    optional(seq(
      $.pair,
      repeat(seq(optional(','), $.pair)),
      optional(','))),
    '}');
}

// A heading's title is everything up to the end of its line, inline markup
// included. Whitespace is an extra, so the grammar cannot see the line break
// itself: the scanner returns _line_end there. A meta block may follow on the
// same line, in which case the line break comes after it. Links and raw HTML
// are not allowed in a heading, but they are parsed here so the heading stays
// whole and RSM can report them by name.
function headingTitle($) {
  return seq(
    field('title', repeat1(choice(
      $._reftext_inline,
      alias($._refinline, $.specialinline),
      alias($._rawinline, $.specialinline)))),
    choice(
      seq($._line_end, field('meta', optional($.blockmeta))),
      field('meta', $.blockmeta)));
}

export default grammar({
  name: 'rsm',

  externals: $ => [
    $.meta_text,
    $.asis_dollar_text,
    $.asis_two_dollars_text,
    $.asis_backtick_text,
    $.asis_three_backticks_text,
    $.asis_halmos_text,
    $.text,
    $.paragraph_end,
    $._line_end,
    $.meta_title_text,
    $.asis_codeblock_text,
    $.asis_mathblock_text,
  ],

  inline: $ => [
    $.blocktag,
    $.inlinetag,
    $.constructtag,
    $.blockcontent,
    $.paragraphcontent,
    $.inlinecontent,
  ],

  extras: $ => [
    $.comment,
    /\s/,
  ],

  rules: {
    ////////////////////////////////////////////////////////////////////////
    // Main building blocks: manuscript, block, paragraph, inline
    ////////////////////////////////////////////////////////////////////////
    source_file: $ => seq(
      optional(choice(
        seq(
          optional(alias($._config_block, $.block)),
          field('tag', /# /),
          headingTitle($)),
        field('meta', $.blockmeta))),
      repeat(choice($.section, $.appendix, $._terminalblock, $.specialblock, $.block, $.paragraph, $.references))),

    // A :config: block is the only thing allowed before the title. It has the
    // same form as a block, and the alias keeps its node a block, so RSM reads
    // it the same way wherever it is.
    _config_block: $ => seq(
      field('tag', alias(':config:', $.config)),
      field('meta', optional($.blockmeta)),
      repeat($.blockcontent),
      '::'),

    block: $ => prec(1, seq(
      field('tag', $.blocktag),
      field('meta', optional($.blockmeta)),
      repeat($.blockcontent),
      '::')),

    paragraph: $ => choice(
      prec(2, $.item),
      prec(2, $.caption),
      seq(optional(seq(
        field('tag', ':paragraph:'),
        field('meta', $.inlinemeta))),
        $._paragraphcontent_no_special,
        repeat($.paragraphcontent),
        alias($.paragraph_end, 'paragraph_end'))),

    inline: $ => prec(0, seq(
      field('tag', $.inlinetag),
      field('meta', optional($.inlinemeta)),
      repeat($.inlinecontent),
      '::')),

    construct: $ => seq(
      field('tag', $.constructtag),
      field('meta', optional($.inlinemeta)),
      repeat($.inlinecontent),
      '::'),

    ////////////////////////////////////////////////////////////////////////
    // Sections
    ////////////////////////////////////////////////////////////////////////
    // Sections are like blocks except that they do not need a Halmos.  Instead,
    // a Section ends when another Section begins, or when the manuscript ends.
    // A Subsection ends when another Subsection begins, or when the next Section
    // begins.  A Subsubsection ends with another Subsubsection begins or when
    // a new Section or Subsection begins.
    // Sections may begin with hashtags like in Markdown or with :section: tags.
    section: $ => prec.right(choice(
      seq(field('tag', /## /),
        headingTitle($),
        repeat(choice($.specialblock, $._terminalblock, $.block, $.paragraph, $.subsection)),
      ),
      seq(field('tag', ':section:'),
        field('meta', optional($.blockmeta)),
        repeat(choice($.specialblock, $._terminalblock, $.block, $.paragraph, $.subsection)),
      ),
    )),

    subsection: $ => prec.right(choice(
      seq(
        field('tag', /### /),
        headingTitle($),
        repeat(choice($.specialblock, $._terminalblock, $.block, $.paragraph, $.subsubsection)),
      ),
      seq(
        field('tag', ':subsection:'),
        field('meta', $.blockmeta),
        repeat(choice($.specialblock, $._terminalblock, $.block, $.paragraph, $.subsubsection)),
      )
    )),

    subsubsection: $ => prec.right(choice(
      seq(
        field('tag', /#### /),
        headingTitle($),
        repeat(choice($.specialblock, $._terminalblock, $.block, $.paragraph)),
      ),
      seq(
        field('tag', ':subsubsection:'),
        field('meta', optional($.blockmeta)),
        repeat(choice($.specialblock, $._terminalblock, $.block, $.paragraph)),
      )
    )),

    // The appendix essentially works as a section that does not allow content. The
    // appendix is a 'stamp': it has no content and needs no Halmos.
    appendix: $ => field('tag', ':appendix:'),


    ////////////////////////////////////////////////////////////////////////
    // Special blocks, paragraphs, and inlines
    ////////////////////////////////////////////////////////////////////////
    // Special blocks/inlines look just like normal blocks/inlines except that they
    // have some special parsing rule.  For example, $foo$ has the same meaning as
    // :math:foo::.
    mathblock: $ => choice(
      seq(alias(token(/\$\$/), "math"),
        field('meta', optional($.blockmeta)),
        alias($.asis_two_dollars_text, $.asis_text),
        alias(token(/\$\$/), "math")),
      seq(token(':mathblock:'),
        field('meta', optional($.blockmeta)),
        alias($.asis_mathblock_text, $.asis_text),
        '::')),

    codeblock: $ => choice(
      seq(alias(token(/```/), "code"),
        field('meta', optional($.blockmeta)),
        alias($.asis_three_backticks_text, $.asis_text),
        alias(/```/, "code")),
      seq(token(':codeblock:'),
        field('meta', optional($.blockmeta)),
        alias($.asis_codeblock_text, $.asis_text),
        field('caption', optional($.caption)),
        '::')),

    // A list holds only items; nested lists are written with the :--: and :---:
    // markers. Lists are kept out of blocktag so that a list can be paragraph
    // content (see $._terminalblock) while other blocks cannot. The aliases keep
    // the tree the same as for any other block: block > paragraph > item.
    _list: $ => alias($.list, $.block),

    list: $ => prec(1, seq(
      field('tag', choice(
        alias(':enumerate:', $.enumerate),
        alias(':itemize:', $.itemize))),
      field('meta', optional($.blockmeta)),
      repeat(alias($._listitem, $.paragraph)),
      '::')),

    _listitem: $ => prec(2, $.item),

    // Algorithms have standard open and close delimiters and have as-is
    // (i.e. not recursive) content. They are kept out of $.specialblock so that
    // an algorithm can be paragraph content (see $._terminalblock); the alias
    // keeps the tree the same as before.
    _algorithm: $ => alias($.algorithmblock, $.specialblock),

    algorithmblock: $ => prec.right(1, seq(
      field('tag', alias(token(":algorithm:"), $.algorithm)),
      field('meta', optional($.blockmeta)),
      alias($.asis_halmos_text, $.asis_text),
      '::')),

    specialblock: $ => prec.right(1, choice(
      $.table,



      // An HTML block is written into the page as is. Its :alt: stands in for it
      // where HTML cannot be.
      seq(field('tag', alias(token(":htmlblock:"), $.htmlblock)),
        field('meta', optional($.blockmeta)),
        alias($.asis_halmos_text, $.asis_text),
        '::'),

      // Notation declares reader-rebindable macros as raw lines
      // (\macro $default$ label), parsed by the transformer.
      seq(field('tag', alias(token(":notation:"), $.notation)),
        field('meta', optional($.blockmeta)),
        alias($.asis_halmos_text, $.asis_text),
        '::'),

      // A note or aside definition holds one paragraph's content. Its meta block
      // (carrying the label) is required: the opening brace after the tag is what
      // tells a definition apart from a call, which takes a bare label instead.
      // The paragraph end is optional because the scanner does not find one
      // between an inline tag and a Halmos on the same line (as in "$x$ ::").
      // A blank line still ends the paragraph, so a second paragraph is an error.
      seq(field('tag', choice(
            alias(token(':note:'), $.note),
            alias(token(':aside:'), $.aside))),
        field('meta', $.blockmeta),
        repeat1($.paragraphcontent),
        optional(alias($.paragraph_end, 'paragraph_end')),
        '::'))),

    // Special paragraphs are not grouped inside a single $.specialparagraph rule
    // because they can only appear in certain places, and each is referred to
    // individually as $.caption and $.item and never collectively.
    caption: $ => seq(
      token(':caption:'),
      optional(field('meta', $.inlinemeta)),
      repeat1($._itemcontent),
      alias($.paragraph_end, 'paragraph_end')),

    // The marker's dash count is the nesting depth: :-: level 1, :--: level 2,
    // :---: level 3. Three levels only; the Python side reads the marker and
    // groups items into a tree. A deeper marker never appears as a token, so
    // :----: cannot form an item.
    item: $ => seq(
      field('marker', choice(':-:', ':--:', ':---:')),
      optional(field('meta', $.inlinemeta)),
      repeat1($._itemcontent),
      alias($.paragraph_end, 'paragraph_end')),

    specialinline: $ => choice(
      $._formatinline,
      $._refinline,
      $._rawinline,
    ),

    // Raw HTML is written into the page as is, so it is kept out of
    // $._formatinline: a link's reftext must not hold it. Like :code:, its
    // content runs up to the first Halmos, so the HTML cannot contain "::".
    _rawinline: $ => seq(field('tag', alias(token(':html:'), $.html)),
      field('meta', optional($.inlinemeta)),
      alias($.asis_halmos_text, $.asis_text),
      '::'),

    // Formatting inlines (math, code, and the span shortcuts) are the subset of
    // special inlines that is also allowed inside a link's reftext. They are kept
    // in their own rule so reftext can reference them without the reference/link
    // tags below.
    _formatinline: $ => choice(
      // Math and code inlines have special open and close delimimters ($) and (`)
      // respectively AND as-is content.
      seq(field('tag', alias(token(/\$/), $.math)),
        field('meta', optional($.inlinemeta)),
        alias($.asis_dollar_text, $.asis_text),
        alias(/\$/, "math")),
      seq(field('tag', alias(token(/`/), $.code)),
        field('meta', optional($.inlinemeta)),
        alias($.asis_backtick_text, $.asis_text),
        alias(/`/, "code")),
      seq(field('tag', alias(token(':math:'), $.math)),
        field('meta', optional($.inlinemeta)),
        alias($.asis_halmos_text, $.asis_text),
        '::'),
      seq(field('tag', alias(token(':code:'), $.code)),
        field('meta', optional($.inlinemeta)),
        alias($.asis_halmos_text, $.asis_text),
        '::'),

      // Special spans have special open and close delimiters and support
      // recursive parsing.  Note **foo** is equivalent to :span:{:strong:}foo::.
      prec.right(2,
        seq(field('tag', alias(token(/\*\*/), $.spanstrong)),
          repeat($.inlinecontent),
          token('**'))),
      prec.right(1,
        seq(field('tag', alias(token(/\*/), $.spanemphas)),
          repeat($.inlinecontent),
          token('*'))),
    ),

    // Reference, citation, URL, and previous* inlines. These are excluded from a
    // link's reftext so links cannot nest inside a link's display text.
    _refinline: $ => choice(
      // Prev* are special bc they have no content and no Halmos (they are stamps)
      alias(token(':prev:'), $.prev),
      alias(token(':prev2:'), $.prev2),
      alias(token(':prev3:'), $.prev3),

      // References (including 'previous'), citations, and URLs have standard
      // delimiters but their content is parsed in a special way. The reftext of
      // :ref: and :url: accepts inline markup (see $._reftext_inline).
      seq(field('tag', alias(token(':ref:'), $.ref)),
        field('meta', optional($.inlinemeta)),
        field('target', alias(token(/[^,:]+/), $.text)),
        optional(seq(',', field('reftext', repeat($._reftext_inline)))),
        '::'),
      seq(field('tag', alias(token(':previous:'), $.previous)),
        field('target', alias(token(/[0-9]+/), $.text)),
        optional(seq(',', field('reftext', $.text))),
        '::'),
      seq(field('tag', alias(token(':url:'), $.url)),
        field('target', alias(token(/(https:\/\/|http:\/\/)?[^\s,:]+?/), $.text)),
        optional(seq(',', field('reftext', repeat($._reftext_inline)))),
        '::'),
      seq(field('tag', alias(token(':cite:'), $.cite)),
        field('targetlabels', alias(token(/[^:]+/), $.text)),
        optional(seq(',', field('reftext', $.text))),
        '::'),

      // A note call takes only the label of its definition. Whitespace, braces
      // and commas are excluded from the label so that inline content or a meta
      // block after the tag is a parse error.
      seq(field('tag', alias(token(':note:'), $.note)),
        field('target', alias(token(/[^\s,:{}]+/), $.text)),
        '::'),
      // An aside call also names the phrase the aside is about, after a comma,
      // as :ref: does for its link text. The phrase is optional here so that a
      // call without one parses and RSM can report it with a clear message.
      seq(field('tag', alias(token(':aside:'), $.aside)),
        field('target', alias(token(/[^\s,:{}]+/), $.text)),
        optional(seq(',', field('phrase', repeat1($._reftext_inline)))),
        '::'),
    ),

    // Inline content allowed inside a link's reftext: everything an ordinary
    // paragraph holds except the reference/link tags. The formatting inlines are
    // aliased to specialinline so they appear exactly as they would in body text.
    _reftext_inline: $ => choice(
      alias($._formatinline, $.specialinline),
      $.inline,
      $.specialconstruct,
      $.construct,
      $.text,
    ),

    specialconstruct: $ => choice(
      // stamp
      alias(field("tag", ':qed:'), $.qed),
    ),

    /////////////////////////////////////////////////////////////
    // Meta regions
    /////////////////////////////////////////////////////////////
    inlinemeta: $ => metaBody($),

    blockmeta: $ => metaBody($),

    pair: $ => choice(
      seq($.metakey_title, $.metaval_title),
      seq($.metakey_text, $.metaval_text),
      seq($.metakey_path, $.metaval_path),
      seq($.metakey_number, $.metaval_number),
      seq($.metakey_word, $.metaval_word),
      seq($.metakey_date, $.metaval_date),
      seq($.metakey_list, $.metaval_list),
      $.metakey_bool,
      seq($.metakey_unknown, optional($.metaval_unknown))),

    /////////////////////////////////////////////////////////////
    // Meta pair types
    /////////////////////////////////////////////////////////////
    // Every value is read the same way, and Python checks its form against its
    // key. A value is one meta_text per line (comments may sit between them),
    // and it ends before the next key or at the closing brace. A comma before
    // the next key stays in the value here and Python drops it.
    _metaval: $ => repeat1(alias($.meta_text, 'text')),

    // A key that is not one of the known keys below, so that the parser still
    // forms the meta block and Python can log the key by name. The known keys
    // are strings of the same length as this pattern, and tree-sitter prefers a
    // string over a pattern of the same length, so known keys still win.
    metakey_unknown: $ => token(/:[a-z0-9][a-z0-9-]*:/),

    metaval_unknown: $ => $._metaval,

    metaval_text: $ => $._metaval,

    // A title holds inline markup, as a heading does. Its text pieces are
    // meta_title_text, which also stops at $, * and `. Links and raw HTML are
    // parsed so that RSM can report them by name.
    metaval_title: $ => repeat1(choice(
      alias($.meta_title_text, $.text),
      alias($._formatinline, $.specialinline),
      $.inline,
      $.specialconstruct,
      $.construct,
      alias($._refinline, $.specialinline),
      alias($._rawinline, $.specialinline))),

    metaval_path: $ => $._metaval,

    metaval_number: $ => $._metaval,

    metaval_word: $ => $._metaval,

    metaval_date: $ => $._metaval,

    // Python splits a list at its commas.
    metaval_list: $ => $._metaval,

    /////////////////////////////////////////////////////////////
    // Tables
    /////////////////////////////////////////////////////////////
    table: $ => seq(
      field('tag', ':table:'),
      field('meta', optional($.blockmeta)),
      field('head', optional($.thead)),
      field('body', optional($.tbody)),
      field('caption', optional($.caption)),
      '::'),

    thead: $ => seq(
      field('tag', ':thead:'),
      repeat1(choice($.tr, $.trshort)),
      '::'),

    tbody: $ => seq(
      field('tag', ':tbody:'),
      repeat1(choice($.tr, $.trshort)),
      '::'),

    tr: $ => seq(
      field('tag', ':tr:'),
      repeat1($.td),
      '::'),

    trshort: $ => prec(1,
      seq(field('tag', ':tr:'),
        choice($.tdcontent, seq(repeat1(seq($.tdcontent, ':')), $.tdcontent)),
        '::')),

    td: $ => seq(
      field('tag', token(':td:')),
      field('meta', optional($.inlinemeta)),
      optional($.tdcontent),
      '::'),

    tdcontent: $ => repeat1($.inlinecontent),


    /////////////////////////////////////////////////////////////
    // Bibliography stuff
    /////////////////////////////////////////////////////////////
    // The grammar accepts any entry kind and any field name, and values in
    // quotes or as bare words, so that Python can warn about each by name
    // instead of tree-sitter error recovery dropping or merging entries.
    references: $ => seq(':references:', repeat(choice($.bibitem, $.bibstring, $.bibcomment)), '::'),

    bibitem: $ => seq(
      // The '@' is part of the kind token so that the token cannot match a
      // plain word during error recovery outside a references block.
      field('kind', alias(token(seq('@', /[A-Za-z]+/)), $.kind)),
      '{',
      field('label', alias(token(/[^,]+?/), $.label)),
      ',',
      $.bibitempair,
      repeat(seq(',', $.bibitempair)),
      optional(','),
      '}'),

    // "@string" also matches the kind of a bibitem, so it needs the
    // higher precedence.
    bibstring: $ => seq(
      field('kind', alias(token(prec(1, seq('@', /[sS][tT][rR][iI][nN][gG]/))), $.kind)),
      '{',
      $.bibitempair,
      '}'),

    // A BibTeX comment. "@comment" also matches the kind of a bibitem, so it
    // needs the higher precedence.
    bibcomment: $ => seq(
      field('kind', alias(token(prec(1, seq('@', /[cC][oO][mM][mM][eE][nN][tT]/))), $.kind)),
      '{',
      repeat(choice(/[^{}]+/, $._bibbraces)),
      '}'),

    bibitempair: $ => seq(
      alias(token(seq(/[A-Za-z][A-Za-z0-9_-]*/, /\s*=\s*/)), $.key),
      choice(
        seq('{', $.value, '}'),
        alias(/"[^"]*"/, $.quotedvalue),
        alias(/[^\s,{}"]+/, $.barevalue))),

    value: $ => repeat1(choice($._bibtext, $._bibbraces)),

    _bibbraces: $ => seq('{', repeat(choice($._bibtext, $._bibbraces)), '}'),

    // The text of a value keeps any % in it, and Python cuts the value at the
    // first % that has no backslash before it. A comment token would run to the
    // end of the line and take the closing brace and the later fields with it.
    // A second token for % that ends at a brace changes how tree-sitter merges
    // lexer states, and lines of a paragraph that start with a digit then fail
    // to parse. The precedence makes the text win over the comment of the
    // extras when a % comes right after a brace.
    _bibtext: $ => token(prec(1, /[^{}]+/)),

    /////////////////////////////////////////////////////////////
    // Content choices
    /////////////////////////////////////////////////////////////
    blockcontent: $ => choice($.specialblock, $._terminalblock, $.block, $.paragraph),

    // Terminal blocks are the blocks that may stand inside a paragraph, between
    // two runs of its text. Anywhere else they stand as blocks of their own.
    _terminalblock: $ => choice($.mathblock, $.codeblock, $._list, $._algorithm),

    // The content of list items and captions. It is paragraph content without
    // lists and algorithms: of the terminal blocks, items and captions accept
    // only display math and code blocks.
    _itemcontent: $ => choice($.mathblock, $.codeblock, $.specialinline, $.inline, $.specialconstruct, $.construct, $.text),

    _paragraphcontent_no_special: $ => choice($.specialinline, $.inline, $.specialconstruct, $.construct, $.text),

    paragraphcontent: $ => choice($._terminalblock, $.specialinline, $.inline, $.specialconstruct, $.construct, $.text),

    inlinecontent: $ => choice($.specialinline, $.inline, $.specialconstruct, $.construct, $.text),

    /////////////////////////////////////////////////////////////
    // Tag choices
    /////////////////////////////////////////////////////////////
    constructtag: $ => choice(
      alias(':assume:', $.assume),
      alias(':case:', $.case),
      alias(':claim:', $.claim),
      alias(':define:', $.define),
      alias(':let:', $.let),
      alias(':new:', $.new),
      alias(':pick:', $.pick),
      alias(':prove:', $.prove),
      alias(':st:', $.st),
      alias(':suffices:', $.suffices),
      alias(':suppose:', $.suppose),
      alias(':then:', $.then),
      alias(':wlog:', $.wlog),
      alias(':write:', $.write),
      alias(':|-:', $.claim),
      alias(':⊢:', $.claim),
      // alias(':qed:', $.qed), // should be a stamp
    ),

    inlinetag: $ => choice(
      alias(':draft:', $.draft),
      alias(':span:', $.span),
    ),

    blocktag: $ => choice(
      alias(':abstract:', $.abstract),
      alias(':author:', $.author),
      alias(':calc:', $.calc),
      alias(':config:', $.config),
      alias(':corollary:', $.corollary),
      alias(':definition:', $.definition),
      alias(':example:', $.example),
      alias(':exercise:', $.exercise),
      alias(':figure:', $.figure),
      alias(':lemma:', $.lemma),
      alias(':pf:', $.subproof),
      alias(':porism:', $.porism),
      alias(':problem:', $.problem),
      alias(':proof:', $.proof),
      alias(':proposition:', $.proposition),
      alias(':remark:', $.remark),
      alias(':sketch:', $.sketch),
      alias(':step:', $.step),
      alias(':tab:', $.tab),
      alias(':tabs:', $.tabs),
      alias(':theorem:', $.theorem),
      alias(':toc:', $.toc),
      alias(':video:', $.video),
    ),

    metakey_text: $ => choice(
      alias(':affiliation:', $.affiliation),
      alias(':alt:', $.alt),
      alias(':author-note:', $.author_note),
      alias(':blockname:', $.blockname),
      alias(':email:', $.email),
      alias(':eyebrow:', $.eyebrow),
      alias(':plain-title:', $.plain_title),
      alias(':goal:', $.goal),
      alias(':icon:', $.icon),
      alias(':label:', $.label),
      alias(':name:', $.name),
      alias(':of:', $.of),
      alias(':orcid:', $.orcid),
      alias(':reftext:', $.reftext),
    ),

    metakey_title: $ => alias(':title:', $.title),

    metakey_bool: $ => choice(
      alias(':collapsed:', $.collapsed),
      alias(':as-paragraph:', $.as_paragraph),
      alias(':delete:', $.delete),
      alias(':emphas:', $.emphas),
      alias(':insert:', $.insert),
      alias(':isclaim:', $.isclaim),
      alias(':little:', $.little),
      alias(':no-minimap:', $.no_minimap),
      alias(':nonum:', $.nonum),
      alias(':preamble:', $.preamble),
      alias(':strong:', $.strong),
    ),

    metakey_list: $ => choice(
      alias(':keywords:', $.keywords),
      alias(':msc:', $.msc),
      alias(':class:', $.class),
    ),

    metakey_path: $ => choice(
      alias(':dark:', $.dark),
      alias(':path:', $.path),
      alias(':static:', $.static),
    ),

    metakey_number: $ => choice(
      alias(':author-display-first:', $.author_display_first),
      alias(':author-display-last:', $.author_display_last),
      alias(':scale:', $.scale),
      alias(':toc-depth:', $.toc_depth),
    ),

    metakey_word: $ => choice(
      alias(':accent:', $.accent),
      alias(':citation-style:', $.citation_style),
      alias(':lang:', $.lang),
      alias(':numbering:', $.numbering),
      alias(':orientation:', $.orientation),
      alias(':typography:', $.typography),
      alias(':view:', $.view),
    ),

    metakey_date: $ => choice(
      alias(':override-date:', $.override_date),
    ),

    // It is important that comment appears at the end so that other rules will be
    // given automatic precedence.  Note this is not possible by simply using prec()
    // since the (/.*/) part of a comment will match anything and tree-sitter pays
    // attentions to the length of matches to determine precedence.
    comment: $ => token(seq('%', /.*/)),

  }
});
