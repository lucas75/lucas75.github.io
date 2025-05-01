/*
  This simulates the bibliographic database user data
*/
BIBLIO = {}

BIBLIO.DB = [
  {
    "id": "DoeJohn2003",
    "year": 2003,
    "author": "DOE, J.",
    "title": "Example Title"
  },
  {
    "id": "SousaBrito2023a",
    "year": 2003,
    "author": "SOUSA-BRITO, L.",
    "title": "Example Title"
  },
  {                               
    "id": "SousaBrito2023b",
    "year": 2003,
    "author": "SOUSA-BRITO, L.",
    "title": "Example Title 2"
  },
];

BIBLIO.Get = ( id ) => {
  for(const row of BIBLIO.DB) {
    if( row.id == id ) {
      return row;
    }   
  }
  return null;
}

/*
  This simulates the bibliographic database supported styles 
*/
STYLES = {}
STYLES.DB  = [
  { 
    "id": "num", 
    "desc": "Numeração Sequencial",
    "supportedPlacements": ["Numeric"],
    "format": (Biblio,ExtraParameters,DuplicateResolutionSeq, Placement) => { 
      return { 
        "FormattedLabel": "[" + DuplicateResolutionSeq + "]",
        "FormattedIndexEntry": "["+DuplicateResolutionSeq+"] " + Biblio.author+";"+ Biblio.year+";"+Biblio.title+" (...)",
        "DuplicateResolutionKey": Biblio.id,
        "SortKey": Biblio.author + " ("+Biblio.year+")",
        "Placement": "Numeric",
        "SupportedPlacements": ["Numeric"]
      }; 
    }
  },
  { 
    "id": "authoryear", 
    "desc": "Author (Year, params)",
    "supportedPlacements": ["OnLine","Parenthesized"],
    "format": (Biblio,ExtraParameters,DuplicateResolutionSeq, Placement) => { 
      if( !Placement ) Placement = "OnLine"
      if( Placement == "Parenthesized") {
        return { 
          "FormattedLabel": "(" + Biblio.author +"; "+ Biblio.year+(DuplicateResolutionSeq>0?String.fromCharCode(64+DuplicateResolutionSeq):"")+", " + ExtraParameters+")",
          "FormattedIndexEntry": Biblio.author+";"+ Biblio.year+";"+Biblio.title+" (...)",
          "DuplicateResolutionKey": Biblio.author + " ("+Biblio.year+")",
          "SortKey": Biblio.author + " ("+Biblio.year+")",
          "Placement": "Parenthesized",
          "SupportedPlacements": ["OnLine","Parenthesized"]
        }; 
      }
      else if( Placement == "OnLine" ) {
        return { 
          "FormattedLabel": Biblio.author + " ("+Biblio.year+(DuplicateResolutionSeq>0?String.fromCharCode(64+DuplicateResolutionSeq):"")+", " + ExtraParameters+")",
          "FormattedIndexEntry": Biblio.author+";"+ Biblio.year+";"+Biblio.title+" (...)",
          "DuplicateResolutionKey": Biblio.author + " ("+Biblio.year+")",
          "SortKey": Biblio.author + " ("+Biblio.year+")",
          "Placement": "OnLine",
          "SupportedPlacements": ["OnLine","Parenthesized"]
        }; 
      }
    }
  }
]

STYLES.Get = ( id ) => {
  for(const row of STYLES.DB) {
    if( row.id == id ) {      
      return row;
    }
  }
  return null;
}

function ParameterParser(Request) {
  if( typeof Request != "object" || Request === null ) { throw new Error('The parameter must be a JSON object' ); }
  this.Request = Request;
}
ParameterParser.prototype.removeOptionalParam = function(Name,Default) {
  var Result = this.Request[Name]; delete this.Request[Name];
  if( Result === null ) Result = Default;
  return Result;
}
ParameterParser.prototype.removeRequiredParam = function (Name) {
  var Result = this.Request[Name]; delete this.Request[Name];
  if( Result === null ) { throw new Error('Request Parameter '+Name+' is required' )};
  return Result;
}
ParameterParser.prototype.close = function() {
  keys = Object.keys(this.Request)
  if( keys.length != 0 ) { throw new Error('Extra variables in request: ' + keys ); }
}


API = {}

API.ListStyles = (Req) => {  
  Req = new ParameterParser(Req);
  var ReqTextFilter = Req.removeOptionalParam("TextFilter","");
  Req.close();

  console.debug("API.ListStyles TextFilter="+ReqBiblioStyleTextFilter)

  var result = []
  for( row of STYLES.DB ) {
    if( !ReqTextFilter || row.id.indexOf(ReqTextFilter) !== -1 || row.desc.indexOf(ReqTextFilter) !== -1 ) {
      result.push( { "StyleId": row.id, "StyleDesc": row.desc } )
    }
  };
  return result;
}

API.ListReferences = (Req) => {
  Req = new ParameterParser(Req);
  var ReqTextFilter = Req.removeRequiredParam('TextFilter','');
  var ReqStyle = Req.removeRequiredParam('Style');
  Req.close();

  var TheStyle = STYLES.Get( ReqStyle );

  var result = {
    "references": [],
    "placements": TheStyle.supportedPlacements,
    "add_entry": "http://example.com/lucas75/biblio/add_form",
    "edit_entry": "http://example.com/lucas75/biblio/edit_form"
  };

  console.debug("API.ListReferences Style="+ReqStyle+"; TextFilter="+ReqTextFilter  )

  for( const row of BIBLIO.DB ) {    
    // make a searchable line (dummy way, it is a prototype)
    var ReferenceText = JSON.stringify(row);        
    // include in the response any reference that have the 
    if( !ReqTextFilter || ReferenceText.indexOf(ReqTextFilter) !== -1 ) {
      result.references.push({
        "RefId": row.id,
        "RefDesc": row.author + "; " + row.year + ";" + row.title                
      });
    }
  };

  console.debug("Response:" + JSON.stringify(result));

  return result;
}

API.Format = (Req) => {
  
  Req = new ParameterParser(Req);
  var ReqBiblioStyle = Req.removeRequiredParam('Style')
  var ReqRefId = Req.removeRequiredParam('RefId')
  var ReqDuplResSeq = Req.removeRequiredParam('DuplResSeq')
  var ReqPlacement = Req.removeRequiredParam('Placement')
  var ReqExtraParameters = Req.removeRequiredParam('ExtraParameters')
  Req.close();

  console.debug("API.Format Style="+ReqBiblioStyle+"; RefId="+ReqRefId+"; DuplResSeq="+ReqDuplResSeq+"; Placement="+ReqPlacement+ "; ExtraParameters=" + ReqExtraParameters )

  var style = STYLES.Get(ReqBiblioStyle);     if( style == null ) throw new Error( "Style '"+ReqBiblioStyle+' is unknown');
  var biblio = BIBLIO.Get(ReqRefId);          if( biblio == null ) throw new Error( "Biblio '"+ReqRefId+' not found at this source');
  
  var result = style.format(biblio,ReqExtraParameters,ReqDuplResSeq,ReqPlacement);
  
  console.debug("Response:" + JSON.stringify(result));
  
  return result;
}

DIALOG = {}

DIALOG.NotImplemented = () => {
  alert('Not implemented! This is only a preliminary prototype')
}

DIALOG.Refresh = () => {

  var RefId = DIALOG.SourceId;
  var Placement = document.getElementById('Placement').value
  
  
  if( Placement == "Manual" ) {

    var fmt = API.Format({
      "Style":DOC.CurrentBibliographicStyle,
      "RefId":RefId,
      "DuplResSeq":0,
      "ExtraParameters":document.getElementById('ExtraParameters').value,
      "Placement":"" /** TO FILL THE PLACEMENT COMBO */
    })  
    
    var PlacementOptions = "<option value='Manual'>Manual</option>";
    for( const PlacementOption of fmt.SupportedPlacements ) {
      PlacementOptions += "<option value='"+PlacementOption+"'>"+PlacementOption+"</option>"
    }
    document.getElementById('Placement').disabled = false;
    document.getElementById('Placement').innerHTML = PlacementOptions;
    document.getElementById('Placement').value = 'Manual'  

    if( !document.getElementById('FormattedLabel').value )
      document.getElementById('FormattedLabel').value = fmt.FormattedLabel;
    document.getElementById('FormattedLabel').disabled = false;
    
    if( !document.getElementById('FormattedIndexEntry').value )
      document.getElementById('FormattedIndexEntry').value = fmt.FormattedIndexEntry;

    document.getElementById('FormattedIndexEntry').disabled = false;  
    document.getElementById('ExtraParameters').disabled = true;

  }
  else {

    var fmt = API.Format({
      "Style":DOC.CurrentBibliographicStyle,
      "RefId":RefId,
      "DuplResSeq":0,
      "ExtraParameters":document.getElementById('ExtraParameters').value,
      "Placement":Placement
    })  

    if( !fmt ) {
      var fmt = API.Format({
        "Style":DOC.CurrentBibliographicStyle,
        "RefId":RefId,
        "DuplResSeq":0,
        "ExtraParameters":document.getElementById('ExtraParameters').value,
        "Placement":""
      })  
    }
  
    var PlacementOptions = "<option value='Manual'>Manual</option>";
    for( const PlacementOption of fmt.SupportedPlacements ) {
      PlacementOptions += "<option value='"+PlacementOption+"'>"+PlacementOption+"</option>"
    }

    document.getElementById('Placement').disabled = false;
    document.getElementById('Placement').innerHTML = PlacementOptions;
    document.getElementById('Placement').value = fmt.Placement  

    document.getElementById('FormattedLabel').value = fmt.FormattedLabel;
    document.getElementById('FormattedLabel').disabled = true;
    document.getElementById('FormattedIndexEntry').value = fmt.FormattedIndexEntry;
    document.getElementById('FormattedIndexEntry').disabled = true;  
    document.getElementById('ExtraParameters').disabled = false;
    
  }
}




DIALOG.SelectReference = (RefId,ComboOption) => {    
  
  DIALOG.SourceId = RefId;
  document.getElementById('Source').value = ComboOption.innerHTML;
  document.getElementById('Placement').value = ""
  DIALOG.Refresh();
}

DIALOG.ChangeExtraParametes = () => {
  DIALOG.Refresh()  
}

DIALOG.ComboSearch = (comboEl) => {
  var opt = document.getElementById('comboOptions')
  opt.innerHTML = '';
  if( opt.style.visibility == 'visible') {
    opt.style.visibility = 'hidden' 
    return;
  }
  else {
    opt.style.visibility = 'visible'            
    opt.style.width = comboEl.getBoundingClientRect().width + 'px';
    opt.style.height = '300px'
    opt.style.left = comboEl.getBoundingClientRect().left + 'px';
    opt.style.top = comboEl.getBoundingClientRect().top + comboEl.getBoundingClientRect().height + 'px';
    opt.style.background = 'white';
  }


  var list = API.ListReferences({
    "Style":DOC.CurrentBibliographicStyle,
    "TextFilter":comboEl.value
  });       
   
  opt.innerHTML = '';
  opt.innerHTML += '<div onclick="DIALOG.NotImplemented();">New from this document</div>';
  opt.innerHTML += '<div onclick="DIALOG.NotImplemented();">New from @MyBiblio</div>';
  
  list.references.forEach(row => {
    opt.innerHTML += '<div onclick="DIALOG.SelectReference(\''+row.RefId+'\',this); document.getElementById(\'comboOptions\').style.visibility=\'hidden\'">' + row.RefId + ' - ' + row.RefDesc + '</div>';                             
  });  
}

DOC = {}
DOC.CurrentBibliographicStyle = 'authoryear'

DOC.ChangeStyle = (NewStyle) => {
  DOC.CurrentBibliographicStyle=NewStyle
  DIALOG.Refresh()
}


RESOLUTION = {}




RESOLUTION.Add = (Request) => {
  Request = new ParameterParser(Request);
  var ReqBiblioId = Request.removeRequiredParam('BiblioId');
  var ReqDuplResolutionKey = Request.removeRequiredParam('DuplResKey');
  Request.close();
  
  var comentario = "";

  if( !RESOLUTION.Data[ReqDuplResolutionKey] ) {
    RESOLUTION.Data[ReqDuplResolutionKey] = {
      "count": 0,
      "biblio": {}
    }
  }
  if( !RESOLUTION.Data[ReqDuplResolutionKey]["biblio"][ReqBiblioId] ) {
    RESOLUTION.Data[ReqDuplResolutionKey]["count"]++;
    RESOLUTION.Data[ReqDuplResolutionKey]["biblio"][ReqBiblioId] = RESOLUTION.Data[ReqDuplResolutionKey]["count"];    
    if( RESOLUTION.Data[ReqDuplResolutionKey]["count"] > 1) {
      comentario += "conflict resolution..."
      if( !RESOLUTION.Data["_conflict"].includes(ReqDuplResolutionKey ) ) RESOLUTION.Data["_conflict"].push(ReqDuplResolutionKey)
    }
    else {
      comentario += "1st usage!"
    }
  }
  else {
    comentario += "2nd+ usage!"
  }

  var table = document.getElementById('RESOLUTION');
  var tableBody = table.getElementsByTagName('tbody')[0];

  var newRow = tableBody.insertRow();
  newRow.resSeq = RESOLUTION.Data[ReqDuplResolutionKey]["biblio"][ReqBiblioId];
  newRow.refId = ReqBiblioId
  var cell = newRow.insertCell(); cell.innerHTML = ReqBiblioId;
  var cell = newRow.insertCell(); cell.innerHTML = ReqDuplResolutionKey;
  var cell = newRow.insertCell(); cell.innerHTML = "0";
  var cell = newRow.insertCell(); cell.innerHTML = "";
  var cell = newRow.insertCell(); cell.innerHTML = comentario;
  
   console.debug(RESOLUTION.Data)

  for( row of tableBody.getElementsByTagName('tr') ) {
    var rowDuplSeq = 0
    var rowRefId = row.getElementsByTagName('td')[1].innerHTML;
    var rowDuplResKey = row.getElementsByTagName('td')[1].innerHTML;
    if( !RESOLUTION.Data["_conflict"].includes(rowDuplResKey) ) {
      row.getElementsByTagName('td')[2].innerHTML = '0'
    }
    else {
      row.getElementsByTagName('td')[2].innerHTML = row.resSeq
      var rowDuplSeq = row.resSeq
    }

    var fmt = API.Format({
      "Style":DOC.CurrentBibliographicStyle,
      "RefId":row.refId,
      "DuplResSeq":rowDuplSeq,
      "ExtraParameters":"p.10",
      "Placement":""
    })
    row.getElementsByTagName('td')[3].innerHTML = fmt.FormattedLabel;

  }
}

RESOLUTION.Animation1Steps = [
  ["SousaBrito2023a","SOUSA-BRITO, 2023"],
  ["SousaBrito2023a","SOUSA-BRITO, 2023"],
  ["SousaBrito2023b","SOUSA-BRITO, 2023"],
  ["DoeJohn2003","DOE, 2003"],
  ["SousaBrito2023b","SOUSA-BRITO, 2023"],
  ["SousaBrito2023a","SOUSA-BRITO, 2023"],
  ["DoeJohn2003","DOE, 2003"],
]

RESOLUTION.Animation2Steps = [
  ["SousaBrito2023a","num"],
  ["SousaBrito2023a","num"],
  ["SousaBrito2023b","num"],
  ["DoeJohn2003","num"],
  ["SousaBrito2023b","num"],
  ["SousaBrito2023a","num"],
  ["DoeJohn2003","num"],
]

RESOLUTION.Play = (Steps) => {
  RESOLUTION.Data = {
    "_conflict": []
  }
  if( RESOLUTION.Interval ) {
    clearInterval(RESOLUTION.Interval)
  }
  
  var table = document.getElementById('RESOLUTION');
  var tableBody = table.getElementsByTagName('tbody')[0];
  tableBody.innerHTML = "";

  RESOLUTION.AnimationStep = 0;
  RESOLUTION.Interval = setInterval(RESOLUTION.PlayAnimate,1000,Steps);
}
RESOLUTION.PlayAnimate = (Steps) => {

  if( RESOLUTION.AnimationStep >= Steps.length ) {
    if( RESOLUTION.Interval ) {
      clearInterval(RESOLUTION.Interval)
      RESOLUTION.Interval = 0
    } 
    return;
  }

  var Step = Steps[RESOLUTION.AnimationStep];
  RESOLUTION.Add({
    'BiblioId': Step[0],
    'DuplResKey': Step[1]
  });

  RESOLUTION.AnimationStep++;
}