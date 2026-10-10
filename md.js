// Küçük ve güvenli Markdown -> HTML dönüştürücü.
// Önce tüm metin HTML'e kaçırılır (escape), sonra güvenli etiketler eklenir;
// bu yüzden model çıktısındaki ham HTML asla çalışmaz. Sadece http(s) bağlantılara izin verilir.
(function (root) {
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function inline(text) {
    const codes = [];
    text = text.replace(/`([^`\n]+)`/g, function (_, c) {
      codes.push(c);
      return '\u0000' + (codes.length - 1) + '\u0000';
    });
    text = esc(text);
    text = text.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, t, u) {
      return '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + t + '</a>';
    });
    text = text.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(^|[^\w])__([^_\n]+?)__(?=[^\w]|$)/g, '$1<strong>$2</strong>');
    text = text.replace(/(^|[^*])\*([^*\s][^*\n]*?)\*(?!\*)/g, '$1<em>$2</em>');
    text = text.replace(/(^|\s)_([^_\s][^_\n]*?)_(?=\s|$|[.,;:!?)])/g, '$1<em>$2</em>');
    text = text.replace(/~~([^~\n]+?)~~/g, '<del>$1</del>');
    text = text.replace(/\u0000(\d+)\u0000/g, function (_, i) {
      return '<code>' + esc(codes[Number(i)]) + '</code>';
    });
    return text;
  }

  const RE_FENCE = /^\s*```\s*([\w+#.-]*)\s*$/;
  const RE_FENCE_END = /^\s*```\s*$/;
  const RE_HEADING = /^(#{1,6})\s+(.*)$/;
  const RE_HR = /^\s*([-*_])(\s*\1){2,}\s*$/;
  const RE_QUOTE = /^\s*>\s?/;
  const RE_UL = /^(\s*)([-*+])\s+(.*)$/;
  const RE_OL = /^(\s*)(\d+)[.)]\s+(.*)$/;
  const RE_TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

  function isListLine(l) {
    return RE_UL.test(l) || RE_OL.test(l);
  }

  function isTableStart(lines, i) {
    return (
      lines[i].indexOf('|') !== -1 &&
      i + 1 < lines.length &&
      lines[i + 1].indexOf('-') !== -1 &&
      RE_TABLE_SEP.test(lines[i + 1])
    );
  }

  function splitRow(line) {
    let s = line.trim();
    if (s.charAt(0) === '|') s = s.slice(1);
    if (s.charAt(s.length - 1) === '|') s = s.slice(0, -1);
    return s.split('|').map(function (c) { return c.trim(); });
  }

  function startsBlock(lines, i) {
    const l = lines[i];
    return (
      RE_FENCE.test(l) ||
      RE_HEADING.test(l) ||
      RE_HR.test(l) ||
      RE_QUOTE.test(l) ||
      isListLine(l) ||
      isTableStart(lines, i)
    );
  }

  function renderList(items) {
    let html = '';
    const stack = [];
    items.forEach(function (it) {
      const tag = it.ordered ? 'ol' : 'ul';
      while (stack.length && it.indent < stack[stack.length - 1].indent) {
        html += '</li></' + stack.pop().tag + '>';
      }
      if (stack.length && it.indent === stack[stack.length - 1].indent) {
        html += '</li>';
        if (stack[stack.length - 1].tag !== tag) {
          html += '</' + stack.pop().tag + '><' + tag + '>';
          stack.push({ indent: it.indent, tag: tag });
        }
      } else {
        html += '<' + tag + '>';
        stack.push({ indent: it.indent, tag: tag });
      }
      html += '<li>' + inline(it.text);
    });
    while (stack.length) html += '</li></' + stack.pop().tag + '>';
    return html;
  }

  function render(src) {
    const lines = String(src == null ? '' : src).replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      let m;

      // Kod bloğu (akış sırasında kapanmamış olabilir; sonuna kadar kod say)
      if ((m = RE_FENCE.exec(line))) {
        const buf = [];
        i++;
        while (i < lines.length && !RE_FENCE_END.test(lines[i])) {
          buf.push(lines[i]);
          i++;
        }
        i++;
        out.push(
          '<pre><code' + (m[1] ? ' data-lang="' + esc(m[1]) + '"' : '') + '>' +
            esc(buf.join('\n')) + '</code></pre>'
        );
        continue;
      }

      if (/^\s*$/.test(line)) { i++; continue; }

      if ((m = RE_HEADING.exec(line))) {
        const lvl = Math.min(m[1].length + 2, 6);
        out.push('<h' + lvl + '>' + inline(m[2].replace(/\s+#+\s*$/, '')) + '</h' + lvl + '>');
        i++;
        continue;
      }

      if (RE_HR.test(line)) { out.push('<hr>'); i++; continue; }

      if (RE_QUOTE.test(line)) {
        const buf = [];
        while (i < lines.length && RE_QUOTE.test(lines[i])) {
          buf.push(lines[i].replace(RE_QUOTE, ''));
          i++;
        }
        out.push('<blockquote>' + render(buf.join('\n')) + '</blockquote>');
        continue;
      }

      if (isTableStart(lines, i)) {
        const head = splitRow(lines[i]);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].indexOf('|') !== -1 && !/^\s*$/.test(lines[i])) {
          rows.push(splitRow(lines[i]));
          i++;
        }
        let t = '<div class="tbl"><table><thead><tr>';
        head.forEach(function (c) { t += '<th>' + inline(c) + '</th>'; });
        t += '</tr></thead><tbody>';
        rows.forEach(function (r) {
          t += '<tr>';
          for (let k = 0; k < head.length; k++) t += '<td>' + inline(r[k] || '') + '</td>';
          t += '</tr>';
        });
        t += '</tbody></table></div>';
        out.push(t);
        continue;
      }

      if (isListLine(line)) {
        const items = [];
        while (i < lines.length) {
          const l = lines[i];
          let lm;
          if ((lm = RE_UL.exec(l))) {
            items.push({ indent: lm[1].replace(/\t/g, '    ').length, ordered: false, text: lm[3] });
          } else if ((lm = RE_OL.exec(l))) {
            items.push({ indent: lm[1].replace(/\t/g, '    ').length, ordered: true, text: lm[3] });
          } else if (/^\s+\S/.test(l) && items.length && !RE_FENCE.test(l)) {
            items[items.length - 1].text += ' ' + l.trim();
          } else if (/^\s*$/.test(l) && i + 1 < lines.length && isListLine(lines[i + 1])) {
            // listeler arasındaki tek boş satır listeyi bölmesin
          } else {
            break;
          }
          i++;
        }
        out.push(renderList(items));
        continue;
      }

      // Paragraf
      const buf = [line];
      i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !startsBlock(lines, i)) {
        buf.push(lines[i]);
        i++;
      }
      out.push('<p>' + buf.map(inline).join('<br>') + '</p>');
    }

    return out.join('');
  }

  root.__pageAskMd = render;
  if (typeof module !== 'undefined' && module.exports) module.exports = render;
})(typeof self !== 'undefined' ? self : this);
