const fs = require('fs')

const teiHeader = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
   <teiHeader>
      <fileDesc>
         <titleStmt>
            <title>Smeraldina kikimora</title>
         </titleStmt>
         <publicationStmt>
            <publisher>Università Ca' Foscari di Venezia - VeDPH</publisher>
            <date>December 2021</date>
            <availability>
               <licence target="http://creativecommons.org/licenses/by-nc/3.0/deed.en_US"
                  >Distributed under a Creative Commons Attribution-NonCommercial 3.0 Unported
                  License</licence>
            </availability>
         </publicationStmt>
         <sourceDesc>
            <p>Information about the source</p>
         </sourceDesc>
      </fileDesc>
      <profileDesc>
         <langUsage>
            <language ident="it">Italian</language>
         </langUsage>
      </profileDesc>
   </teiHeader>
   <text>
     <body>
      <div>
       <ab>
`;

try {
  const data = fs.readFileSync('arlequin.txt', 'utf8')

  console.log(teiHeader);

  for (let line of data.split("\n")) {
    console.log(line.trim() + "<lb/>")
  }
  console.log(" </ab>");
  console.log(" </div>");
  console.log(" </body>");
  console.log(" </text>");
  console.log("</TEI>");

} catch (err) {
  console.log("Unable to open the file `file.txt`");
}
