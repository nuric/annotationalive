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
