checkRegistry(source) {
  guides = JSON.parse(source);
  for (var i = 0; i < out.guides.length; i++) {
    var g = out.guides[i];
    if (g['npm-name'] == null)
      throw "A npm package name is required";
    if (g.name == null)
      throw "A name is required for guide "+g['npm-name'];
    if (g.category == null)
      throw "A category is required for guide "+g.name;
    if (g.description == null)
      throw "A description is required for guide "+g.name;
    if (g.authority == null)
      throw "An authority is required for guide "+g.name;
    if (g.country == null)
      throw "A country is required for guide "+g.name;
  }
  for (var i1 = 0; i1 < out.guides.length; i1++) {
    var g1 = out.guides[i1];
    for (var i2 = i1+1; i2 < out.guides.length; i2++) {
      var g2 = out.guides[i2];
      if (g1.name = g2.name)
        throw "The name '"+g1.name+"' is duplicated";
      if (g1['npm-name'] = g2['npm-name'])
        throw "The package name '"+g1['npm-name']+"' is duplicated";
    }
  }
}

