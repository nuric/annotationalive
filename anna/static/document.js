// Document Javascript Functions
// Basic tab functionality
function openTab(tabid) {
    var tabs = document.getElementsByClassName("tab");
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].style.display = "none"; 
    }
    document.getElementById(tabid).style.display = "block"; 
}

function toggleDisplay(elid) {
  var el = document.getElementById(elid);
  el.style.display = el.style.display == "none" ? "block" : "none";
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

// Speech to Text
if ('webkitSpeechRecognition' in window) {
  const btn_voice_id = 'btn_voice';
  const textarea_id = 'md_textarea';
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true; // causes lag at the end
  let recognizing = false,
      ignore_onend = false,
      leftText = "",
      rightText = "",
      final_transcript = "";

  recognition.onstart = function() {
    recognizing = true;
    document.getElementById(btn_voice_id).classList.add("w3-red");
    console.log('stt_speak_now');
  };

  recognition.onerror = function(event) {
    if (event.error == 'no-speech') {
      console.log('stt_no_speech');
    }
    if (event.error == 'audio-capture') {
      console.log('stt_no_microphone');
    }
    if (event.error == 'not-allowed') {
      console.log('stt_not_allowed');
    }
    ignore_onend = true;
  };

  recognition.onend = function() {
    recognizing = false;
    document.getElementById(btn_voice_id).classList.remove("w3-red");
    var tarea = document.getElementById(textarea_id);
    tarea.selectionStart = tarea.selectionEnd = leftText.length + final_transcript.length;
    tarea.focus();
    if (ignore_onend) {
      return;
    }
    console.log("stt_end");
  };

  recognition.onresult = function(event) {
    var interim_transcript = '';
    if (typeof(event.results) == 'undefined') {
      recognition.onend = null;
      recognition.stop();
      return;
    }
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript += event.results[i][0].transcript;
      } else {
        interim_transcript += event.results[i][0].transcript;
      }
    }
    final_transcript = final_transcript.replace(/\S/, c => c.toUpperCase())
    if (final_transcript || interim_transcript) {
      docapp.content = leftText + final_transcript + interim_transcript + rightText;
    }
  };

  function toggleSTT() {
    if (recognizing) {
      recognition.stop();
      return;
    }
    // Clear old recognition and start listening
    var tarea = document.getElementById(textarea_id);
    leftText = tarea.value.substring(0, tarea.selectionStart);
    rightText = tarea.value.substring(tarea.selectionEnd, tarea.value.length);
    final_transcript = "";
    recognition.lang = "en-GB";
    recognition.start();
  }
} // End of if ('webkitSpeechRecognition' in window) {

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
    if (endi < 1 || lastLine == state.eMarks.length-1) { return false; }
  } while(endi <= pos + 2 || (state.src[endi]!=='$' && state.src[endi-1]!=='$'))
  
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

// Rendering HTML blobs
function renderHTML(content) {
  const el = IncrementalDOM.elementOpen('html-blob');
  if (el.__cachedInnerHtml !== content) {
    el.__cachedInnerHtml = content;
    el.innerHTML = content;
  }
  IncrementalDOM.skip()
  IncrementalDOM.elementClose('html-blob');
}
// Render token tag with content
function renderInline(tokens, idx) {
  var args = tokens[idx].attrs ? tokens[idx].attrs.flat() : [];
  IncrementalDOM.elementOpen(tokens[idx].tag, null, null, ...args);
  IncrementalDOM.text(tokens[idx].content);
  IncrementalDOM.elementClose(tokens[idx].tag);
}
const rules = {
  code_inline: renderInline,
  code_block: function(tokens, idx) {
    IncrementalDOM.elementOpen('pre');
    renderInline(tokens, idx);
    IncrementalDOM.elementClose('pre');
  },
  math_block: function(tokens, idx) {
    renderHTML(katex.renderToString(tokens[idx].content, { displayMode: true }));
  },
  math_inline: function(tokens, idx) {
    renderHTML(katex.renderToString(tokens[idx].content));
  },
  fence: function(tokens, idx) {
    IncrementalDOM.elementOpen('pre');
    IncrementalDOM.elementOpen('code');
    var lang = tokens[idx].info ? tokens[idx].info.trim() : '';
    var content = md.options.highlight(tokens[idx].content, lang.split(/\s+/g)[0]); 
    if (content) { renderHTML(content); }
    else { IncrementalDOM.text(tokens[idx].content); }
    IncrementalDOM.elementClose('code');
    IncrementalDOM.elementClose('pre');
  },
  text: function(tokens, idx) {
    IncrementalDOM.text(tokens[idx].content);
  }
};

// Incremental DOM Renderer
function renderToken(tokens, idx) {
  var args = tokens[idx].attrs ? tokens[idx].attrs.flat() : [];
  switch (tokens[idx].nesting) {
    case 1:
      IncrementalDOM.elementOpen(tokens[idx].tag, null, null, ...args);
      break;
    case -1:
      IncrementalDOM.elementClose(tokens[idx].tag);
      break;
    default:
      IncrementalDOM.elementVoid(tokens[idx].tag, null, null, ...args);
  }
}

// Render to IncrementalDOM
function incDOMRender(data) {
  var i, token, count;
  const tokens = data.tokens,
        slide = data.slide || 0,
        depth = data.depth || 0,
        len = tokens.length;

  if (depth == 0) { IncrementalDOM.elementOpen('div', null, ['class', 'slide']); }
  for (i = 0, count = 0; i < len; i++) {
    token = tokens[i];
    // Check slide number
    if (token.type === 'hr') {
      count++;
      if (depth == 0) {
        IncrementalDOM.elementClose('div');
        IncrementalDOM.elementOpen('div', null, ['class', 'slide']);
      }
      if (slide > 0 && count == slide) { break; }
    }
    // Render tokens as usual
    if (token.type === 'inline') {
       incDOMRender({tokens: token.children, depth: depth+1});
    } else if (typeof rules[token.type] !== 'undefined') {
      rules[token.type](tokens, i);
    } else {
      renderToken(tokens, i);
    }
  }
  if (depth == 0) { IncrementalDOM.elementClose('div'); }
}

// Render and patch based on IncrementalDOM
function incrementalRender(tokens, slide=0) {
  var md_out = document.getElementById('md_out');
  IncrementalDOM.patch(md_out, incDOMRender, {tokens: tokens, slide: slide, depth: 0});
}
