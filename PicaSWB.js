{
	"translatorID": "2edf7a1b-eded-48d7-ae11-7126fd1c1b07",
	"label": "PicaSWB",
	"creator": "Philipp Zumstein, Timotheus Kim",
	"target": "txt",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 2,
	"browserSupport": "gcs",
	"lastUpdated": "2018-06-13 18:28:00"
}


// Zotero Export Translator für das Pica Intern Format
// (wie es im SWB Verbund benutzt wird)


/*
	***** BEGIN LICENSE BLOCK *****
	Copyright © 2016 Philipp Zumstein
	This file is part of Zotero.
	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.
	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.
	***** END LICENSE BLOCK *****
*/

// Mapping tables that get populated with the entries from their corresponding map files in the Github repo
var issn_to_keyword_field = {};
var issn_to_language_code = {};
var issn_to_license = {};
var issn_to_physical_form = {};
var issn_to_ssg = {};
var issn_to_superior_ppn = {};
var issn_to_volume = {};
var language_to_language_code = {};
// Repository base URL
var zts_enhancement_repo_url = 'https://raw.githubusercontent.com/ubtue/zotero-enhancement-maps/master/';
var downloaded_map_files = 0;
var max_map_files = 8;


// ab hier Programmcode


var defaultSsgNummer = "1";
var defaultLanguage = "eng";
var lokaldatensatz = "\nE* l01\n7100$jn \n8002 ixzs;ixzo\n";

//item.type --> 0500 Bibliographische Gattung und Status
//http://swbtools.bsz-bw.de/winibwhelp/Liste_0500.htm
// TODO: check if the folowing 3 variables are being used correctly
var physicalForm = "";//0500 Position 1
var cataloguingStatus = "r";//0500 Position 3
var cataloguingStatusO = "r";//0500 Position 3
var licenceField = ""; // 0500 Position 4 only for Open Access Items; http://swbtools.bsz-bw.de/cgi-bin/help.pl?cmd=kat&val=4085&regelwerk=RDA&verbund=SWB
var SsgField = "";

function populateISSNMaps(mapData, url) {
    var mapFilename = url.substr(url.lastIndexOf("/") + 1);
    var temp = {};
    var lines = mapData.split('\n');

    for (i in lines) {
        var line = lines[i].split("#")[0].trim();
        if (line.length < 2)
            continue;

        var elements = line.split("=");
        if (elements.length != 2) {
            Z.debug("Line " + i + " in map file " + mapFilename + " has too many/few splits (" + elements.length + ")");
            Z.debug("Invalid line: " + line);
            continue;
        }

        switch (mapFilename) {
            case "ISSN_to_superior_ppn.map":
                temp[elements[0]] = "!" + elements[1] + "!";
                break;
            default:
                temp[elements[0]] = elements[1];
        }
    }

	if (temp.size == 0) {
		throw "Empty map file! This is unexpected";
	}

    switch (mapFilename) {
        case "ISSN_to_keyword_field.map":
            issn_to_keyword_field = temp;
            break;
        case "ISSN_to_language_code.map":
            issn_to_language_code = temp;
            break;
        case "ISSN_to_licence.map":
            issn_to_license = temp;
            break;
        case "ISSN_to_physical_form.map":
            issn_to_physical_form = temp;
            break;
        case "ISSN_to_SSG.map":
            issn_to_ssg = temp;
            break;
        case "ISSN_to_superior_ppn.map":
            issn_to_superior_ppn = temp;
            break;
        case "ISSN_to_volume.map":
            issn_to_volume = temp;
            break;
        case "language_to_language_code.map":
            language_to_language_code = temp;
            break;
        default:
            throw "Unknown map file: " + mapFilename;
    }

    downloaded_map_files += 1;
}

// Da alles asynchron ablaufen kann:
//Jede Lookup einer AutorIn zählt 1 zu count
//und nach Erledigung wieder 1 weg. Der
//Startwert ist 1 und nach Erledigung aller
//anderen Zeilen wird 1 subtrahiert. Erst
//bei 0 wird die Ausgabe aus outputText erzeugt.
var count = 1;
var outputText = "";

function writeLine(code, line) {

	//Halbgeviertstrich ersetzen
	line = line.replace(/–/g, '-');

	//Text zusammensetzen
	outputText += code + " " + line + "\n";

	//Lookup für Autoren
	if ((code == "3000" || code == "3010") && line[0] != "!") {
		count++;
		var authorName = line.substring(0,line.indexOf("\n"));
		var lookupUrl = "http://swb.bsz-bw.de/DB=2.104/SET=70/TTL=1/CMD?SGE=&ACT=SRCHM&MATCFILTER=Y&MATCSET=Y&NOSCAN=Y&PARSE_MNEMONICS=N&PARSE_OPWORDS=N&PARSE_OLDSETS=N&IMPLAND=Y&NOABS=Y&ACT0=SRCHA&SHRTST=50&IKT0=1&TRM0=" + authorName +"&ACT1=*&IKT1=2057&TRM1=*&ACT2=*&IKT2=8977&TRM2=S=Y&ACT0=SRCHA&SHRTST=50&IKT0=1&TRM0=" + authorName +"&ACT1=*&IKT1=2057&TRM1=*&ACT2=*&IKT2=8977&TRM2=(theolog*|neutestament*|alttestament*|kirchenhist*)&ACT3=-&IKT3=8978-&TRM3=1[1%2C2%2C3%2C4%2C5%2C6%2C7%2C8][0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9][0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9]?"

		/*lookupUrl kann je nach Anforderung noch spezifiziert werden, im obigen Abfragebeispiel:
		suchen [und] (Person(Phrase: Nachname, Vorname) [PER]) " authorName "
		eingrenzen (Systematiknummer der SWD [SN]) *
		eingrenzen (Relationiertes Schlagwort in der GND [RLS]) theolog*
		ausgenommen (Relationierte Zeit in der GND [RLZ]) 1[1,2,3,4,5,6,7,8][0,1,2,3,4,5,6,7,8,9][0,1,2,3,4,5,6,7,8,9]

		IKT0=1 TRM0= für Persönlicher Name in Picafeld 100
		IKT1=2057 TRM1=3.* für GND-Systematik
		IKT2=8963 TRM2=theolog*    für Berufsbezeichnung 550
		IKT3=8991  TRM3=1[1,2,3,4,5,6,7,8][0,1,2,3,4,5,6,7,8,9][0,1,2,3,4,5,6,7,8,9] für Geburts- und Sterbedatum (Bereich)

		###OPERATOREN vor "IKT"###
		UND-Verknüpfung "&" | ODER-Verknüpfung "%2B&" | Nicht "-&"

		###TYP IKT=Indikatoren|Zweite Spalte Schlüssel(IKT)###
		Liste der Indikatoren und Routine http://swbtools.bsz-bw.de/cgi-bin/help.pl?cmd=idx_list_typ&regelwerk=RDA&verbund=SWB
		*/

		ZU.processDocuments([lookupUrl], function(doc, url){
			var ppn = ZU.xpathText(doc, '//small[a[img]]');
			if (ppn) {
				outputText = outputText.replace(authorName, "!" + ppn.trim() + "!$BVerfasserIn$4aut \n8910 $aixzom$bAutor maschinell zugeordnet");
			}
		}, function() {
			count--;
			if (count === 0) {
				Zotero.write(outputText);
			}
		});
	}
}

function performExport() {
    Z.debug("Begin exporting item(s)...");

    var item;
	while ((item = Zotero.nextItem())) {

		//enrich items based on their ISSN
		if (!item.language && item.ISSN && issn_to_language_code[item.ISSN]) {
			item.language = issn_to_language_code[item.ISSN];
		}
		if (SsgField && item.ISSN && issn_to_ssg[item.ISSN]) {
			SsgField = issn_to_ssg[item.ISSN];
		}
		if (item.volume && item.ISSN && issn_to_volume[item.ISSN]) {
			item.volume = issn_to_volume[item.ISSN] + item.volume;
		}
		if (physicalForm && item.ISSN && issn_to_physical_form[item.ISSN]) {
			physicalForm = issn_to_physical_form[item.ISSN]; // position 1 http://swbtools.bsz-bw.de/winibwhelp/Liste_0500.htm
		}
		if (licenceField && item.ISSN && issn_to_license[item.ISSN]) {
			licenceField = issn_to_license[item.ISSN]; // position 4 http://swbtools.bsz-bw.de/winibwhelp/Liste_0500.htm
		}


		var article = false;
		switch (item.itemType) {
			case "journalArticle":
			case "bookSection":
			case "magazineArticle": // wird bei der Erfassung von Rezensionen verwendet. Eintragsart "Magazin-Artikel" wird manuell geändert.
			case "newspaperArticle":
			case "encyclopediaArticle":
				article = true;
				break;
		}

		//item.type --> 0500 Bibliographische Gattung und Status
		//http://swbtools.bsz-bw.de/winibwhelp/Liste_0500.htm

		if (article && licenceField === "l") { // wenn Position 4 = "l" dann Ooul
			writeLine("0500", physicalForm+"o"+cataloguingStatus+licenceField);
		} else if (article && physicalForm === "A") {
			writeLine("0500", physicalForm+"o"+cataloguingStatus); // //z.B. Aou, Oou, Oox etc.
			} else {
			writeLine("0500", physicalForm+"o"+cataloguingStatusO);
				}

		//item.type --> 0501 Inhaltstyp
		writeLine("0501", "Text$btxt");

		//item.type --> 0502 Medientyp
			switch (physicalForm) {
				case "A":
				writeLine("0502", "ohne Hilfsmittel zu benutzen$bn");
				break;
			case "O":
				writeLine("0502", "Computermedien$bc");
				break;
			default:
				writeLine("0502", "");
		}

		//item.type --> 0503 Datenträgertyp

		switch (physicalForm) {
				case "A":
				writeLine("0503", "Band$bnc");
				break;
			case "O":
				writeLine("0503", "Online-Ressource$bcr");
				break;
			default:
				writeLine("0503", "");
		}
		//item.date --> 1100
		var date = Zotero.Utilities.strToDate(item.date);
		if (date.year !== undefined) {
		writeLine("1100", date.year.toString() + "$n[" + date.year.toString() + "]");
		}

		//1130 Datenträger
		//http://swbtools.bsz-bw.de/winibwhelp/Liste_1130.htm

			switch (physicalForm) {
				case "A":
				writeLine("1130", "druck");
				break;
			case "O":
				writeLine("1130", "cofz");
				break;
			default:
				writeLine("1130", "");
		}

		//1131 Art des Inhalts
		if (item.itemType == "magazineArticle") {
				writeLine("1131", "!209083166!");
			}

		// 1140 Veröffentlichungsart und Inhalt http://swbtools.bsz-bw.de/winibwhelp/Liste_1140.htm
		if (item.itemType == "magazineArticle") {
				writeLine("1140", "uwre");
			}


		//item.language --> 1500 Sprachcodes
		if (item.language) {
			if (language_to_language_code[(item.language)]) {
				item.language = language_to_language_code[item.language];
			}
			writeLine("1500", item.language);
		} else {
			writeLine("1500", defaultLanguage);
		}

		//1505 Katalogisierungsquelle
		writeLine("1505", "$erda");

		//item.ISBN --> 2000 ISBN
		if (item.ISBN) {
			writeLine("2000", item.ISBN);
		}

		//item.DOI --> 2051 bei "Oou" bzw. 2053 bei "Aou"
		if (item.DOI) {
			if (physicalForm === "O") {
				writeLine("2051", item.DOI);
			} else if (physicalForm === "A") {
				writeLine("2053", item.DOI);
			}
		}



		//Titel, erster Autor --> 4000
		var titleStatement = "";
		if (item.shortTitle == "journalArticle") {
			titleStatement += item.shortTitle;
			if (item.title && item.title.length > item.shortTitle.length) {
				titleStatement += "$d" + item.title.substr(item.shortTitle.length).replace(/^\s*:\s*/,'');
			}
		} else {
			titleStatement += item.title.replace(/\s*:\s*/,'$d');
		}
		//Sortierzeichen hinzufügen, vgl. https://github.com/UB-Mannheim/zotkat/files/137992/ARTIKEL.pdf
		if (item.language == "ger" || !item.language) {
			titleStatement = titleStatement.replace(/^(Der|Die|Das|Des|Dem|Den|Ein|Eines|Einem|Eine|Einen|Einer) ([^@])/, "$1 @$2");
		}
		if (item.language == "eng" || !item.language) {
			titleStatement = titleStatement.replace(/^(The|A|An) ([^@])/, "$1 @$2");
		}
		if (item.language == "fre" || !item.language) {
			titleStatement = titleStatement.replace(/^(Le|La|Les|Des|Un|Une) ([^@])/, "$1 @$2");
			titleStatement = titleStatement.replace(/^L'([^@])/, "L' @$1");
		}
		if (item.language == "ita" || !item.language) {
			titleStatement = titleStatement.replace(/^(La|Le|Lo|Gli|I|Il|Un|Una|Uno) ([^@])/, "$1 @$2");
			titleStatement = titleStatement.replace(/^L'([^@])/, "L' @$1");
		}

		if (item.language == "por" || !item.language) {
			titleStatement = titleStatement.replace(/^(A|O|As|Os|Um|Uma|Umas|Uns) ([^@])/, "$1 @$2");
		}
		if (item.language == "spa" || !item.language) {
			titleStatement = titleStatement.replace(/^(El|La|Los|Las|Un|Una|Unos|Unas) ([^@])/, "$1 @$2");
		}


		//Autoren --> 3000, 3010

		var i = 0, content, creator;
		while (item.creators.length>0) {
			creator = item.creators.shift();
			if (creator.creatorType == "author") {
					content = creator.lastName + (creator.firstName ? ", " + creator.firstName : "");
				}
				if (i === 0) {
					writeLine("3000", content + "\n");
					titleStatement += "$h" + (creator.firstName ? creator.firstName + " " : "") + creator.lastName;
				} else {
					writeLine("3010", content + "\n");
				}
				i++;
			}

		writeLine("4000", titleStatement);
		//TODO: editors, other contributors...
		//Ausgabe --> 4020
		if (item.edition) {
			writeLine("4020", item.edition);
		}

		//Erscheinungsvermerk --> 4030
		if (!article) {
			var publicationStatement = "";
			if (item.place) { publicationStatement += item.place; }
			if (item.publisher) { publicationStatement +=  "$n" + item.publisher; }
			writeLine("4030", publicationStatement);
		}


		//4070 $v Bandzählung $j Jahr $h Heftnummer $p Seitenzahl
		if (item.itemType == "journalArticle" || item.itemType == "magazineArticle") {
			var volumeyearissuepage = "";
			if (item.volume) { volumeyearissuepage += "$v" + item.volume; }
			if (date.year !== undefined) { volumeyearissuepage +=  "$j" + date.year; }
			if (item.issue) { volumeyearissuepage += "$h" + item.issue.replace("-", "/").replace(/^0/, ""); }
			if (item.pages) { volumeyearissuepage += "$p" + item.pages; }

			writeLine("4070", volumeyearissuepage);
		}

		//URL --> 4085 nur bei Katalogisierung nach "Oox" im Feld 0500
		if (item.url && physicalForm === "O" && licenceField === "l") {
			writeLine("4085", "$u" + item.url + "$xH$xR$zLF");
			} else if (item.url && physicalForm === "O") {
				writeLine("4085", "$u" + item.url + "$xH");
			}


		if (item.url && item.itemType == "magazineArticle") {
			writeLine("4085", "$u" + item.url + "$xH");
		}

		//Reihe --> 4110
		if (!article) {
			var seriesStatement = "";
			if (item.series) {
				seriesStatement += item.series;
			}
			if (item.seriesNumber) {
				seriesStatement += " ; " + item.seriesNumber;
			}
			writeLine("4110", seriesStatement);
		}

		//Inhaltliche Zusammenfassung -->4207
		if (item.abstractNote) {
			writeLine("4207", item.abstractNote.replace("<i>", "\'").replace("</i>", "\'").replace("<br/>", "").replace("Zusammenfassung", "").replace(" Summary", "").replace("", "").replace(/–/g, '-').replace(/&#160;/g, ""));
		}

		/* } else (!item.abstractNote){
			writeLine("4207");
			}

		"4207", item.abstractNote.replace(/'/g, '\"').replace("<i>", "\'").replace("</i>", "\'").replace("<br/>", "").replace("Zusammenfassung", "").replace(" Summary", "").replace("", "")); */

		//item.publicationTitle --> 4241 Beziehungen zur größeren Einheit
		if (item.itemType == "journalArticle" || item.itemType == "magazineArticle") {
			if (item.ISSN && issn_to_superior_ppn[ZU.cleanISSN(item.ISSN)]) {
				writeLine("4241", "Enthalten in" + issn_to_superior_ppn[ZU.cleanISSN(item.ISSN)]);
			} else if (item.publicationTitle) {
				writeLine("4241", "Enthalten in"  + item.publicationTitle);
			}

		//4261 Themenbeziehungen (Beziehung zu der Veröffentlichung, die beschrieben wird)|case:magazineArticle
		if (item.itemType == "magazineArticle") {
				writeLine("4261", "Rezension von" + item.publicationTitle); // zwischen den Ausrufezeichen noch die PPN des rezensierten Werkes manuell einfügen.
			}

		//SSG bzw. FID-Nummer --> 5056 "0" = Religionwissenschaft | "1" = Theologie | "0; 1" = RW & Theol.

		if (SsgField === "0" || SsgField === "0; 1" || SsgField === "FID-KRIM-DE-21") {
			writeLine("5056", SsgField);
		} 	else {
			writeLine("5056", defaultSsgNummer);
		}



		if (item.itemType == "journalArticle") {
			writeLine ("",lokaldatensatz);
		}
	//Schlagwörter aus einem Thesaurus (Fremddaten) --> 5520 (oder alternativ siehe Mapping)
                if (item.ISSN && issn_to_keyword_field[ZU.cleanISSN(item.ISSN)]) {
                        var ISSNclean = ZU.cleanISSN(item.ISSN);
                        var codeBase = issn_to_keyword_field[ISSNclean];
                        for (i=0; i<item.tags.length; i++) {
                                var code = codeBase + i;
                                writeLine(code, "|s|" + item.tags[i].tag.replace(/\s?--\s?/g, '; '));
                        }
                } else {
                        for (i=0; i<item.tags.length; i++) {
                                writeLine("5520", "|s|" + item.tags[i].tag.replace(/\s?--\s?/g, '; '));
                        }
                }
		}
		outputText;
	}
	count--;
	if (count === 0) {
		Zotero.write(outputText);
    }
    Z.debug("Done exporting item(s)!");
}

function doExport() {
	Z.debug("Populating ISSN mapping tables...");

	ZU.doGet([
            zts_enhancement_repo_url + "ISSN_to_keyword_field.map",
            zts_enhancement_repo_url + "ISSN_to_language_code.map",
            zts_enhancement_repo_url + "ISSN_to_licence.map",
            zts_enhancement_repo_url + "ISSN_to_physical_form.map",
            zts_enhancement_repo_url + "ISSN_to_SSG.map",
            zts_enhancement_repo_url + "ISSN_to_superior_ppn.map",
            zts_enhancement_repo_url + "ISSN_to_volume.map",
            zts_enhancement_repo_url + "language_to_language_code.map",
            ], function (responseText, request, url) {
                switch (responseText) {
                    case "404: Not Found":
                        Z.debug("Error: 404 for url " + url);
                        break;
                    default:
                        populateISSNMaps(responseText, url);
                }
            }, function () {
                if (downloaded_map_files != max_map_files)
                    throw "Some map files were not downloaded!";

                performExport();
            });
}
