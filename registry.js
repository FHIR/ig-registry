function th(tr, caption) {
  var th = document.createElement("th");
  th.innerHTML = caption;
  tr.appendChild(th);
}

function escapeHTML(s) {
  return s.replace('//&', '&amp;').replace('//<', '&lt;').replace('/ />', '&gt;');
}
let url = 'https://raw.githubusercontent.com/FHIR/ig-registry/master/fhir-ig-list.json';

function buildTable(data) {
  var e = document.getElementById('release-filter');
  var value = e.options[e.selectedIndex].value;
  e = document.getElementById('view-filter');
  if (e.checked)
    return buildTableNoDesc(data, value);
  else
    return buildTableDesc(data, value);
}

function buildTableDesc(data, release) {
  var table = document.createElement("table");
  table.setAttribute('id', 'content');
  var tr = table.insertRow(-1);
  th(tr, "Specification");
  th(tr, "Category");
  th(tr, "Authority");
  th(tr, "Editions");

  for (var i = 0; i < data.length; i++) {
    var g = data[i];
    tr = table.insertRow(-1);
    var tc = tr.insertCell(-1);
    if (g.history != null)
      tc.innerHTML = "<b><a href=\"" + g.canonical + "\" title=\"" + g['npm-name'] + "\">" + escapeHTML(g.name) + "<\/a><\/b> : " + escapeHTML(g.description);
    else
      tc.innerHTML = "<b>" + escapeHTML(g.name) + "<\/b> : " + escapeHTML(g.description);
    tc = tr.insertCell(-1);
    tc.innerHTML = escapeHTML(g.category);
    tc = tr.insertCell(-1);
    tc.innerHTML = escapeHTML(g.authority) + "\/" + escapeHTML(g.country);
    tc = tr.insertCell(-1);
    if (g.editions != null || g['ci-build'] != null) {
      var l = "<ul>";
      if (g.editions != null) {
        for (var ie = 0; ie < g.editions.length; ie++) {
          var e = g.editions[ie];
          if (release == 'any' || e['fhir-version'].startsWith(release)) {
             l = l + "<li><a href=\"" + e.url + "\">" + escapeHTML(e.name) + "<\/a> (" + e['ig-version'] + ")<\/li>";
          }
        }
      }
      if (g['ci-build'] != null && release == 'any') {
        l = l + "<li><a href=\"" + g['ci-build'] + "\">CI Build<\/a><\/li>";
      }
      tc.innerHTML = l + "<\/ul>";
    }
  }

  return table;
}

function buildTableNoDesc(data, release) {
  var table = document.createElement("table");
  table.setAttribute('id', 'content');
  var tr = table.insertRow(-1);
  th(tr, "Specification");
  th(tr, "Category");
  th(tr, "Package Id");
  th(tr, "Authority");
  th(tr, "Country");
  th(tr, "Links");

  for (var i = 0; i < data.length; i++) {
    var g = data[i];
    tr = table.insertRow(-1);
    var tc = tr.insertCell(-1);
    tc.innerHTML = "<a href=\"" + g.canonical + "\">" + escapeHTML(g.name) + "<\/a>";
    tc = tr.insertCell(-1);
    tc.innerHTML = escapeHTML(g.category);
    tc = tr.insertCell(-1);
    tc.innerHTML = escapeHTML(g['npm-name']);
    tc = tr.insertCell(-1);
    tc.innerHTML = escapeHTML(g.authority);
    tc = tr.insertCell(-1);
    tc.innerHTML = escapeHTML(g.country);
    tc = tr.insertCell(-1);
    if (g.editions != null || g['ci-build'] != null || g['history'] != null) {
      var l = "";
      if (g['history'] != null && release == 'any') {
        l = l + "| <a href=\"" + g['history'] + "\">History<\/a> ";
      }
      if (g.editions != null) {
        for (var ie = 0; ie < g.editions.length; ie++) {
          var e = g.editions[ie];
          if (release == 'any' || e['fhir-version'].startsWith(release)) {
            l = l + "| <a href=\"" + e.url + "\">" + escapeHTML(e['ig-version']) + "<\/a> ";
          }
        }
      }
      if (g['ci-build'] != null && release == 'any') {
        l = l + "| <a href=\"" + g['ci-build'] + "\">CI Build<\/a> ";
      }
      tc.innerHTML = l.substring(2);
    }
  }

  return table;
}

function applyFilter(list, ctrl, prop) {
  var e = document.getElementById(ctrl);
  var value = e.options[e.selectedIndex].value;
  if (value == 'any')
    return list;
  return list.filter(function(guide) {
    return guide[prop] === value;
  });
}

function applyReleaseFilter(list) {
  var e = document.getElementById('release-filter');
  var value = e.options[e.selectedIndex].value;
  if (value == 'any')
    return list;
  return list.filter(function(guide) {
    if (guide['editions'] == null) {
      return false;
    } else {
      return guide['editions'].filter(function(edition) {
        return edition['fhir-version'].startsWith(value);
      }).length > 0;
    }
  });
}

function applyTextFilter(list) {
  var e = document.getElementById('search-filter');
  var searchWord = e.value;
  if (searchWord.length < 2)
    return list;
  return list.filter(function(guide) {
    return guide.name.toLowerCase().indexOf(searchWord) != -1 || guide.description.toLowerCase().indexOf(searchWord) != -1;
  });
}

function applyFilters() {
  var list = guides;
  list = applyFilter(list, 'category-filter', 'category');
  list = applyFilter(list, 'authority-filter', 'authority');
  list = applyFilter(list, 'country-filter', 'country');
  list = applyReleaseFilter(list);
  list = applyTextFilter(list);
  return list;
}

function replaceContent(replacement) {
  var oldContent = document.getElementById('content');
  oldContent.parentNode.replaceChild(replacement, oldContent);
}

var guides = null;

function loadRegistry() {
  fetch(url)
   .then(function(response) { return response.json() })
   .then(function(out) {
      var properties = {
        categories: {},
        authorities: {},
        countries: {}
      };
      guides = out.guides;
      for (var i = 0; i < guides.length; i++) {
        var guide = guides[i];
        properties.categories[guide.category] = guide.category;
        properties.countries[guide.country] = guide.country;
        properties.authorities[guide.authority] = guide.authority;
      }

      var categoryOptions = '<select id="category-filter"><option value="any">Any</option>';
      var authorityOptions = '<select id="authority-filter"><option value="any">Any</option>';
      var countryOptions = '<select id="country-filter"><option value="any">Any</option>';
      var releaseOptions = '<select id="release-filter"><option value="any">Any</option><option value="4.0">R4</option><option value="3.0">R3</option><option value="1.0">R2</option></select>';

      for (var category in properties.categories) {
        if (properties.categories.hasOwnProperty(category)) {
          categoryOptions += '<option value="' + category + '">' + category + '</option>';
        }
      }

      categoryOptions += '</select>';

      for (var authority in properties.authorities) {
        if (properties.authorities.hasOwnProperty(authority)) {
          authorityOptions += '<option value="' + authority + '">' + authority + '</option>';
        }
      }
      authorityOptions += '</select>';

      for (var country in properties.countries) {
        if (properties.countries.hasOwnProperty(country)) {
          if (country == 'uv')
            countryOptions += '<option value="' + country + '">All</option>';
          else if (country == 'us')
            countryOptions += '<option value="' + country + '">USA</option>';
          else if (country == 'au')
            countryOptions += '<option value="' + country + '">Australia</option>';
          else if (country == 'ch')
            countryOptions += '<option value="' + country + '">Switzerland</option>';
          else if (country == 'de')
            countryOptions += '<option value="' + country + '">Germany</option>';
          else if (country == 'it')
            countryOptions += '<option value="' + country + '">Italy</option>';
          else if (country == 'dk')
            countryOptions += '<option value="' + country + '">Denmark</option>';
          else
            countryOptions += '<option value="' + country + '">' + country.toUpperCase() + '</option>';
        }
      }
      countryOptions += '</select>';

      var div = document.getElementById("data");
      var filtersHtml = '';

      filtersHtml = '<div id="filters">';
      filtersHtml += '<div class="form-element"><label for="search-filter">Search</label>';
      filtersHtml += '<input id="search-filter" type="text"/></div>';
      filtersHtml += '<div class="form-element"><label for="category-filter">Category</label>';
      filtersHtml += categoryOptions + '</div>';
      filtersHtml += '<div class="form-element"><label for="authority-filter">Authority</label>';
      filtersHtml += authorityOptions + '</div>';
      filtersHtml += '<div class="form-element"><label for="country-filter">Country</label>';
      filtersHtml += countryOptions + '</div>';
      filtersHtml += '<div class="form-element"><label for="country-filter">Release</label>';
      filtersHtml += releaseOptions + '</div>';
      filtersHtml += '<div id="view"><label for="view-filter">View</label><input id="view-filter" type="checkbox" name="desc"/> Hide Descriptions</div></div>';

      div.innerHTML = filtersHtml;

      var isFiltered = false;
      var filteredGuides = [];
      var allGuidesTable = buildTable(guides);
      div.appendChild(allGuidesTable);

      var searchFilter = document.getElementById('search-filter');
      searchFilter.addEventListener('input', function(event) {
        var selection = applyFilters();
        var table = buildTable(selection);
        replaceContent(table);
      })

      function dropdownFilterHandler(event) {
        var selection = applyFilters();
        var table = buildTable(selection);
        replaceContent(table);
      }

      var categoryFilter = document.getElementById('category-filter');
      categoryFilter.addEventListener('change', function(event) {
        dropdownFilterHandler(event);
      });

      var authorityFilter = document.getElementById('authority-filter');
      authorityFilter.addEventListener('change', function(event) {
        dropdownFilterHandler(event);
      });

      var countryFilter = document.getElementById('country-filter');
      countryFilter.addEventListener('change', function(event) {
        dropdownFilterHandler(event);
      })
      var releaseFilter = document.getElementById('release-filter');
      releaseFilter.addEventListener('change', function(event) {
        dropdownFilterHandler(event);
      })
      var viewFilter = document.getElementById('view-filter');
      viewFilter.addEventListener('change', function(event) {
        dropdownFilterHandler(event);
      })
    })
//    .catch(err => {
//      throw err
//    });
}