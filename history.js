function hrow(tableTagsArray, title) {
  tableTagsArray.push('<tr style="background-color: #f9f9f9"><td colspan="3"><b>');
  tableTagsArray.push(title);
  tableTagsArray.push('</b></td></tr>');
}

function row(tableTagsArray, date, url, ver, desc) {
  tableTagsArray.push('<tr>');
  tableTagsArray.push('<td><a href="' + url + '">' + date + '</a></td>');
  tableTagsArray.push('<td>' + ver + '</td>');
  tableTagsArray.push('<td>' + desc + '</td>');
  tableTagsArray.push('</tr>');
}
  
function buildDataTable(dataList, curl, dataContainer) {
  var tableTagsArray = [
      '<table>',
      '<thead><tr style="background-color: #efefef">',
          '<th width="100px">Date</th>',
          '<th width="100px">Version</th>',
          '<th>Description</th>',
      '</tr></thead><tbody>'
  ];

  hrow(tableTagsArray, "Current Versions");
  var ci = null;
  // first pass: any versions labelled current + ci-build
  for (var historyNode in dataList) {
    if (dataList.hasOwnProperty(historyNode)) {
      var element = dataList[historyNode];
      if (element.status == 'ci-build') {
        ci = element.path;
      } else if (element.current) {
        row(tableTagsArray, element.date, curl, element.version, element.desc);
      }
    }
  }
  if (ci) {
    row(tableTagsArray, '(current)', ci, '(last commit)', 'Continuous Integration Build (latest in version control)');
  }
  
  var seq = "!!";
  
  // second pass: all versions, with sequence tag
  for (var historyNode in dataList) {
    if (dataList.hasOwnProperty(historyNode)) {
      var element = dataList[historyNode];
      if (element.status != 'ci-build') {
        if (element.sequence != seq) {
          seq = element.sequence;
          hrow(tableTagsArray, seq+' Sequence');
        }
        row(tableTagsArray, element.date, element.path, element.version, element.desc);
      }
    }
  }
          
  tableTagsArray.push('</tbody></table>');
  dataContainer.innerHTML = tableTagsArray.join('');
}

function processIntro(md) {
  var reader = new commonmark.Parser();
  var writer = new commonmark.HtmlRenderer();
  var parsed = reader.parse(md); 
  var result = writer.render(parsed); 
  document.getElementById('intro').innerHTML = result;
}

function loadHistory(url) {
 fetch(url).then(function (response) {
    return response.json();
 }).then(function (historyJson) {
    document.title = historyJson.title;
    document.getElementById('ig-title').innerHTML = historyJson.title;
    document.getElementById('ig-footer').innerHTML = historyJson.title;
    if (historyJson.introduction) {
      processIntro(historyJson.introduction);
    }

    var dataContainer = document.getElementById('history-data');
    buildDataTable(historyJson.list, historyJson.canonical, dataContainer);

  });
}
