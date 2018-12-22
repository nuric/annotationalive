// Document Javascript Functions
// Basic tab functionality
function openTab(tabid) {
    var tabs = document.getElementsByClassName("tab");
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].style.display = "none"; 
    }
    document.getElementById(tabid).style.display = "block"; 
}

// Print functionality
// https://stackoverflow.com/questions/12997123/print-specific-part-of-webpage
function elementPrint(id) {
  var prtContent = document.getElementById(id);
  var WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
  WinPrint.document.write('<html><head>');
  WinPrint.document.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/2.10.0/github-markdown.min.css" integrity="sha256-Ndk1ry+oGNFEaXt4kxlW/SYLbxat1O0DhaDd+lob0SY=" crossorigin="anonymous" />');
  WinPrint.document.write('<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.13.1/styles/github.min.css">');
  WinPrint.document.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.10.0/katex.min.css" integrity="sha256-BZ71u1P7NUocEN9mKkcAovn3q5JPm/r9xVyjWh/Kqrc=" crossorigin="anonymous" />');
  WinPrint.document.write('</head><body class="markdown-body">');
  WinPrint.document.write(prtContent.innerHTML);
  // Standard printing gives blank page, we need to wait for window to render
  WinPrint.document.write("</body>\x3Cscript>window.onload = window.print;\x3C/script></html>");
  WinPrint.document.close();
  WinPrint.focus();
  //WinPrint.print();
  //WinPrint.close();
}

// Markdown renderer
const md = markdownit({
  // Syntax highligthing
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }

    return ''; // use external default escaping
  }
});

// Katex math support
(function() {
// Default katex options
kopts = { displayMode: true };
// Setup rendering rules
const defaultRender = md.renderer.rules.text,
      blockmathRE   = /\$\$[^\$]*\$\$/g,
      inlinemathRE  = /\$[^\$]*\$/g;
// Override default rendering function
md.renderer.rules.text = function (tokens, idx, options, env, self) {
  var content = tokens[idx].content;
  // Check for block math first
  if (blockmathRE.test(content)) {
    return content.replace(blockmathRE, (s) => katex.renderToString(s.substring(2, s.length-2), kopts));
  }
  // Check for inline math
  if (inlinemathRE.test(content)) {
    return content.replace(inlinemathRE, (s) => katex.renderToString(s.substring(1, s.length-1)));
  }
  // pass token to default renderer.
  return defaultRender(tokens, idx, options, env, self);
};
})();

// Block math tokeniser
function math_block(state, start, end, silent) {
  const pos = state.bMarks[start] + state.tShift[start];
  // Check start condition
  if (pos + 2 > state.eMarks[start] || state.src[pos]!=='$' || state.src[pos+1]!=='$') { return false; }

  // Need to find where math block closes
  var lastLine = start-1, token, endi;
  do {
    lastLine += 1;
    endi = state.eMarks[lastLine];
    endi = state.skipSpacesBack(endi, 0);
    if (endi < 1) { return false; }
  } while(state.src[endi]!=='$' && state.src[endi-1]!=='$')
  
  // No idea what this silent business is for
  if (silent) { return true; }

  state.line = lastLine + 1;
  token = state.push('math_block', 'p', 0);
  token.content = state.getLines(start, state.line, state.tShift[start], false).replace(/\$\$/g, '');
  token.map = [ start, state.line ];
  token.markup = '$$';
  return true;
}
md.block.ruler.before('paragraph', 'math_block', math_block);

// Inline math tokeniser
function math_inline(state, silent) {
  var start, max, marker, matchStart, matchEnd, token,
      pos = state.pos;
  // Check start condition
  if (state.src[pos] !== '$') { return false; }

  // Find ending point
  start = pos;
  pos++;
  max = state.posMax;
  while (pos < max && state.src[pos] === '$') { pos++; }

  marker = state.src.slice(start, pos);

  matchStart = matchEnd = pos;
  while ((matchStart = state.src.indexOf('$', matchEnd)) !== -1) {
    matchEnd = matchStart + 1;
    while (matchEnd < max && state.src[matchEnd] === '$') { matchEnd++; }
    if (matchEnd - matchStart === marker.length) {
      if (!silent) {
        token         = state.push('math_inline', 'span', 0);
        token.markup  = marker;
        token.content = state.src.slice(pos, matchStart)
                                 .replace(/[ \n]+/g, ' ')
                                 .trim();
      }
      state.pos = matchEnd;
      return true;
    }
  }

  if (!silent) { state.pending += marker; }
  state.pos += marker.length;
  return true;
}
md.inline.ruler.after('escape', 'math_inline', math_inline);
