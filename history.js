function buildDataTable(dataList, dataContainer) {
var tableTagsArray = [
    '<table>',
    '<thead><tr>',
        '<th>Date</th>',
        '<th>Version</th>',
        '<th>Description</th>',
    '</tr></thead><tbody>'
];

for (var historyNode in dataList) {
    if (dataList.hasOwnProperty(historyNode)) {
        var element = dataList[historyNode];
        tableTagsArray.push('<tr>');

        tableTagsArray.push('<td><a href="' + element.path + '">' + element.date + '</a></td>');
        tableTagsArray.push('<td>' + element.version + '</td>');
        tableTagsArray.push('<td>' + element.desc + '</td>');

        tableTagsArray.push('</tr>');
    }
}
        
tableTagsArray.push('</tbody></table>');
dataContainer.innerHTML = tableTagsArray.join('');
}


fetch('http://hl7.org/fhir/us/core/package-list.json')
.then(function (response) {
    return response.json();
})
.then(function (historyJson) {
    var dataContainer = document.getElementById('history-data');

    buildDataTable(historyJson.list, dataContainer);
});
